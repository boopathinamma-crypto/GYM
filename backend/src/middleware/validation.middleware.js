const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./error.middleware');

// Run validation & collect errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => `${e.path}: ${e.msg}`).join('. ');
    return next(new AppError(messages, 422));
  }
  next();
};

// ─── Auth Validators ─────────────────────────────────────────────────────────

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('role').optional().isIn(['member', 'trainer']).withMessage('Invalid role'),
  validate,
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  validate,
];

// ─── User/Profile Validators ──────────────────────────────────────────────────

const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('profile.age').optional().isInt({ min: 10, max: 100 }).withMessage('Age must be 10-100'),
  body('profile.height').optional().isFloat({ min: 50, max: 300 }).withMessage('Height must be 50-300 cm'),
  body('profile.weight').optional().isFloat({ min: 10, max: 500 }).withMessage('Weight must be 10-500 kg'),
  body('profile.fitnessGoal').optional()
    .isIn(['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'general_fitness'])
    .withMessage('Invalid fitness goal'),
  body('profile.fitnessLevel').optional()
    .isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid fitness level'),
  validate,
];

// ─── Workout Validators ───────────────────────────────────────────────────────

const createWorkoutValidator = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('category').isIn(['strength', 'weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'cardio', 'hiit', 'yoga'])
    .withMessage('Invalid category'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  body('estimatedDuration').isInt({ min: 1, max: 360 }).withMessage('Duration must be 1-360 minutes'),
  body('sections').isArray({ min: 1 }).withMessage('At least one section required'),
  validate,
];

// ─── Exercise Validators ──────────────────────────────────────────────────────

const createExerciseValidator = [
  body('name').trim().notEmpty().withMessage('Exercise name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  body('category').isIn(['strength', 'cardio', 'flexibility', 'balance', 'plyometric']).withMessage('Invalid category'),
  validate,
];

// ─── Progress Validators ──────────────────────────────────────────────────────

const logProgressValidator = [
  body('type').isIn(['workout_log', 'body_measurement', 'personal_record']).withMessage('Invalid progress type'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  validate,
];

// ─── Membership Validators ────────────────────────────────────────────────────

const createPlanValidator = [
  body('name').trim().notEmpty().withMessage('Plan name is required'),
  body('type').isIn(['monthly', 'quarterly', 'yearly', 'custom']).withMessage('Invalid plan type'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer (days)'),
  validate,
];

// ─── Booking Validators ───────────────────────────────────────────────────────

const createBookingValidator = [
  body('type').isIn(['class', 'trainer_session']).withMessage('Invalid booking type'),
  body('sessionDate').isISO8601().withMessage('Valid session date required'),
  validate,
];

// ─── Pagination Validators ────────────────────────────────────────────────────

const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  validate,
];

// ─── ID Validators ────────────────────────────────────────────────────────────

const mongoIdValidator = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  changePasswordValidator,
  updateProfileValidator,
  createWorkoutValidator,
  createExerciseValidator,
  logProgressValidator,
  createPlanValidator,
  createBookingValidator,
  paginationValidator,
  mongoIdValidator,
};
