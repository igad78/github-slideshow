/* ── Automation Engine Dashboard ── dashboard.js ── */
'use strict';

// ── Constants ──────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 5000;

const INTEGRATION_META = {
  hubspot:        { label: 'HubSpot',         labelAr: 'هاب سبوت'        },
  stripe:         { label: 'Stripe',           labelAr: 'سترايب'           },
  slack:          { label: 'Slack',            labelAr: 'سلاك'             },
  notion:         { label: 'Notion',           labelAr: 'نوشن'             },
  airtable:       { label: 'Airtable',         labelAr: 'إيرتيبل'          },
  gmail:          { label: 'Gmail',            labelAr: 'جيميل'            },
  shopify:        { label: 'Shopify',          labelAr: 'شوبيفاي'          },
  sportsPipeline: { label: 'Sports Pipeline',  labelAr: 'خط أنابيب الرياضة' },
};

// ── DOM helpers ───────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatUptime = (seconds) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// ── Sidebar integration dots ──────────────────────────────────────────────────
const renderSidebar = (integrations) => {
  integrations.forEach(({ id, active }) => {
    const dot = $(`#dot-${id}`);
    if (!dot) return;
    dot.className = `status-dot ${active ? 'dot-green' : 'dot-red'}`;
    dot.title = active ? 'نشط / Active' : 'غير نشط / Inactive';
  });
};

// ── Event log table ───────────────────────────────────────────────────────────
const renderEventLog = (events) => {
  const tbody = $('#event-tbody');
  if (!tbody) return;

  if (!events || events.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">لا توجد أحداث / No events yet</td></tr>';
    return;
  }

  tbody.innerHTML = events.map(({ timestamp, eventType, platforms, status }) => {
    const statusClass = status === 'ok' ? 'badge-ok' : 'badge-error';
    const statusLabel = status === 'ok' ? '✓ OK' : '✗ Error';
    const platformList = (platforms || []).join(', ') || '—';
    return `
      <tr>
        <td class="mono">${formatTime(timestamp)}</td>
        <td>${eventType || '—'}</td>
        <td>${platformList}</td>
        <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      </tr>`;
  }).join('');
};

// ── Sports pipeline section ───────────────────────────────────────────────────
const renderSports = ({ lastRun, matchesProcessed, videosPublished, status, lastMatch }) => {
  const el = (id) => $(`#sports-${id}`);
  if (el('last-run'))           el('last-run').textContent         = formatTime(lastRun);
  if (el('matches'))            el('matches').textContent          = matchesProcessed ?? 0;
  if (el('videos'))             el('videos').textContent           = videosPublished  ?? 0;
  if (el('last-match'))         el('last-match').textContent       = lastMatch || '—';
  if (el('status')) {
    el('status').textContent  = status || 'idle';
    el('status').className    = `sports-status-badge sports-${status || 'idle'}`;
  }
};

// ── Uptime ────────────────────────────────────────────────────────────────────
const renderUptime = (seconds) => {
  const el = $('#uptime');
  if (el) el.textContent = formatUptime(seconds);
};

// ── Fetch and render ──────────────────────────────────────────────────────────
const fetchAndRender = async () => {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    renderUptime(data.uptime ?? 0);
    renderSidebar(data.activeIntegrations ?? []);
    renderEventLog(data.lastEvents ?? []);
    renderSports(data.sportsPipeline ?? {});

    const indicator = $('#connection-dot');
    if (indicator) { indicator.className = 'status-dot dot-green'; indicator.title = 'Connected'; }
  } catch (err) {
    console.error('Status fetch failed:', err);
    const indicator = $('#connection-dot');
    if (indicator) { indicator.className = 'status-dot dot-red'; indicator.title = 'Disconnected'; }
  }
};

// ── "Run Sports Pipeline Now" button ─────────────────────────────────────────
const handleRunSports = async () => {
  const btn = $('#btn-run-sports');
  const out = $('#sports-run-result');
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = '⏳ جاري التشغيل… / Running…';
  if (out) { out.textContent = ''; out.className = 'run-result'; }

  try {
    const res = await fetch('/run-sports', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (out) {
      out.textContent = res.ok
        ? `✓ نجح / Success — matches: ${data.result?.matchesProcessed ?? 0}, videos: ${data.result?.videosPublished ?? 0}`
        : `✗ خطأ / Error: ${data.error || 'Unknown error'}`;
      out.className = `run-result ${res.ok ? 'result-ok' : 'result-error'}`;
    }
  } catch (err) {
    if (out) { out.textContent = `✗ Network error: ${err.message}`; out.className = 'run-result result-error'; }
  } finally {
    btn.disabled = false;
    btn.textContent = '▶ شغّل خط أنابيب الرياضة / Run Sports Pipeline Now';
    await fetchAndRender();
  }
};

// ── "Test Webhook" button ────────────────────────────────────────────────────
const SAMPLE_WEBHOOK_PAYLOAD = {
  platform: 'manual',
  eventType: 'test_event',
  data: { message: 'Dashboard test webhook', timestamp: new Date().toISOString() },
};

const handleTestWebhook = async () => {
  const btn = $('#btn-test-webhook');
  const out = $('#webhook-result');
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = '⏳ إرسال… / Sending…';
  if (out) { out.textContent = ''; out.className = 'run-result'; }

  try {
    const res = await fetch('/webhooks/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...SAMPLE_WEBHOOK_PAYLOAD, data: { ...SAMPLE_WEBHOOK_PAYLOAD.data, timestamp: new Date().toISOString() } }),
    });
    const data = await res.json();
    if (out) {
      out.textContent = res.ok
        ? `✓ تم الإرسال / Sent — received: ${JSON.stringify(data.received?.eventType)}`
        : `✗ خطأ / Error: ${data.error || 'Unknown'}`;
      out.className = `run-result ${res.ok ? 'result-ok' : 'result-error'}`;
    }
  } catch (err) {
    if (out) { out.textContent = `✗ Network error: ${err.message}`; out.className = 'run-result result-error'; }
  } finally {
    btn.disabled = false;
    btn.textContent = '🔔 اختبار Webhook / Test Webhook';
    await fetchAndRender();
  }
};

// ── Boot ──────────────────────────────────────────────────────────────────────
const init = () => {
  // Attach button handlers
  const runBtn  = $('#btn-run-sports');
  const testBtn = $('#btn-test-webhook');
  if (runBtn)  runBtn.addEventListener('click', handleRunSports);
  if (testBtn) testBtn.addEventListener('click', handleTestWebhook);

  // Initial fetch then poll
  fetchAndRender();
  setInterval(fetchAndRender, POLL_INTERVAL_MS);
};

document.addEventListener('DOMContentLoaded', init);
