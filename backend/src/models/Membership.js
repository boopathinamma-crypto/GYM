const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'custom'], required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  duration: { type: Number, required: true }, // days
  features: [{ type: String }],
  maxBookingsPerMonth: { type: Number, default: -1 }, // -1 = unlimited
  trainerAccess: { type: Boolean, default: false },
  premiumContent: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const membershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending', 'trial'],
    default: 'pending',
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  autoRenew: { type: Boolean, default: false },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: { type: String, enum: ['stripe', 'razorpay', 'cash', 'bank_transfer'] },
  lastPaymentDate: { type: Date },
  nextBillingDate: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  stripeSubscriptionId: { type: String },
  razorpaySubscriptionId: { type: String },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: isExpired
membershipSchema.virtual('isExpired').get(function () {
  return this.endDate < new Date();
});

// Virtual: daysRemaining
membershipSchema.virtual('daysRemaining').get(function () {
  const diff = this.endDate - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Pre-save: Auto-set status based on dates
membershipSchema.pre('save', function (next) {
  if (this.endDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Indexes
membershipSchema.index({ user: 1, status: 1 });
membershipSchema.index({ endDate: 1 });
membershipSchema.index({ status: 1 });

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  method: { type: String, enum: ['stripe', 'razorpay', 'cash', 'bank_transfer'] },
  transactionId: { type: String, unique: true, sparse: true },
  stripePaymentIntentId: { type: String },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String },
  razorpaySignature: { type: String },
  invoiceUrl: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  failureReason: { type: String },
  refundedAt: { type: Date },
  refundReason: { type: String },
}, { timestamps: true });

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

const MembershipPlan = mongoose.model('MembershipPlan', membershipPlanSchema);
const Membership = mongoose.model('Membership', membershipSchema);
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { MembershipPlan, Membership, Payment };
