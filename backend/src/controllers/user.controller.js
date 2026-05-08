const User = require('../models/User');
const { Membership } = require('../models/Membership');
const Progress = require('../models/Progress');
const { AppError, asyncHandler } = require('../middleware/error.middleware');
const { sanitizeUser, paginate, paginateResponse, calculatePoints } = require('../utils/helpers');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');
const { deleteMedia } = require('../config/cloudinary');
const aiService = require('../services/ai.service');

// ─── Get User Profile ─────────────────────────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user._id;
  const cacheKey = `user:profile:${userId}`;

  let userData = await cacheGet(cacheKey);
  if (userData) return res.status(200).json({ status: 'success', data: { user: userData } });

  const user = await User.findById(userId)
    .select('-refreshTokens -emailOTP -emailOTPExpiry -passwordResetToken -passwordResetExpiry -loginAttempts -lockUntil')
    .populate('assignedTrainer', 'name email avatar profile.fitnessLevel profile.fitnessGoal')
    .populate('savedWorkouts', 'title category difficulty estimatedDuration thumbnail averageRating');

  if (!user) throw new AppError('User not found.', 404);

  // Don't expose other member details to non-admins/trainers
  if (req.user.role === 'member' && req.user._id.toString() !== userId.toString()) {
    throw new AppError('Not authorized to view this profile.', 403);
  }

  const [membership, recentProgress] = await Promise.all([
    Membership.findOne({ user: userId, status: 'active' }).populate('plan', 'name type features'),
    Progress.find({ user: userId, type: 'body_measurement' }).sort({ date: -1 }).limit(1),
  ]);

  const result = {
    ...sanitizeUser(user),
    membership: membership || null,
    latestMeasurement: recentProgress[0]?.bodyMeasurement || null,
  };

  await cacheSet(cacheKey, result, 300); // 5 min cache
  res.status(200).json({ status: 'success', data: { user: result } });
});

// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'profile'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  if (updates.profile) {
    // Merge nested profile
    const currentUser = await User.findById(req.user._id);
    updates.profile = { ...currentUser.profile.toObject(), ...updates.profile };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select('-refreshTokens -password -emailOTP');

  await cacheDel(`user:profile:${req.user._id}`);

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully.',
    data: { user: sanitizeUser(user) },
  });
});

// ─── Upload Avatar ────────────────────────────────────────────────────────────
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No image file provided.', 400);

  const user = await User.findById(req.user._id);

  // Delete old avatar from Cloudinary
  if (user.avatar?.publicId) {
    await deleteMedia(user.avatar.publicId).catch((err) =>
      console.warn('Failed to delete old avatar:', err.message)
    );
  }

  user.avatar = {
    url: req.file.path,
    publicId: req.file.filename,
  };
  await user.save({ validateBeforeSave: false });
  await cacheDel(`user:profile:${req.user._id}`);

  res.status(200).json({
    status: 'success',
    message: 'Avatar updated.',
    data: { avatar: user.avatar },
  });
});

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, isActive } = req.query;
  const { skip } = paginate(null, page, limit);

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-refreshTokens -password -emailOTP -passwordResetToken')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    ...paginateResponse(users, total, page, limit),
  });
});

// ─── Get Trainers ──────────────────────────────────────────────────────────────
exports.getTrainers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { skip } = paginate(null, page, limit);

  const [trainers, total] = await Promise.all([
    User.find({ role: 'trainer', isActive: true })
      .select('name email avatar profile.fitnessLevel profile.fitnessGoal profile.age assignedMembers createdAt')
      .skip(skip).limit(parseInt(limit)),
    User.countDocuments({ role: 'trainer', isActive: true }),
  ]);

  res.status(200).json({
    status: 'success',
    ...paginateResponse(trainers, total, page, limit),
  });
});

// ─── Assign Trainer ───────────────────────────────────────────────────────────
exports.assignTrainer = asyncHandler(async (req, res) => {
  const { trainerId } = req.body;
  const memberId = req.params.id || req.user._id;

  const trainer = await User.findOne({ _id: trainerId, role: 'trainer', isActive: true });
  if (!trainer) throw new AppError('Trainer not found or inactive.', 404);

  await User.findByIdAndUpdate(memberId, { assignedTrainer: trainerId });
  await User.findByIdAndUpdate(trainerId, { $addToSet: { assignedMembers: memberId } });

  await cacheDel(`user:profile:${memberId}`);

  res.status(200).json({ status: 'success', message: 'Trainer assigned successfully.' });
});

// ─── Toggle Save Workout ─────────────────────────────────────────────────────
exports.toggleSaveWorkout = asyncHandler(async (req, res) => {
  const { workoutId } = req.params;
  const user = await User.findById(req.user._id);

  const isSaved = user.savedWorkouts.some((id) => id.toString() === workoutId);
  const update = isSaved
    ? { $pull: { savedWorkouts: workoutId } }
    : { $addToSet: { savedWorkouts: workoutId } };

  await User.findByIdAndUpdate(req.user._id, update);
  await cacheDel(`user:profile:${req.user._id}`);

  res.status(200).json({
    status: 'success',
    message: isSaved ? 'Workout removed from saved.' : 'Workout saved.',
    data: { saved: !isSaved },
  });
});

// ─── Get Leaderboard ──────────────────────────────────────────────────────────
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const cacheKey = `leaderboard:top:${limit}`;

  let cached = await cacheGet(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', data: cached });

  const users = await User.find({ role: 'member', isActive: true })
    .select('name avatar leaderboardPoints streaks achievements')
    .sort({ leaderboardPoints: -1 })
    .limit(parseInt(limit));

  const leaderboard = users.map((u, i) => ({
    rank: i + 1,
    _id: u._id,
    name: u.name,
    avatar: u.avatar,
    points: u.leaderboardPoints,
    currentStreak: u.streaks?.current || 0,
    badgeCount: u.achievements?.length || 0,
  }));

  await cacheSet(cacheKey, leaderboard, 300); // 5 min cache
  res.status(200).json({ status: 'success', data: leaderboard });
});

// ─── Deactivate User (Admin) ──────────────────────────────────────────────────
exports.deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') throw new AppError('Cannot deactivate admin accounts.', 403);

  user.isActive = false;
  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });

  await cacheDel(`user:profile:${req.params.id}`);

  res.status(200).json({ status: 'success', message: 'User deactivated.' });
});

// ─── Get Notifications ────────────────────────────────────────────────────────
exports.getNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('notifications');
  const sorted = (user.notifications || []).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);

  res.status(200).json({ status: 'success', data: sorted });
});

// ─── Mark Notifications Read ──────────────────────────────────────────────────
exports.markNotificationsRead = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'notifications.$[].read': true },
  });
  res.status(200).json({ status: 'success', message: 'All notifications marked as read.' });
});

// ─── AI: Get Workout Recommendation ──────────────────────────────────────────
exports.getAIRecommendation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const recentWorkouts = await Progress.find({ user: req.user._id, type: 'workout_log' })
    .sort({ date: -1 }).limit(10).populate('workout', 'category difficulty');

  const recommendation = await aiService.recommendWorkout(user, recentWorkouts);

  res.status(200).json({ status: 'success', data: recommendation });
});

// ─── AI: Get Diet Plan ────────────────────────────────────────────────────────
exports.getAIDietPlan = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.profile?.weight || !user.profile?.height) {
    throw new AppError('Please update your height and weight in your profile first.', 400);
  }

  const dietPlan = await aiService.generateDietPlan(user);

  res.status(200).json({ status: 'success', data: dietPlan });
});
