const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: { type: String, maxlength: 2000 },
  muscleGroup: {
    primary: [{
      type: String,
      enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'quads', 'hamstrings', 'glutes', 'calves', 'traps', 'lats', 'full_body'],
    }],
    secondary: [{ type: String }],
  },
  equipment: [{
    type: String,
    enum: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'resistance_band', 'kettlebell', 'medicine_ball', 'pull_up_bar', 'bench', 'trx', 'none'],
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  category: {
    type: String,
    enum: ['strength', 'cardio', 'flexibility', 'balance', 'plyometric'],
    required: true,
  },
  instructions: [{
    step: { type: Number },
    text: { type: String },
  }],
  tips: [{ type: String }],
  commonMistakes: [{ type: String }],
  media: {
    images: [{
      url: { type: String },
      publicId: { type: String },
      caption: { type: String },
    }],
    video: {
      url: { type: String },
      publicId: { type: String },
      thumbnail: { type: String },
    },
    animatedGif: { type: String },
  },
  variations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
  isApproved: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  forceType: { type: String, enum: ['push', 'pull', 'static', 'dynamic'] },
  mechanics: { type: String, enum: ['compound', 'isolation'] },
  usageCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
exerciseSchema.index({ name: 'text', description: 'text' });
exerciseSchema.index({ 'muscleGroup.primary': 1 });
exerciseSchema.index({ equipment: 1 });
exerciseSchema.index({ difficulty: 1, category: 1 });
exerciseSchema.index({ isApproved: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
