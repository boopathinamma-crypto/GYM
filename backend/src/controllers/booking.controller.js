const { GymClass, Booking } = require('../models/Booking');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/error.middleware');
const { paginate, paginateResponse } = require('../utils/helpers');
const { cacheSet, cacheGet, cacheDel, cacheDelPattern } = require('../config/redis');
const notificationService = require('../services/notification.service');

// ─── Classes ──────────────────────────────────────────────────────────────────
exports.getClasses = asyncHandler(async (req, res) => {
  const { type, date, trainerId, page = 1, limit = 20 } = req.query;
  const { skip } = paginate(null, page, limit);

  const filter = { isCancelled: false, isActive: true };
  if (type) filter.type = type;
  if (trainerId) filter.trainer = trainerId;
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.startTime = { $gte: startOfDay, $lte: endOfDay };
  } else {
    filter.startTime = { $gte: new Date() };
  }

  const [classes, total] = await Promise.all([
    GymClass.find(filter)
      .populate('trainer', 'name avatar profile.fitnessLevel')
      .skip(skip).limit(parseInt(limit))
      .sort({ startTime: 1 }),
    GymClass.countDocuments(filter),
  ]);

  res.status(200).json({ status: 'success', ...paginateResponse(classes, total, page, limit) });
});

exports.createClass = asyncHandler(async (req, res) => {
  const gymClass = await GymClass.create({ ...req.body, trainer: req.user._id });
  await cacheDelPattern('classes:*');
  res.status(201).json({ status: 'success', data: { class: gymClass } });
});

exports.updateClass = asyncHandler(async (req, res) => {
  const gymClass = await GymClass.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!gymClass) throw new AppError('Class not found.', 404);
  res.status(200).json({ status: 'success', data: { class: gymClass } });
});

exports.cancelClass = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const gymClass = await GymClass.findByIdAndUpdate(
    req.params.id,
    { isCancelled: true, cancellationReason: reason },
    { new: true }
  );
  if (!gymClass) throw new AppError('Class not found.', 404);

  // Notify booked users
  const bookings = await Booking.find({ class: gymClass._id, status: { $in: ['pending', 'confirmed'] } })
    .populate('user', 'email name');

  for (const booking of bookings) {
    await Booking.findByIdAndUpdate(booking._id, { status: 'cancelled', cancellationReason: `Class cancelled: ${reason}` });
    await notificationService.sendClassCancellation(booking.user, gymClass).catch(() => {});
  }

  res.status(200).json({ status: 'success', message: 'Class cancelled and users notified.' });
});

// ─── Bookings ─────────────────────────────────────────────────────────────────
exports.createBooking = asyncHandler(async (req, res) => {
  const { type, classId, trainerId, sessionDate, startTime, endTime, notes } = req.body;

  // Check for duplicate booking
  const existingBooking = await Booking.findOne({
    user: req.user._id,
    ...(classId && { class: classId }),
    status: { $in: ['pending', 'confirmed'] },
  });
  if (existingBooking) throw new AppError('You have already booked this class/session.', 409);

  if (type === 'class') {
    const gymClass = await GymClass.findById(classId);
    if (!gymClass) throw new AppError('Class not found.', 404);
    if (gymClass.isCancelled) throw new AppError('This class has been cancelled.', 400);
    if (gymClass.enrolledCount >= gymClass.capacity) throw new AppError('Class is fully booked.', 409);

    const booking = await Booking.create({
      user: req.user._id,
      type: 'class',
      class: classId,
      sessionDate: gymClass.startTime,
      status: 'confirmed',
      notes,
    });

    await GymClass.findByIdAndUpdate(classId, { $inc: { enrolledCount: 1 } });

    // Emit socket notification
    req.io?.to(`user:${req.user._id}`).emit('booking:confirmed', { booking, class: gymClass });

    return res.status(201).json({ status: 'success', message: 'Class booked!', data: { booking } });
  }

  if (type === 'trainer_session') {
    const trainer = await User.findOne({ _id: trainerId, role: 'trainer', isActive: true });
    if (!trainer) throw new AppError('Trainer not found.', 404);

    // Check trainer availability (no conflicting bookings)
    const conflict = await Booking.findOne({
      trainer: trainerId,
      sessionDate: new Date(sessionDate),
      status: { $in: ['pending', 'confirmed'] },
    });
    if (conflict) throw new AppError('Trainer not available at this time.', 409);

    const booking = await Booking.create({
      user: req.user._id,
      type: 'trainer_session',
      trainer: trainerId,
      sessionDate: new Date(sessionDate),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      status: 'pending',
      notes,
    });

    // Notify trainer
    req.io?.to(`user:${trainerId}`).emit('session:request', {
      booking,
      member: { name: req.user.name, avatar: req.user.avatar },
    });

    return res.status(201).json({ status: 'success', message: 'Session request sent to trainer.', data: { booking } });
  }
});

exports.getMyBookings = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 10 } = req.query;
  const { skip } = paginate(null, page, limit);

  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('class', 'title type startTime endTime location trainer')
      .populate('trainer', 'name avatar profile.fitnessLevel')
      .skip(skip).limit(parseInt(limit))
      .sort({ sessionDate: -1 }),
    Booking.countDocuments(filter),
  ]);

  res.status(200).json({ status: 'success', ...paginateResponse(bookings, total, page, limit) });
});

exports.cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) throw new AppError('Booking not found.', 404);
  if (['cancelled', 'completed'].includes(booking.status)) {
    throw new AppError(`Booking is already ${booking.status}.`, 400);
  }

  booking.status = 'cancelled';
  booking.cancellationReason = reason;
  booking.cancelledAt = new Date();
  await booking.save();

  if (booking.type === 'class' && booking.class) {
    await GymClass.findByIdAndUpdate(booking.class, { $inc: { enrolledCount: -1 } });
  }

  res.status(200).json({ status: 'success', message: 'Booking cancelled.' });
});

exports.confirmBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found.', 404);

  // Only trainer can confirm their sessions
  if (booking.type === 'trainer_session' && booking.trainer.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized.', 403);
  }

  booking.status = 'confirmed';
  await booking.save();

  req.io?.to(`user:${booking.user}`).emit('booking:confirmed', { bookingId: booking._id });

  res.status(200).json({ status: 'success', message: 'Booking confirmed.' });
});

exports.submitFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id, status: 'completed' });
  if (!booking) throw new AppError('Completed booking not found.', 404);

  booking.feedback = { rating, comment, submittedAt: new Date() };
  await booking.save();

  res.status(200).json({ status: 'success', message: 'Feedback submitted. Thank you!' });
});

exports.getTrainerSchedule = asyncHandler(async (req, res) => {
  const { date, week } = req.query;
  const trainerId = req.params.trainerId || req.user._id;

  let startDate, endDate;
  if (week) {
    startDate = new Date(week);
    endDate = new Date(week);
    endDate.setDate(startDate.getDate() + 6);
  } else {
    startDate = new Date(date || new Date());
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
  }

  const [bookings, classes] = await Promise.all([
    Booking.find({
      trainer: trainerId,
      sessionDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed'] },
    }).populate('user', 'name avatar profile.fitnessLevel'),
    GymClass.find({
      trainer: trainerId,
      startTime: { $gte: startDate, $lte: endDate },
      isCancelled: false,
    }),
  ]);

  res.status(200).json({ status: 'success', data: { bookings, classes } });
});
