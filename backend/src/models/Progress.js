const mongoose = require('mongoose');

const setLogSchema = new mongoose.Schema({
  setNumber: { type: Number, required: true },
  reps: { type: Number },
  weight: { type: Number }, // kg
  duration: { type: Number }, // seconds
  distance: { type: Number }, // km
  completed: { type: Boolean, default: true },
  notes: { type: String },
});

const exerciseLogSchema = new mongoose.Schema({
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  sets: [setLogSchema],
  totalVolume: { type: Number }, // total weight * reps
  personalRecord: { type: Boolean, default: false },
  notes: { type: String },
});

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workout: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' },
  date: { type: Date, default: Date.now, required: true },
  type: {
    type: String,
    enum: ['workout_log', 'body_measurement', 'personal_record'],
    required: true,
  },

  // Workout Log
  workoutLog: {
    exercises: [exerciseLogSchema],
    duration: { type: Number }, // minutes
    caloriesBurned: { type: Number },
    rating: { type: Number, min: 1, max: 5 },
    mood: { type: String, enum: ['terrible', 'bad', 'okay', 'good', 'great'] },
    notes: { type: String },
    completionPercentage: { type: Number, default: 100 },
  },

  // Body Measurements
  bodyMeasurement: {
    weight: { type: Number }, // kg
    bmi: { type: Number },
    bodyFat: { type: Number }, // %
    muscleMass: { type: Number }, // kg
    chest: { type: Number }, // cm
    waist: { type: Number }, // cm
    hips: { type: Number }, // cm
    biceps: { type: Number }, // cm
    thighs: { type: Number }, // cm
    calves: { type: Number }, // cm
    neck: { type: Number }, // cm
    photos: [{
      url: { type: String },
      publicId: { type: String },
      angle: { type: String, enum: ['front', 'side', 'back'] },
    }],
  },

  // Personal Records
  personalRecord: {
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    type: { type: String, enum: ['max_weight', 'max_reps', 'best_time', 'longest_distance'] },
    value: { type: Number },
    unit: { type: String },
    previousRecord: { type: Number },
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
progressSchema.index({ user: 1, date: -1 });
progressSchema.index({ user: 1, type: 1 });
progressSchema.index({ user: 1, workout: 1 });
progressSchema.index({ date: -1 });

module.exports = mongoose.model('Progress', progressSchema);
