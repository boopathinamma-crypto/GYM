const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['yoga', 'cardio', 'strength', 'hiit', 'pilates', 'zumba', 'boxing', 'crossfit'], required: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 1 },
  enrolledCount: { type: Number, default: 0 },
  location: { type: String, default: 'Main Studio' },
  thumbnail: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, enum: ['daily', 'weekly', 'biweekly'] },
  isCancelled: { type: Boolean, default: false },
  cancellationReason: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

classSchema.virtual('availableSpots').get(function () {
  return Math.max(0, this.capacity - this.enrolledCount);
});

classSchema.virtual('isFull').get(function () {
  return this.enrolledCount >= this.capacity;
});

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['class', 'trainer_session'], required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'GymClass' },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionDate: { type: Date, required: true },
  startTime: { type: Date },
  endTime: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending',
  },
  notes: { type: String },
  paymentStatus: { type: String, enum: ['free', 'paid', 'pending'], default: 'free' },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  reminderSent: { type: Boolean, default: false },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    submittedAt: { type: Date },
  },
}, { timestamps: true });

bookingSchema.index({ user: 1, sessionDate: -1 });
bookingSchema.index({ trainer: 1, sessionDate: 1 });
bookingSchema.index({ class: 1 });
bookingSchema.index({ status: 1 });

classSchema.index({ startTime: 1 });
classSchema.index({ trainer: 1 });
classSchema.index({ type: 1 });

const GymClass = mongoose.model('GymClass', classSchema);
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { GymClass, Booking };
