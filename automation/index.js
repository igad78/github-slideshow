import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config/apis.js';
import webhookRouter from './triggers/webhook.js';
import { startScheduler } from './triggers/scheduler.js';
import { runPipeline } from './sports/pipeline.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── In-memory state for the dashboard ─────────────────────────────────────────
const dashboardState = {
  startTime: Date.now(),
  lastEvents: [],
  sportsPipeline: {
    lastRun: null,
    matchesProcessed: 0,
    videosPublished: 0,
    status: 'idle',
    lastMatch: null,
  },
};

/** Append an event to the rolling 10-entry log. */
const logDashboardEvent = ({ eventType, platforms = [], status = 'ok', meta = {} }) => {
  dashboardState.lastEvents.unshift({ timestamp: new Date().toISOString(), eventType, platforms, status, meta });
  if (dashboardState.lastEvents.length > 10) dashboardState.lastEvents.length = 10;
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Raw body needed for Stripe webhook signature verification
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve the browser dashboard from public/
app.use(express.static(join(__dirname, 'public')));

// Routes
app.use('/webhooks', webhookRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    integrations: {
      claude: !!process.env.ANTHROPIC_API_KEY,
      hubspot: !!process.env.HUBSPOT_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      slack: !!process.env.SLACK_BOT_TOKEN,
      notion: !!process.env.NOTION_API_KEY,
      airtable: !!process.env.AIRTABLE_API_KEY,
      gmail: !!process.env.GMAIL_USER,
      shopify: !!process.env.SHOPIFY_STORE_URL,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      tiktok: !!process.env.TIKTOK_ACCESS_TOKEN,
      youtube: !!process.env.YOUTUBE_API_KEY,
      instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
    },
  });
});

app.post('/run-sports', async (req, res) => {
  try {
    logger.info('Manual sports pipeline trigger received');
    dashboardState.sportsPipeline.status  = 'running';
    dashboardState.sportsPipeline.lastRun = new Date().toISOString();

    const summary = await runPipeline();

    dashboardState.sportsPipeline.status           = 'ok';
    dashboardState.sportsPipeline.matchesProcessed += summary?.matchesProcessed ?? 1;
    dashboardState.sportsPipeline.videosPublished  += summary?.videosPublished  ?? 0;
    if (summary?.lastMatch) dashboardState.sportsPipeline.lastMatch = summary.lastMatch;

    logDashboardEvent({
      eventType: 'sports_pipeline_run',
      platforms: ['YouTube', 'Slack'],
      status: 'ok',
      meta: summary ?? {},
    });

    res.json({ success: true, summary });
  } catch (err) {
    logger.error('Manual sports pipeline trigger failed', err);
    dashboardState.sportsPipeline.status = 'error';
    logDashboardEvent({ eventType: 'sports_pipeline_run', platforms: [], status: 'error', meta: { error: err.message } });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/status — dashboard polling endpoint ───────────────────────────────
app.get('/api/status', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - dashboardState.startTime) / 1000);

  // Build integration list from env-var presence
  const activeIntegrations = [
    { id: 'hubspot',        label: 'HubSpot',         active: !!process.env.HUBSPOT_API_KEY    },
    { id: 'stripe',         label: 'Stripe',           active: !!process.env.STRIPE_SECRET_KEY  },
    { id: 'slack',          label: 'Slack',            active: !!process.env.SLACK_BOT_TOKEN    },
    { id: 'notion',         label: 'Notion',           active: !!process.env.NOTION_API_KEY     },
    { id: 'airtable',       label: 'Airtable',         active: !!process.env.AIRTABLE_API_KEY   },
    { id: 'gmail',          label: 'Gmail',            active: !!process.env.GMAIL_USER         },
    { id: 'shopify',        label: 'Shopify',          active: !!process.env.SHOPIFY_STORE_URL  },
    { id: 'sportsPipeline', label: 'Sports Pipeline',  active: dashboardState.sportsPipeline.status !== 'idle' },
  ];

  res.json({
    uptime: uptimeSeconds,
    activeIntegrations,
    lastEvents:     dashboardState.lastEvents,
    sportsPipeline: dashboardState.sportsPipeline,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Express error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);

  // Validate and log API config summary
  config.validate();

  // Start cron scheduler
  try {
    startScheduler();
    logger.success('Scheduler started — cron jobs active');
  } catch (err) {
    logger.error('Failed to start scheduler', err);
  }

  // Start sports pipeline on 60-second interval
  let pipelineRunning = false;
  const runProtected = async () => {
    if (pipelineRunning) {
      logger.warn('Sports pipeline still running, skipping this tick');
      return;
    }
    pipelineRunning = true;
    dashboardState.sportsPipeline.status  = 'running';
    dashboardState.sportsPipeline.lastRun = new Date().toISOString();
    try {
      const summary = await runPipeline();
      dashboardState.sportsPipeline.status           = 'ok';
      dashboardState.sportsPipeline.matchesProcessed += summary?.matchesProcessed ?? 1;
      dashboardState.sportsPipeline.videosPublished  += summary?.videosPublished  ?? 0;
      if (summary?.lastMatch) dashboardState.sportsPipeline.lastMatch = summary.lastMatch;
      logDashboardEvent({ eventType: 'sports_pipeline_scheduled', platforms: ['YouTube'], status: 'ok', meta: summary ?? {} });
    } catch (err) {
      logger.error('Sports pipeline interval error', err);
      dashboardState.sportsPipeline.status = 'error';
      logDashboardEvent({ eventType: 'sports_pipeline_scheduled', platforms: [], status: 'error', meta: { error: err.message } });
    } finally {
      pipelineRunning = false;
    }
  };

  setInterval(runProtected, 60_000);
  logger.info('Sports pipeline scheduled every 60 seconds');

  logger.info('=== Startup complete ===');
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`Manual sports trigger: POST http://localhost:${PORT}/run-sports`);
  logger.info(`Webhooks: POST http://localhost:${PORT}/webhooks/{stripe|hubspot|shopify|manual}`);
});
