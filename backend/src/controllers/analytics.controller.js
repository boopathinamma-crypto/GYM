const User = require('../models/User');
const Progress = require('../models/Progress');
const { Membership, Payment } = require('../models/Membership');
const { Booking } = require('../models/Booking');
const Workout = require('../models/Workout');
const { asyncHandler } = require('../middleware/error.middleware');
const { cacheSet, cacheGet } = require('../config/redis');
const { getDateRange } = require('../utils/helpers');

// ─── Admin Dashboard Analytics ────────────────────────────────────────────────
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const cacheKey = 'analytics:dashboard';
  const cached = await cacheGet(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', data: cached });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalUsers, newUsersThisMonth, newUsersLastMonth,
    activeMembers, totalTrainers,
    activeMemberships, expiringMemberships,
    revenueThisMonth, revenueLastMonth,
    totalWorkouts, totalWorkoutCompletions,
    totalBookings,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: startOfMonth }, isActive: true }),
    User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, isActive: true }),
    User.countDocuments({ role: 'member', isActive: true }),
    User.countDocuments({ role: 'trainer', isActive: true }),
    Membership.countDocuments({ status: 'active' }),
    Membership.countDocuments({
      status: 'active',
      endDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
    }),
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Workout.countDocuments({ isPublic: true }),
    Progress.countDocuments({ type: 'workout_log', createdAt: { $gte: startOfMonth } }),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
  ]);

  const thisMonthRevenue = revenueThisMonth[0]?.total || 0;
  const lastMonthRevenue = revenueLastMonth[0]?.total || 0;

  const stats = {
    users: {
      total: totalUsers,
      members: activeMembers,
      trainers: totalTrainers,
      newThisMonth: newUsersThisMonth,
      growth: lastMonthRevenue > 0 ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1) : 0,
    },
    memberships: {
      active: activeMemberships,
      expiringSoon: expiringMemberships,
    },
    revenue: {
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      growth: lastMonthRevenue > 0 ? (((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1) : 0,
    },
    content: {
      totalWorkouts,
      workoutCompletionsThisMonth: totalWorkoutCompletions,
      totalBookingsThisMonth: totalBookings,
    },
  };

  await cacheSet(cacheKey, stats, 300);
  res.status(200).json({ status: 'success', data: stats });
});

// ─── Revenue Chart ────────────────────────────────────────────────────────────
exports.getRevenueChart = asyncHandler(async (req, res) => {
  const { period = 'year' } = req.query;
  const cacheKey = `analytics:revenue:${period}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', data: cached });

  const months = period === 'year' ? 12 : period === 'quarter' ? 3 : 1;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const revenueData = await Payment.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const chart = revenueData.map((d) => ({
    month: `${d._id.year}-${String(d._id.month).padStart(2, '0')}`,
    revenue: d.revenue,
    transactions: d.transactions,
  }));

  await cacheSet(cacheKey, chart, 3600);
  res.status(200).json({ status: 'success', data: chart });
});

// ─── User Activity Chart ──────────────────────────────────────────────────────
exports.getUserActivityChart = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const { start } = getDateRange(period);

  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: start }, isActive: true } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const workoutActivity = await Progress.aggregate([
    { $match: { type: 'workout_log', date: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        count: { $sum: 1 },
        totalCalories: { $sum: '$workoutLog.caloriesBurned' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: { userGrowth, workoutActivity },
  });
});

// ─── Workout Analytics ────────────────────────────────────────────────────────
exports.getWorkoutAnalytics = asyncHandler(async (req, res) => {
  const [categoryStats, popularWorkouts, completionByDay] = await Promise.all([
    Workout.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$averageRating' } } },
      { $sort: { count: -1 } },
    ]),
    Workout.find({ isPublic: true })
      .select('title category completionCount averageRating thumbnail')
      .sort({ completionCount: -1 })
      .limit(10),
    Progress.aggregate([
      { $match: { type: 'workout_log' } },
      { $group: { _id: { $dayOfWeek: '$date' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const daysMap = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const completionByDayFormatted = completionByDay.map((d) => ({
    day: daysMap[d._id],
    count: d.count,
  }));

  res.status(200).json({
    status: 'success',
    data: { categoryStats, popularWorkouts, completionByDay: completionByDayFormatted },
  });
});

// ─── Member Progress Analytics (Trainer) ─────────────────────────────────────
exports.getMemberProgressAnalytics = asyncHandler(async (req, res) => {
  let memberIds;
  if (req.user.role === 'trainer') {
    const trainer = await User.findById(req.user._id).select('assignedMembers');
    memberIds = trainer.assignedMembers;
  } else {
    // Admin: get top 20 most active members
    const activeUsers = await Progress.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    memberIds = activeUsers.map((u) => u._id);
  }

  const members = await User.find({ _id: { $in: memberIds } })
    .select('name avatar profile.bmi streaks.current leaderboardPoints');

  const progressStats = await Promise.all(
    memberIds.map(async (memberId) => {
      const { start } = getDateRange('month');
      const [workouts, latestMeasurement] = await Promise.all([
        Progress.countDocuments({ user: memberId, type: 'workout_log', date: { $gte: start } }),
        Progress.findOne({ user: memberId, type: 'body_measurement' }).sort({ date: -1 }).select('bodyMeasurement'),
      ]);
      return { userId: memberId, workoutsThisMonth: workouts, latestBMI: latestMeasurement?.bodyMeasurement?.bmi };
    })
  );

  res.status(200).json({
    status: 'success',
    data: { members, progressStats },
  });
});
