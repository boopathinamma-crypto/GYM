const Progress = require('../models/Progress');
const User = require('../models/User');
const Workout = require('../models/Workout');
const { AppError, asyncHandler } = require('../middleware/error.middleware');
const { getDateRange, calculatePoints } = require('../utils/helpers');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');
const PDFDocument = require('pdfkit');

// ─── Log Progress ─────────────────────────────────────────────────────────────
exports.logProgress = asyncHandler(async (req, res) => {
  const progressData = { ...req.body, user: req.user._id };

  const progress = await Progress.create(progressData);

  // Handle workout completion
  if (progressData.type === 'workout_log' && progressData.workout) {
    await Workout.findByIdAndUpdate(progressData.workout, { $inc: { completionCount: 1 } });

    // Update streak
    const user = await User.findById(req.user._id);
    const today = new Date().toDateString();
    const lastWorkout = user.streaks?.lastWorkoutDate?.toDateString();

    if (lastWorkout !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive = lastWorkout === yesterday.toDateString();

      const newStreak = isConsecutive ? (user.streaks.current || 0) + 1 : 1;
      const longestStreak = Math.max(newStreak, user.streaks.longest || 0);

      await User.findByIdAndUpdate(req.user._id, {
        'streaks.current': newStreak,
        'streaks.longest': longestStreak,
        'streaks.lastWorkoutDate': new Date(),
        $inc: { leaderboardPoints: calculatePoints('workout_completed') },
      });

      // Award streak badges
      if (newStreak === 7) {
        await User.findByIdAndUpdate(req.user._id, {
          $push: { achievements: { badge: '🔥', title: '7-Day Streak', description: 'Worked out 7 days in a row!' } },
          $inc: { leaderboardPoints: calculatePoints('streak_7days') },
        });
      }
      if (newStreak === 30) {
        await User.findByIdAndUpdate(req.user._id, {
          $push: { achievements: { badge: '⚡', title: '30-Day Warrior', description: '30 consecutive workout days!' } },
          $inc: { leaderboardPoints: calculatePoints('streak_30days') },
        });
      }
    }
  }

  // Handle personal record
  if (progressData.type === 'personal_record') {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { leaderboardPoints: calculatePoints('personal_record') },
    });
  }

  await cacheDel(`progress:summary:${req.user._id}`);

  res.status(201).json({ status: 'success', message: 'Progress logged.', data: { progress } });
});

// ─── Get Progress History ─────────────────────────────────────────────────────
exports.getProgressHistory = asyncHandler(async (req, res) => {
  const { type, period = 'month', page = 1, limit = 20 } = req.query;
  const { start, end } = getDateRange(period);
  const userId = req.params.userId || req.user._id;

  // Trainers can only view their members
  if (req.user.role === 'trainer' && userId.toString() !== req.user._id.toString()) {
    const trainer = await User.findById(req.user._id);
    const isMember = trainer.assignedMembers?.some((m) => m.toString() === userId.toString());
    if (!isMember) throw new AppError('Not authorized to view this user\'s progress.', 403);
  }

  const filter = { user: userId, date: { $gte: start, $lte: end } };
  if (type) filter.type = type;

  const [logs, total] = await Promise.all([
    Progress.find(filter)
      .populate('workout', 'title category difficulty')
      .populate('workoutLog.exercises.exercise', 'name muscleGroup')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Progress.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: { logs, total, page: parseInt(page), pages: Math.ceil(total / limit) },
  });
});

