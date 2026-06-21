import { processBusinessEvent } from '../apis/claude.js';
import { createContact, updateDeal } from '../apis/hubspot.js';
import { sendAlert } from '../apis/slack.js';
import { createPage } from '../apis/notion.js';
import { createRecord } from '../apis/airtable.js';
import { sendEmail } from '../apis/gmail.js';
import { logger } from '../utils/logger.js';

const eventLog = [];

export async function routeEvent(eventType, data) {
  logger.info(`Routing event: ${eventType}`);
  const result = { eventType, timestamp: new Date().toISOString(), actions: [] };

  try {
    // Hardcoded conditional logic rules
    if (eventType === 'stripe.payment_intent.succeeded') {
      const amount = data.amount / 100;
      if (amount > 1000) {
        await sendAlert('💰 High-Value Payment', `$${amount} received`, 'good');
        await createPage(process.env.NOTION_DATABASE_ID, {
          Name: { title: [{ text: { content: `Payment $${amount}` } }] },
        });
        result.actions.push('slack:high-value-alert', 'notion:page-created');
      }
    }

    if (eventType === 'hubspot.contact.creation') {
      const name = `${data.properties?.firstname || ''} ${data.properties?.lastname || ''}`.trim();
      await createRecord(process.env.AIRTABLE_TABLE_NAME, { Name: name, Source: 'HubSpot', Status: 'New' });
      await sendEmail({ to: data.properties?.email, subject: 'Welcome!', html: `<p>Hi ${name}, welcome aboard!</p>` });
      await sendAlert('👤 New Contact', `${name} added to HubSpot`, 'good');
      result.actions.push('airtable:record-created', 'gmail:welcome-sent', 'slack:notified');
    }

    if (eventType === 'orders/create' || eventType === 'shopify.order.created') {
      await createPage(process.env.NOTION_DATABASE_ID, {
        Name: { title: [{ text: { content: `Order #${data.order_number || data.id}` } }] },
      });
      await sendAlert('🛍️ New Shopify Order', `Order #${data.order_number} — $${data.total_price}`, 'good');
      result.actions.push('notion:task-created', 'slack:order-alert');
    }

    // Claude AI fallback for unknown event types
    if (result.actions.length === 0) {
      const plan = await processBusinessEvent(eventType, data);
      if (plan?.priority === 'high') {
        await sendAlert('🤖 AI Action', plan.summary, 'warning');
        result.actions.push('slack:ai-alert');
      }
      result.aiPlan = plan;
    }

  } catch (err) {
    logger.error(`routeEvent failed for ${eventType}`, err);
    result.error = err.message;
  }

  eventLog.unshift(result);
  if (eventLog.length > 100) eventLog.pop();
  logger.success(`Event routed: ${eventType} → ${result.actions.join(', ') || 'no actions'}`);
  return result;
}

export function getEventLog() { return eventLog.slice(0, 10); }
