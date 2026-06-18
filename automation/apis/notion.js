import { Client } from '@notionhq/client';
import logger from '../utils/logger.js';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * Create a new page in a Notion database.
 * @param {string} databaseId
 * @param {object} properties — Notion property objects
 */
export async function createPage(databaseId, properties) {
  try {
    const page = await notion.pages.create({ parent: { database_id: databaseId }, properties });
    logger.success(`Notion page created: ${page.id}`);
    return page;
  } catch (err) {
    logger.error('Notion createPage failed', err);
    throw err;
  }
}

/**
 * Query a Notion database.
 * @param {string} databaseId
 * @param {object} [filter] — optional Notion filter object
 */
export async function queryDatabase(databaseId, filter) {
  try {
    const payload = { database_id: databaseId };
    if (filter) payload.filter = filter;
    const response = await notion.databases.query(payload);
    logger.info(`Notion query returned ${response.results.length} results`);
    return response.results;
  } catch (err) {
    logger.error('Notion queryDatabase failed', err);
    throw err;
  }
}

/**
 * Update properties of an existing Notion page.
 * @param {string} pageId
 * @param {object} properties — Notion property objects to update
 */
export async function updatePage(pageId, properties) {
  try {
    const page = await notion.pages.update({ page_id: pageId, properties });
    logger.success(`Notion page updated: ${pageId}`);
    return page;
  } catch (err) {
    logger.error(`Notion updatePage failed for page ${pageId}`, err);
    throw err;
  }
}
