const Workout = require('../models/Workout');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/error.middleware');
const { paginate, paginateResponse } = require('../utils/helpers');
const { cacheSet, cacheGet, cacheDel, cacheDelPattern } = require('../config/redis');

// ─── Create Workout ───────────────────────────────────────────────────────────
exports.createWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.create({
    ...req.body,
    createdBy: req.user._id,
  });

  await cacheDelPattern('workouts:*');

  res.status(201).json({ status: 'success', message: 'Workout created.', data: { workout } });
});

// ─── Get All Workouts ─────────────────────────────────────────────────────────
exports.getWorkouts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, category, difficulty, search, sortBy = 'createdAt', order = 'desc' } = req.query;
  const cacheKey = `workouts:list:${JSON.stringify(req.query)}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', ...cached });

  const { skip } = paginate(null, page, limit);

  const filter = { isPublic: true };
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (search) filter.$text = { $search: search };

  // Non-admin only sees non-premium or their own
  if (req.user?.role === 'member') {
    const hasMembership = req.user?.membership?.premiumContent;
    if (!hasMembership) filter.$or = [{ isPremium: false }, { createdBy: req.user._id }];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sortMap = {
    createdAt: { createdAt: sortOrder },
    rating: { averageRating: sortOrder },
    popular: { completionCount: sortOrder },
    duration: { estimatedDuration: sortOrder },
  };

  const [workouts, total] = await Promise.all([
    Workout.find(filter)
      .populate('createdBy', 'name avatar role')
      .select('-sections.exercises.exercise') // lighter payload for list
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortMap[sortBy] || { createdAt: -1 }),
    Workout.countDocuments(filter),
  ]);

  const result = paginateResponse(workouts, total, page, limit);
  await cacheSet(cacheKey, result, 120);

  res.status(200).json({ status: 'success', ...result });
});

// ─── Get Single Workout ───────────────────────────────────────────────────────
exports.getWorkout = asyncHandler(async (req, res) => {
  const cacheKey = `workouts:single:${req.params.id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    const isSaved = req.user?.savedWorkouts?.some(id => id.toString() === req.params.id);
    return res.status(200).json({ status: 'success', data: { workout: cached, isSaved: !!isSaved } });
  }

  const workout = await Workout.findById(req.params.id)
    .populate('createdBy', 'name avatar role')
    .populate('sections.exercises.exercise');

  if (!workout) throw new AppError('Workout not found.', 404);
  if (!workout.isPublic && workout.createdBy._id.toString() !== req.user?._id.toString()) {
    throw new AppError('This workout is private.', 403);
  }

  await cacheSet(cacheKey, workout, 300);

  const isSaved = req.user?.savedWorkouts?.some(id => id.toString() === req.params.id);
  res.status(200).json({ status: 'success', data: { workout, isSaved: !!isSaved } });
});

// ─── Update Workout ───────────────────────────────────────────────────────────
exports.updateWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  if (!workout) throw new AppError('Workout not found.', 404);

  const isOwner = workout.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new AppError('Not authorized to update this workout.', 403);
  }

  const updated = await Workout.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('sections.exercises.exercise');

  await cacheDel(`workouts:single:${req.params.id}`);
  await cacheDelPattern('workouts:list:*');

  res.status(200).json({ status: 'success', data: { workout: updated } });
});

// ─── Delete Workout ───────────────────────────────────────────────────────────
exports.deleteWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findById(req.params.id);
  if (!workout) throw new AppError('Workout not found.', 404);

  const isOwner = workout.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new AppError('Not authorized to delete this workout.', 403);
  }

  await workout.deleteOne();
  await cacheDel(`workouts:single:${req.params.id}`);
  await cacheDelPattern('workouts:list:*');

  res.status(200).json({ status: 'success', message: 'Workout deleted.' });
});

// ─── Rate Workout ─────────────────────────────────────────────────────────────
exports.rateWorkout = asyncHandler(async (req, res) => {
  const { score, review } = req.body;
  const workout = await Workout.findById(req.params.id);
  if (!workout) throw new AppError('Workout not found.', 404);

  const existingIdx = workout.ratings.findIndex(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (existingIdx > -1) {
    workout.ratings[existingIdx] = { user: req.user._id, score, review };
  } else {
    workout.ratings.push({ user: req.user._id, score, review });
  }

  await workout.save();
  await cacheDel(`workouts:single:${req.params.id}`);

  res.status(200).json({ status: 'success', message: 'Rating submitted.', data: { averageRating: workout.averageRating } });
});

// ─── Assign Workout to User (Trainer/Admin) ───────────────────────────────────
exports.assignWorkout = asyncHandler(async (req, res) => {
  const { userId, date } = req.body;
  const { id: workoutId } = req.params;

  const [user, workout] = await Promise.all([
    User.findById(userId),
    Workout.findById(workoutId),
  ]);

  if (!user) throw new AppError('User not found.', 404);
  if (!workout) throw new AppError('Workout not found.', 404);

  // Trainers can only assign to their members
  if (req.user.role === 'trainer') {
    const isMember = req.user.assignedMembers?.some((m) => m.toString() === userId);
    if (!isMember) throw new AppError('You can only assign workouts to your members.', 403);
  }

  // Add to user's saved workouts
  await User.findByIdAndUpdate(userId, { $addToSet: { savedWorkouts: workoutId } });

  // Send notification via socket (will be handled in socket service)
  req.io?.to(`user:${userId}`).emit('workout:assigned', {
    workoutId,
    workoutTitle: workout.title,
    assignedBy: req.user.name,
    scheduledDate: date,
  });

  res.status(200).json({ status: 'success', message: `Workout assigned to ${user.name}.` });
});

// ─── Weekly Planner ───────────────────────────────────────────────────────────
exports.getWeeklyPlan = asyncHandler(async (req, res) => {
  const { weekStart } = req.query;
  const startDate = weekStart ? new Date(weekStart) : (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d;
  })();

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const Progress = require('../models/Progress');
  const logs = await Progress.find({
    user: req.user._id,
    type: 'workout_log',
    date: { $gte: startDate, $lte: endDate },
  }).populate('workout', 'title category difficulty estimatedDuration thumbnail');

  // Build 7-day plan
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const plan = days.map((day, idx) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + idx);
    const dayLogs = logs.filter((l) => {
      const logDate = new Date(l.date);
      return logDate.toDateString() === date.toDateString();
    });
    return { day, date, logs: dayLogs };
  });

  res.status(200).json({ status: 'success', data: { weekStart: startDate, plan } });
});

// ─── Get My Workouts (Created + Saved) ───────────────────────────────────────
exports.getMyWorkouts = asyncHandler(async (req, res) => {
  const { type = 'created' } = req.query;

  let workouts;
  if (type === 'saved') {
    const user = await User.findById(req.user._id).populate({
      path: 'savedWorkouts',
      populate: { path: 'createdBy', select: 'name avatar' },
    });
    workouts = user.savedWorkouts;
  } else {
    workouts = await Workout.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
  }

  res.status(200).json({ status: 'success', data: { workouts } });
});
