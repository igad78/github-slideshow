import Airtable from 'airtable';
import logger from '../utils/logger.js';

function getBase() {
  Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY });
  return new Airtable().base(process.env.AIRTABLE_BASE_ID);
}

/**
 * Create a record in an Airtable table.
 * @param {string} tableName
 * @param {object} fields
 */
export async function createRecord(tableName, fields) {
  try {
    const base = getBase();
    const [record] = await base(tableName).create([{ fields }]);
    logger.success(`Airtable record created in ${tableName}: ${record.id}`);
    return record;
  } catch (err) {
    logger.error(`Airtable createRecord failed in table ${tableName}`, err);
    throw err;
  }
}

/**
 * Retrieve records from an Airtable table with an optional formula filter.
 * @param {string} tableName
 * @param {string} [filterFormula] — Airtable formula string, e.g. "{Status}='Active'"
 */
export async function getRecords(tableName, filterFormula) {
  try {
    const base = getBase();
    const options = {};
    if (filterFormula) options.filterByFormula = filterFormula;

    const records = await base(tableName).select(options).all();
    logger.info(`Airtable: fetched ${records.length} records from ${tableName}`);
    return records;
  } catch (err) {
    logger.error(`Airtable getRecords failed for table ${tableName}`, err);
    return [];
  }
}

/**
 * Update fields on an Airtable record.
 * @param {string} tableName
 * @param {string} recordId
 * @param {object} fields
 */
export async function updateRecord(tableName, recordId, fields) {
  try {
    const base = getBase();
    const record = await base(tableName).update(recordId, fields);
    logger.success(`Airtable record updated in ${tableName}: ${recordId}`);
    return record;
  } catch (err) {
    logger.error(`Airtable updateRecord failed for record ${recordId}`, err);
    throw err;
  }
}
