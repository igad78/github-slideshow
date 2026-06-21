import axios from 'axios';
import { config } from '../config/apis.js';
import { logger } from '../utils/logger.js';

const client = axios.create({
  baseURL: `https://${config.shopify.storeUrl}/admin/api/2024-01`,
  headers: {
    'X-Shopify-Access-Token': config.shopify.accessToken,
    'Content-Type': 'application/json',
  },
});

export async function getProducts() {
  try {
    const { data } = await client.get('/products.json?limit=50');
    logger.success(`Shopify: fetched ${data.products.length} products`);
    return data.products;
  } catch (err) {
    logger.error('Shopify getProducts failed', err);
    return [];
  }
}

export async function createOrder(lineItems, customer) {
  try {
    const { data } = await client.post('/draft_orders.json', {
      draft_order: { line_items: lineItems, customer },
    });
    logger.success(`Shopify: draft order created — ${data.draft_order.id}`);
    return data.draft_order;
  } catch (err) {
    logger.error('Shopify createOrder failed', err);
  }
}

export async function getRecentOrders(limit = 10) {
  try {
    const { data } = await client.get(`/orders.json?limit=${limit}&status=any`);
    logger.success(`Shopify: fetched ${data.orders.length} recent orders`);
    return data.orders;
  } catch (err) {
    logger.error('Shopify getRecentOrders failed', err);
    return [];
  }
}
