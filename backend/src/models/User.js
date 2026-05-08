const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
  },
  password: {
    type: String,
    // Not required for Google OAuth users
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    select: false,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  role: {
    type: String,
    enum: ['member', 'trainer', 'admin'],
    default: 'member',
  },
  avatar: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  profile: {
    age: { type: Number, min: 10, max: 100 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    height: { type: Number, min: 50, max: 300 }, // cm
    weight: { type: Number, min: 10, max: 500 }, // kg
    bmi: { type: Number },
    fitnessGoal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness'],
    },
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'super_active'],
      default: 'sedentary',
    },
    phone: { type: String },
    dateOfBirth: { type: Date },
  },
  assignedTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  savedWorkouts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workout',
  }],
  achievements: [{
    badge: { type: String },
    title: { type: String },
    description: { type: String },
    earnedAt: { type: Date, default: Date.now },
  }],
  streaks: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date },
  },
  leaderboardPoints: { type: Number, default: 0 },
  notifications: [{
    type: { type: String },
    message: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  isEmailVerified: { type: Boolean, default: false },
  emailOTP: { type: String, select: false },
  emailOTPExpiry: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: { type: Date, select: false },
  refreshTokens: [{ type: String, select: false }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.fitnessGoal': 1 });
userSchema.index({ leaderboardPoints: -1 });
userSchema.index({ createdAt: -1 });

// Virtual: BMI calculation
userSchema.virtual('calculatedBMI').get(function () {
  if (this.profile?.height && this.profile?.weight) {
    const heightM = this.profile.height / 100;
    return (this.profile.weight / (heightM * heightM)).toFixed(1);
  }
  return null;
});

// Virtual: membership (populated from Membership model)
userSchema.virtual('membership', {
  ref: 'Membership',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

// Pre-save: Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Pre-save: Calculate BMI
userSchema.pre('save', function (next) {
  if (this.profile?.height && this.profile?.weight) {
    const heightM = this.profile.height / 100;
    this.profile.bmi = parseFloat((this.profile.weight / (heightM * heightM)).toFixed(1));
  }
  next();
});

// Method: Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method: Check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Method: Increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);
