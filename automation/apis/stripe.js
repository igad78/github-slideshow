import Stripe from 'stripe';
import logger from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

/**
 * Retrieve a customer's active subscription.
 * @param {string} customerId
 */
export async function getSubscription(customerId) {
  try {
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1, status: 'active' });
    logger.info(`Stripe: retrieved subscription for customer ${customerId}`);
    return subscriptions.data[0] ?? null;
  } catch (err) {
    logger.error(`Stripe getSubscription failed for customer ${customerId}`, err);
    throw err;
  }
}

/**
 * Create a Stripe payment link.
 * @param {string} priceId
 * @param {number} quantity
 */
export async function createPaymentLink(priceId, quantity = 1) {
  try {
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity }],
    });
    logger.success(`Stripe payment link created: ${paymentLink.url}`);
    return paymentLink;
  } catch (err) {
    logger.error('Stripe createPaymentLink failed', err);
    throw err;
  }
}

/**
 * Verify and parse a Stripe webhook payload.
 * @param {Buffer} rawBody
 * @param {string} signature — value of the stripe-signature header
 * @returns {Stripe.Event}
 */
export function handleWebhook(rawBody, signature) {
  try {
    const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    logger.info(`Stripe webhook verified: ${event.type}`);
    return event;
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', err);
    throw err;
  }
}
