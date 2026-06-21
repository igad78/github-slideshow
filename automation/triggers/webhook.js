import { Router } from 'express';
import { handleWebhook } from '../apis/stripe.js';
import { routeEvent } from '../actions/router.js';
import { logger } from '../utils/logger.js';

export const webhookRouter = Router();

webhookRouter.post('/stripe', async (req, res) => {
  try {
    const event = handleWebhook(req.rawBody, req.headers['stripe-signature']);
    if (!event) return res.status(400).send('Invalid signature');
    await routeEvent(`stripe.${event.type}`, event.data.object);
    res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook error', err);
    res.status(500).json({ error: err.message });
  }
});

webhookRouter.post('/hubspot', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const event of events) {
      await routeEvent(`hubspot.${event.subscriptionType}`, event);
    }
    res.json({ received: true });
  } catch (err) {
    logger.error('HubSpot webhook error', err);
    res.status(500).json({ error: err.message });
  }
});

webhookRouter.post('/shopify', async (req, res) => {
  try {
    const topic = req.headers['x-shopify-topic']?.replace('/', '.') || 'shopify.unknown';
    await routeEvent(topic, req.body);
    res.json({ received: true });
  } catch (err) {
    logger.error('Shopify webhook error', err);
    res.status(500).json({ error: err.message });
  }
});

webhookRouter.post('/manual', async (req, res) => {
  try {
    const { eventType = 'manual.test', data = {} } = req.body;
    const result = await routeEvent(eventType, data);
    res.json({ result });
  } catch (err) {
    logger.error('Manual webhook error', err);
    res.status(500).json({ error: err.message });
  }
});
