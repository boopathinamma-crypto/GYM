const Exercise = require('../models/Exercise');
const { AppError, asyncHandler } = require('../middleware/error.middleware');
const { paginate, paginateResponse } = require('../utils/helpers');
const { cacheSet, cacheGet, cacheDel, cacheDelPattern } = require('../config/redis');

exports.createExercise = asyncHandler(async (req, res) => {
  const exercise = await Exercise.create({ ...req.body, createdBy: req.user._id, isApproved: req.user.role === 'admin' });
  await cacheDelPattern('exercises:*');
  res.status(201).json({ status: 'success', data: { exercise } });
});

exports.getExercises = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, muscle, equipment, difficulty, category, search } = req.query;
  const cacheKey = `exercises:list:${JSON.stringify(req.query)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', ...cached });

  const { skip } = paginate(null, page, limit);
  const filter = { isApproved: true };
  if (muscle) filter['muscleGroup.primary'] = muscle;
  if (equipment) filter.equipment = equipment;
  if (difficulty) filter.difficulty = difficulty;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const [exercises, total] = await Promise.all([
    Exercise.find(filter).skip(skip).limit(parseInt(limit)).sort({ usageCount: -1, name: 1 }),
    Exercise.countDocuments(filter),
  ]);

  const result = paginateResponse(exercises, total, page, limit);
  await cacheSet(cacheKey, result, 600);
  res.status(200).json({ status: 'success', ...result });
});

exports.getExercise = asyncHandler(async (req, res) => {
  const cacheKey = `exercises:single:${req.params.id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.status(200).json({ status: 'success', data: { exercise: cached } });

  const exercise = await Exercise.findById(req.params.id).populate('variations', 'name muscleGroup difficulty');
  if (!exercise) throw new AppError('Exercise not found.', 404);

  await cacheSet(cacheKey, exercise, 3600);
  res.status(200).json({ status: 'success', data: { exercise } });
});

exports.updateExercise = asyncHandler(async (req, res) => {
  const exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!exercise) throw new AppError('Exercise not found.', 404);
  await cacheDel(`exercises:single:${req.params.id}`);
  await cacheDelPattern('exercises:list:*');
  res.status(200).json({ status: 'success', data: { exercise } });
});

exports.deleteExercise = asyncHandler(async (req, res) => {
  const exercise = await Exercise.findByIdAndDelete(req.params.id);
  if (!exercise) throw new AppError('Exercise not found.', 404);
  await cacheDel(`exercises:single:${req.params.id}`);
  await cacheDelPattern('exercises:list:*');
  res.status(200).json({ status: 'success', message: 'Exercise deleted.' });
});

exports.uploadExerciseMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded.', 400);
  const exercise = await Exercise.findById(req.params.id);
  if (!exercise) throw new AppError('Exercise not found.', 404);

  const isVideo = req.file.mimetype.startsWith('video/');
  if (isVideo) {
    exercise.media.video = { url: req.file.path, publicId: req.file.filename };
  } else {
    exercise.media.images.push({ url: req.file.path, publicId: req.file.filename });
  }
  await exercise.save();
  await cacheDel(`exercises:single:${req.params.id}`);
  res.status(200).json({ status: 'success', data: { media: exercise.media } });
});

exports.approveExercise = asyncHandler(async (req, res) => {
  const exercise = await Exercise.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
  if (!exercise) throw new AppError('Exercise not found.', 404);
  await cacheDelPattern('exercises:*');
  res.status(200).json({ status: 'success', message: 'Exercise approved.', data: { exercise } });
});

exports.getMuscleGroups = asyncHandler(async (req, res) => {
  const groups = await Exercise.distinct('muscleGroup.primary', { isApproved: true });
  res.status(200).json({ status: 'success', data: { muscleGroups: groups } });
});
