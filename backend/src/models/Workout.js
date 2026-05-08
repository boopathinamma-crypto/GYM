const mongoose = require('mongoose');

const exerciseInWorkoutSchema = new mongoose.Schema({
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  sets: { type: Number, required: true, min: 1, max: 20 },
  reps: { type: Number, min: 1 },
  duration: { type: Number }, // seconds, for time-based exercises
  restInterval: { type: Number, default: 60 }, // seconds
  weight: { type: Number }, // kg, optional starting weight
  notes: { type: String, maxlength: 500 },
  order: { type: Number, required: true },
});

const workoutSectionSchema = new mongoose.Schema({
  type: { type: String, enum: ['warmup', 'main', 'cooldown'], required: true },
  exercises: [exerciseInWorkoutSchema],
  notes: { type: String },
});

const workoutSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Workout title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: { type: String, maxlength: 2000 },
  category: {
    type: String,
    required: true,
    enum: ['strength', 'weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'cardio', 'hiit', 'yoga'],
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced'],
  },
  targetMuscles: [{ type: String }],
  equipment: [{ type: String }],
  estimatedDuration: { type: Number, required: true }, // minutes
  caloriesBurn: { type: Number }, // estimated
  sections: [workoutSectionSchema],
  thumbnail: {
    url: { type: String, default: '' },
    publicId: { type: String },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublic: { type: Boolean, default: true },
  isPremium: { type: Boolean, default: false },
  tags: [{ type: String }],
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 1, max: 5 },
    review: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  }],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  completionCount: { type: Number, default: 0 },
  bookmarkCount: { type: Number, default: 0 },
  progressiveOverload: {
    enabled: { type: Boolean, default: false },
    incrementPercentage: { type: Number, default: 5 },
    incrementFrequency: { type: String, enum: ['weekly', 'biweekly', 'monthly'] },
  },
  weeklyPlan: {
    isTemplate: { type: Boolean, default: false },
    days: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      isRestDay: { type: Boolean, default: false },
    }],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
workoutSchema.index({ category: 1, difficulty: 1 });
workoutSchema.index({ createdBy: 1 });
workoutSchema.index({ isPublic: 1 });
workoutSchema.index({ averageRating: -1 });
workoutSchema.index({ completionCount: -1 });
workoutSchema.index({ tags: 1 });
workoutSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Pre-save: Update average rating
workoutSchema.pre('save', function (next) {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, r) => acc + r.score, 0);
    this.averageRating = parseFloat((sum / this.ratings.length).toFixed(1));
    this.totalRatings = this.ratings.length;
  }
  next();
});

module.exports = mongoose.model('Workout', workoutSchema);
