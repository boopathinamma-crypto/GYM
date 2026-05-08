const Razorpay = require('razorpay');
const Stripe = require('stripe');
const crypto = require('crypto');
const logger = require('../utils/logger');

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe not configured');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// ─── Razorpay ─────────────────────────────────────────────────────────────────
const createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes }) => {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency,
    receipt,
    notes,
  });
  logger.info(`Razorpay order created: ${order.id}`);
  return order;
};

const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

const fetchRazorpayPayment = async (paymentId) => {
  const razorpay = getRazorpay();
  return await razorpay.payments.fetch(paymentId);
};

const refundRazorpayPayment = async (paymentId, amount) => {
  const razorpay = getRazorpay();
  return await razorpay.payments.refund(paymentId, { amount: amount * 100 });
};

// ─── Stripe ───────────────────────────────────────────────────────────────────
const createStripePaymentIntent = async ({ amount, currency, metadata }) => {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  logger.info(`Stripe PaymentIntent created: ${paymentIntent.id}`);
  return paymentIntent;
};

const retrieveStripePaymentIntent = async (paymentIntentId) => {
  const stripe = getStripe();
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};

const createStripeSubscription = async ({ customerId, priceId }) => {
  const stripe = getStripe();
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
};

const handleStripeWebhook = async (payload, signature) => {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
};

const refundStripePayment = async (paymentIntentId, amount) => {
  const stripe = getStripe();
  return await stripe.refunds.create({ payment_intent: paymentIntentId, amount });
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  refundRazorpayPayment,
  createStripePaymentIntent,
  retrieveStripePaymentIntent,
  createStripeSubscription,
  handleStripeWebhook,
  refundStripePayment,
};
