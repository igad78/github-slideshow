import axios from 'axios';
import logger from '../utils/logger.js';

const BASE_URL = 'https://api.hubapi.com';

function headers() {
  return {
    Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create a new contact in HubSpot.
 * @param {{ email: string, firstname?: string, lastname?: string, phone?: string, company?: string }} data
 */
export async function createContact(data) {
  try {
    const response = await axios.post(
      `${BASE_URL}/crm/v3/objects/contacts`,
      { properties: data },
      { headers: headers() }
    );
    logger.success(`HubSpot contact created: ${data.email}`);
    return response.data;
  } catch (err) {
    logger.error('HubSpot createContact failed', err);
    throw err;
  }
}

/**
 * Update a deal in HubSpot.
 * @param {string} dealId
 * @param {object} data — deal properties to update
 */
export async function updateDeal(dealId, data) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/crm/v3/objects/deals/${dealId}`,
      { properties: data },
      { headers: headers() }
    );
    logger.success(`HubSpot deal updated: ${dealId}`);
    return response.data;
  } catch (err) {
    logger.error(`HubSpot updateDeal failed for deal ${dealId}`, err);
    throw err;
  }
}

/**
 * Get the last 10 contacts from HubSpot.
 */
export async function getRecentContacts() {
  try {
    const response = await axios.get(`${BASE_URL}/crm/v3/objects/contacts`, {
      headers: headers(),
      params: { limit: 10, sort: '-createdate', properties: 'email,firstname,lastname,createdate' },
    });
    logger.info(`HubSpot: fetched ${response.data.results?.length ?? 0} recent contacts`);
    return response.data.results ?? [];
  } catch (err) {
    logger.error('HubSpot getRecentContacts failed', err);
    return [];
  }
}
