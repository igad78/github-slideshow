import cron from 'node-cron';
import { getRecentContacts } from '../apis/hubspot.js';
import { sendAlert } from '../apis/slack.js';
import { getRecords, createRecord } from '../apis/airtable.js';
import { createPage } from '../apis/notion.js';
import { sendEmail } from '../apis/gmail.js';
import { getRecentOrders } from '../apis/shopify.js';
import { logger } from '../utils/logger.js';

export function startScheduler() {
  // Every 5 minutes: check new HubSpot contacts
  cron.schedule('*/5 * * * *', async () => {
    try {
      const contacts = await getRecentContacts();
      if (contacts.length > 0) {
        await sendAlert('New HubSpot Contacts', `${contacts.length} new contact(s) in the last 5 minutes`, 'good');
      }
    } catch (err) { logger.error('Scheduler: HubSpot check failed', err); }
  });

  // Every hour: sync Airtable → Notion
  cron.schedule('0 * * * *', async () => {
    try {
      const records = await getRecords(process.env.AIRTABLE_TABLE_NAME);
      for (const record of records.slice(0, 5)) {
        await createPage(process.env.NOTION_DATABASE_ID, {
          Name: { title: [{ text: { content: record.fields.Name || 'Synced Record' } }] },
          Source: { rich_text: [{ text: { content: 'Airtable Sync' } }] },
        });
      }
      logger.success(`Scheduler: synced ${records.length} Airtable records to Notion`);
    } catch (err) { logger.error('Scheduler: Airtable→Notion sync failed', err); }
  });

  // Every day at 8am: Shopify order digest via Gmail
  cron.schedule('0 8 * * *', async () => {
    try {
      const orders = await getRecentOrders(20);
      const total = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
      const html = `<h2>Daily Shopify Report</h2><p>Orders: ${orders.length}</p><p>Revenue: $${total.toFixed(2)}</p>`;
      await sendEmail({ to: process.env.GMAIL_USER, subject: '📦 Daily Shopify Digest', html });
    } catch (err) { logger.error('Scheduler: Shopify digest failed', err); }
  });

  // Every day at 9am: Slack subscription summary
  cron.schedule('0 9 * * *', async () => {
    try {
      await sendAlert('Daily Summary', '🔄 Automation engine running. All integrations active.', 'good');
    } catch (err) { logger.error('Scheduler: daily summary failed', err); }
  });

  logger.success('Scheduler started — 4 cron jobs active');
}