// ─── Get Progress Summary / Charts ───────────────────────────────────────────
exports.getProgressSummary = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const userId = req.params.userId || req.user._id;
  const cacheKey = `progress:summary:${userId}:${period}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', data: cached });

  const { start, end } = getDateRange(period);

  const [workoutLogs, measurements] = await Promise.all([
    Progress.find({ user: userId, type: 'workout_log', date: { $gte: start, $lte: end } })
      .select('date workoutLog.caloriesBurned workoutLog.duration workoutLog.rating')
      .sort({ date: 1 }),
    Progress.find({ user: userId, type: 'body_measurement', date: { $gte: start, $lte: end } })
      .select('date bodyMeasurement.weight bodyMeasurement.bmi bodyMeasurement.bodyFat')
      .sort({ date: 1 }),
  ]);

  // Aggregate stats
  const totalWorkouts = workoutLogs.length;
  const totalCalories = workoutLogs.reduce((sum, l) => sum + (l.workoutLog?.caloriesBurned || 0), 0);
  const totalDuration = workoutLogs.reduce((sum, l) => sum + (l.workoutLog?.duration || 0), 0);
  const avgRating = workoutLogs.length
    ? workoutLogs.reduce((sum, l) => sum + (l.workoutLog?.rating || 0), 0) / workoutLogs.length
    : 0;

  // Chart data - group by day/week
  const chartData = {
    calories: workoutLogs.map((l) => ({
      date: l.date.toISOString().split('T')[0],
      value: l.workoutLog?.caloriesBurned || 0,
    })),
    weight: measurements.map((m) => ({
      date: m.date.toISOString().split('T')[0],
      value: m.bodyMeasurement?.weight,
    })),
    bmi: measurements.map((m) => ({
      date: m.date.toISOString().split('T')[0],
      value: m.bodyMeasurement?.bmi,
    })),
  };

  const summary = { totalWorkouts, totalCalories, totalDuration, avgRating, chartData };
  await cacheSet(cacheKey, summary, 300);

  res.status(200).json({ status: 'success', data: summary });
});

// ─── Get Personal Records ─────────────────────────────────────────────────────
exports.getPersonalRecords = asyncHandler(async (req, res) => {
  const records = await Progress.find({
    user: req.user._id,
    type: 'personal_record',
  })
    .populate('personalRecord.exercise', 'name muscleGroup')
    .sort({ date: -1 });

  // Group by exercise, keep only best
  const grouped = {};
  records.forEach((r) => {
    const key = `${r.personalRecord.exercise?._id}-${r.personalRecord.type}`;
    if (!grouped[key] || r.personalRecord.value > grouped[key].personalRecord.value) {
      grouped[key] = r;
    }
  });

  res.status(200).json({ status: 'success', data: { records: Object.values(grouped) } });
});

// ─── Download Progress PDF Report ────────────────────────────────────────────
exports.downloadProgressReport = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const { start, end } = getDateRange(period);

  const [user, logs, measurements] = await Promise.all([
    User.findById(req.user._id).select('name email profile'),
    Progress.find({ user: req.user._id, type: 'workout_log', date: { $gte: start, $lte: end } })
      .populate('workout', 'title category').sort({ date: -1 }),
    Progress.find({ user: req.user._id, type: 'body_measurement', date: { $gte: start, $lte: end } })
      .sort({ date: -1 }).limit(2),
  ]);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="progress-report-${period}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('GymPro Progress Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').text(`Member: ${user.name}`, { align: 'center' });
  doc.text(`Period: ${start.toDateString()} - ${end.toDateString()}`, { align: 'center' });
  doc.moveDown(1);

  // Summary
  doc.fontSize(16).font('Helvetica-Bold').text('Summary');
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica');
  doc.text(`Total Workouts: ${logs.length}`);
  doc.text(`Total Calories Burned: ${logs.reduce((s, l) => s + (l.workoutLog?.caloriesBurned || 0), 0)} kcal`);
  doc.text(`Total Duration: ${logs.reduce((s, l) => s + (l.workoutLog?.duration || 0), 0)} minutes`);

  if (measurements.length >= 2) {
    doc.moveDown(1);
    doc.fontSize(16).font('Helvetica-Bold').text('Body Measurements');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    const latest = measurements[0].bodyMeasurement;
    const previous = measurements[1].bodyMeasurement;
    if (latest.weight && previous.weight) {
      const diff = (latest.weight - previous.weight).toFixed(1);
      doc.text(`Weight: ${latest.weight} kg (${diff > 0 ? '+' : ''}${diff} kg)`);
    }
    if (latest.bmi) doc.text(`BMI: ${latest.bmi}`);
  }

  // Workout Log
  if (logs.length > 0) {
    doc.moveDown(1);
    doc.fontSize(16).font('Helvetica-Bold').text('Workout Log');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    logs.slice(0, 20).forEach((l) => {
      doc.text(`• ${l.date.toDateString()} — ${l.workout?.title || 'Custom Workout'} (${l.workoutLog?.duration || 0} min, ${l.workoutLog?.caloriesBurned || 0} kcal)`);
    });
  }

  doc.end();
});

// ─── Delete Progress Entry ────────────────────────────────────────────────────
exports.deleteProgressEntry = asyncHandler(async (req, res) => {
  const entry = await Progress.findOne({ _id: req.params.id, user: req.user._id });
  if (!entry) throw new AppError('Progress entry not found.', 404);
  await entry.deleteOne();
  await cacheDel(`progress:summary:${req.user._id}`);
  res.status(200).json({ status: 'success', message: 'Progress entry deleted.' });
});
