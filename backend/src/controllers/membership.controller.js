const { MembershipPlan, Membership, Payment } = require('../models/Membership');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/error.middleware');
const paymentService = require('../services/payment.service');
const notificationService = require('../services/notification.service');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');

// ─── Plans ────────────────────────────────────────────────────────────────────
exports.getPlans = asyncHandler(async (req, res) => {
  const cacheKey = 'membership:plans';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', data: { plans: cached } });

  const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 });
  await cacheSet(cacheKey, plans, 3600);
  res.status(200).json({ status: 'success', data: { plans } });
});

exports.createPlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.create(req.body);
  await cacheDel('membership:plans');
  res.status(201).json({ status: 'success', data: { plan } });
});

exports.updatePlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!plan) throw new AppError('Plan not found.', 404);
  await cacheDel('membership:plans');
  res.status(200).json({ status: 'success', data: { plan } });
});

exports.deletePlan = asyncHandler(async (req, res) => {
  await MembershipPlan.findByIdAndUpdate(req.params.id, { isActive: false });
  await cacheDel('membership:plans');
  res.status(200).json({ status: 'success', message: 'Plan deactivated.' });
});

// ─── My Membership ────────────────────────────────────────────────────────────
exports.getMyMembership = asyncHandler(async (req, res) => {
  const membership = await Membership.findOne({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('plan');

  res.status(200).json({ status: 'success', data: { membership: membership || null } });
});

// ─── Initiate Payment (Razorpay) ──────────────────────────────────────────────
exports.initiatePayment = asyncHandler(async (req, res) => {
  const { planId, method = 'razorpay' } = req.body;

  const plan = await MembershipPlan.findById(planId);
  if (!plan) throw new AppError('Membership plan not found.', 404);

  const existingActive = await Membership.findOne({ user: req.user._id, status: 'active' });
  if (existingActive) throw new AppError('You already have an active membership.', 409);

  let paymentData;
  if (method === 'razorpay') {
    paymentData = await paymentService.createRazorpayOrder({
      amount: plan.price,
      currency: plan.currency || 'INR',
      receipt: `membership_${req.user._id}_${Date.now()}`,
      notes: { userId: req.user._id.toString(), planId: plan._id.toString() },
    });
  } else if (method === 'stripe') {
    paymentData = await paymentService.createStripePaymentIntent({
      amount: plan.price * 100, // Stripe uses smallest currency unit
      currency: (plan.currency || 'INR').toLowerCase(),
      metadata: { userId: req.user._id.toString(), planId: plan._id.toString() },
    });
  }

  // Create pending payment record
  await Payment.create({
    user: req.user._id,
    amount: plan.price,
    currency: plan.currency || 'INR',
    status: 'pending',
    method,
    ...(method === 'razorpay' && { razorpayOrderId: paymentData.id }),
    ...(method === 'stripe' && { stripePaymentIntentId: paymentData.id }),
    metadata: { planId: plan._id },
  });

  res.status(200).json({
    status: 'success',
    data: {
      paymentData,
      plan: { name: plan.name, price: plan.price, currency: plan.currency },
      keyId: method === 'razorpay' ? process.env.RAZORPAY_KEY_ID : null,
    },
  });
});

// ─── Verify & Activate Membership ─────────────────────────────────────────────
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature, stripePaymentIntentId, planId, method } = req.body;

  const plan = await MembershipPlan.findById(planId);
  if (!plan) throw new AppError('Plan not found.', 404);

  let isValid = false;

  if (method === 'razorpay') {
    isValid = paymentService.verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  } else if (method === 'stripe') {
    const intent = await paymentService.retrieveStripePaymentIntent(stripePaymentIntentId);
    isValid = intent.status === 'succeeded';
  }

  if (!isValid) throw new AppError('Payment verification failed.', 400);

  // Create membership
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + plan.duration);

  const membership = await Membership.create({
    user: req.user._id,
    plan: plan._id,
    status: 'active',
    startDate,
    endDate,
    price: plan.price,
    currency: plan.currency || 'INR',
    method,
    lastPaymentDate: new Date(),
    nextBillingDate: endDate,
  });

  // Update payment record
  await Payment.findOneAndUpdate(
    { user: req.user._id, status: 'pending', ...(method === 'razorpay' && { razorpayOrderId }) },
    {
      status: 'completed',
      membership: membership._id,
      transactionId: method === 'razorpay' ? razorpayPaymentId : stripePaymentIntentId,
      ...(method === 'razorpay' && { razorpayPaymentId, razorpayOrderId, razorpaySignature }),
    }
  );

  // Notify user
  await notificationService.sendMembershipConfirmation(req.user, plan, endDate).catch(() => {});

  res.status(200).json({
    status: 'success',
    message: 'Payment verified. Membership activated!',
    data: { membership: await membership.populate('plan') },
  });
});

// ─── Cancel Membership ────────────────────────────────────────────────────────
exports.cancelMembership = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const membership = await Membership.findOne({ user: req.user._id, status: 'active' });
  if (!membership) throw new AppError('No active membership found.', 404);

  membership.status = 'cancelled';
  membership.cancelledAt = new Date();
  membership.cancellationReason = reason;
  membership.autoRenew = false;
  await membership.save();

  res.status(200).json({ status: 'success', message: 'Membership cancelled.' });
});

// ─── Payment History ──────────────────────────────────────────────────────────
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const filter = { user: req.user._id };

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('membership', 'plan startDate endDate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Payment.countDocuments(filter),
  ]);

  res.status(200).json({ status: 'success', data: { payments, total, page: parseInt(page) } });
});

// ─── Admin: All Memberships ────────────────────────────────────────────────────
exports.getAllMemberships = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const [memberships, total] = await Promise.all([
    Membership.find(filter)
      .populate('user', 'name email avatar')
      .populate('plan', 'name type price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Membership.countDocuments(filter),
  ]);

  res.status(200).json({ status: 'success', data: { memberships, total } });
});
