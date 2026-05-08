// ─── auth.routes.js ───────────────────────────────────────────────────────────
const express = require('express');
const authRouter = express.Router();
const authCtrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { registerValidator, loginValidator, changePasswordValidator } = require('../middleware/validation.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation.middleware');

authRouter.post('/register', authLimiter, registerValidator, authCtrl.register);
authRouter.post('/verify-email', authCtrl.verifyEmail);
authRouter.post('/resend-otp', authLimiter, [body('email').isEmail().withMessage('Valid email required'), validate], authCtrl.resendOTP);
authRouter.post('/login', authLimiter, loginValidator, authCtrl.login);
authRouter.post('/refresh-token', authCtrl.refreshToken);
authRouter.post('/logout', protect, authCtrl.logout);
authRouter.post('/forgot-password', passwordResetLimiter, [body('email').isEmail().withMessage('Valid email required'), validate], authCtrl.forgotPassword);
authRouter.patch('/reset-password/:token', [body('password').isLength({ min: 8 }).withMessage('Password must be 8+ chars'), validate], authCtrl.resetPassword);
authRouter.patch('/change-password', protect, changePasswordValidator, authCtrl.changePassword);
authRouter.get('/me', protect, authCtrl.getMe);

// ─── Google OAuth routes ──────────────────────────────────────────────────────
const passport = require('passport');
const googleCtrl = require('../controllers/google.auth.controller');

// Step 1: Redirect user to Google login page
authRouter.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    prompt: 'select_account',   // always show account picker
  })
);

// Step 2: Google redirects back here with code
authRouter.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/auth/google/failed',
  }),
  googleCtrl.googleCallback
);

// Step 3: Failure redirect
authRouter.get('/google/failed', googleCtrl.googleFailed);



// ─── user.routes.js ───────────────────────────────────────────────────────────
const userRouter = express.Router();
const userCtrl = require('../controllers/user.controller');
const { authorize, authorizeOrSelf } = require('../middleware/role.middleware');
const { uploadAvatar } = require('../config/cloudinary');
const { updateProfileValidator } = require('../middleware/validation.middleware');

userRouter.use(protect);

userRouter.get('/', authorize('admin'), userCtrl.getAllUsers);
userRouter.get('/trainers', userCtrl.getTrainers);
userRouter.get('/leaderboard', userCtrl.getLeaderboard);
userRouter.get('/notifications', userCtrl.getNotifications);
userRouter.patch('/notifications/read', userCtrl.markNotificationsRead);
userRouter.get('/ai/recommend', userCtrl.getAIRecommendation);
userRouter.get('/ai/diet', userCtrl.getAIDietPlan);
userRouter.get('/:id', authorizeOrSelf('admin', 'trainer'), userCtrl.getProfile);
userRouter.patch('/profile', updateProfileValidator, userCtrl.updateProfile);
userRouter.patch('/avatar', uploadAvatar.single('avatar'), userCtrl.uploadAvatar);
userRouter.post('/assign-trainer', userCtrl.assignTrainer);
userRouter.post('/trainer/assign/:id', authorize('admin', 'trainer'), userCtrl.assignTrainer);
userRouter.patch('/save-workout/:workoutId', userCtrl.toggleSaveWorkout);
userRouter.patch('/:id/deactivate', authorize('admin'), userCtrl.deactivateUser);

// ─── workout.routes.js ────────────────────────────────────────────────────────
const workoutRouter = express.Router();
const workoutCtrl = require('../controllers/workout.controller');
const { createWorkoutValidator } = require('../middleware/validation.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');

workoutRouter.get('/', optionalAuth, workoutCtrl.getWorkouts);
workoutRouter.get('/my', protect, workoutCtrl.getMyWorkouts);
workoutRouter.get('/weekly-plan', protect, workoutCtrl.getWeeklyPlan);
workoutRouter.get('/:id', optionalAuth, workoutCtrl.getWorkout);
workoutRouter.post('/', protect, authorize('trainer', 'admin'), createWorkoutValidator, workoutCtrl.createWorkout);
workoutRouter.patch('/:id', protect, authorize('trainer', 'admin'), workoutCtrl.updateWorkout);
workoutRouter.delete('/:id', protect, authorize('trainer', 'admin'), workoutCtrl.deleteWorkout);
workoutRouter.post('/:id/rate', protect, workoutCtrl.rateWorkout);
workoutRouter.post('/:id/assign', protect, authorize('trainer', 'admin'), workoutCtrl.assignWorkout);

// ─── exercise.routes.js ───────────────────────────────────────────────────────
const exerciseRouter = express.Router();
const exerciseCtrl = require('../controllers/exercise.controller');
const { uploadExerciseMedia } = require('../config/cloudinary');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { createExerciseValidator } = require('../middleware/validation.middleware');

exerciseRouter.get('/', exerciseCtrl.getExercises);
exerciseRouter.get('/muscle-groups', exerciseCtrl.getMuscleGroups);
exerciseRouter.get('/:id', exerciseCtrl.getExercise);
exerciseRouter.post('/', protect, createExerciseValidator, exerciseCtrl.createExercise);
exerciseRouter.patch('/:id', protect, authorize('admin'), exerciseCtrl.updateExercise);
exerciseRouter.delete('/:id', protect, authorize('admin'), exerciseCtrl.deleteExercise);
exerciseRouter.post('/:id/media', protect, authorize('admin', 'trainer'), uploadLimiter, uploadExerciseMedia.single('media'), exerciseCtrl.uploadExerciseMedia);
exerciseRouter.patch('/:id/approve', protect, authorize('admin'), exerciseCtrl.approveExercise);

// ─── progress.routes.js ───────────────────────────────────────────────────────
const progressRouter = express.Router();
const progressCtrl = require('../controllers/progress.controller');
const { logProgressValidator } = require('../middleware/validation.middleware');

progressRouter.use(protect);
progressRouter.post('/', logProgressValidator, progressCtrl.logProgress);
progressRouter.get('/history', progressCtrl.getProgressHistory);
progressRouter.get('/history/:userId', authorize('trainer', 'admin'), progressCtrl.getProgressHistory);
progressRouter.get('/summary', progressCtrl.getProgressSummary);
progressRouter.get('/summary/:userId', authorize('trainer', 'admin'), progressCtrl.getProgressSummary);
progressRouter.get('/records', progressCtrl.getPersonalRecords);
progressRouter.get('/report/download', progressCtrl.downloadProgressReport);
progressRouter.delete('/:id', progressCtrl.deleteProgressEntry);

// ─── membership.routes.js ─────────────────────────────────────────────────────
const membershipRouter = express.Router();
const membershipCtrl = require('../controllers/membership.controller');
const { createPlanValidator } = require('../middleware/validation.middleware');

membershipRouter.get('/plans', membershipCtrl.getPlans);
membershipRouter.post('/plans', protect, authorize('admin'), createPlanValidator, membershipCtrl.createPlan);
membershipRouter.patch('/plans/:id', protect, authorize('admin'), membershipCtrl.updatePlan);
membershipRouter.delete('/plans/:id', protect, authorize('admin'), membershipCtrl.deletePlan);
membershipRouter.get('/my', protect, membershipCtrl.getMyMembership);
membershipRouter.post('/initiate-payment', protect, membershipCtrl.initiatePayment);
membershipRouter.post('/verify-payment', protect, membershipCtrl.verifyPayment);
membershipRouter.patch('/cancel', protect, membershipCtrl.cancelMembership);
membershipRouter.get('/payments', protect, membershipCtrl.getPaymentHistory);
membershipRouter.get('/all', protect, authorize('admin'), membershipCtrl.getAllMemberships);

// ─── booking.routes.js ────────────────────────────────────────────────────────
const bookingRouter = express.Router();
const bookingCtrl = require('../controllers/booking.controller');
const { createBookingValidator } = require('../middleware/validation.middleware');

bookingRouter.get('/classes', optionalAuth, bookingCtrl.getClasses);
bookingRouter.post('/classes', protect, authorize('trainer', 'admin'), bookingCtrl.createClass);
bookingRouter.patch('/classes/:id', protect, authorize('trainer', 'admin'), bookingCtrl.updateClass);
bookingRouter.post('/classes/:id/cancel', protect, authorize('trainer', 'admin'), bookingCtrl.cancelClass);
bookingRouter.post('/', protect, createBookingValidator, bookingCtrl.createBooking);
bookingRouter.get('/my', protect, bookingCtrl.getMyBookings);
bookingRouter.patch('/:id/cancel', protect, bookingCtrl.cancelBooking);
bookingRouter.patch('/:id/confirm', protect, authorize('trainer', 'admin'), bookingCtrl.confirmBooking);
bookingRouter.post('/:id/feedback', protect, bookingCtrl.submitFeedback);
bookingRouter.get('/schedule/:trainerId', protect, bookingCtrl.getTrainerSchedule);
bookingRouter.get('/schedule', protect, authorize('trainer'), bookingCtrl.getTrainerSchedule);

// ─── chat.routes.js ───────────────────────────────────────────────────────────
const chatRouter = express.Router();
const chatCtrl = require('../controllers/chat.controller');

chatRouter.use(protect);
chatRouter.get('/conversations', chatCtrl.getConversations);
chatRouter.get('/conversations/:participantId/get-or-create', chatCtrl.getOrCreateConversation);
chatRouter.get('/conversations/:conversationId/messages', chatCtrl.getMessages);
chatRouter.post('/conversations/:conversationId/messages', chatCtrl.sendMessage);
chatRouter.delete('/conversations/:conversationId/messages/:messageId', chatCtrl.deleteMessage);

// ─── analytics.routes.js ─────────────────────────────────────────────────────
const analyticsRouter = express.Router();
const analyticsCtrl = require('../controllers/analytics.controller');

analyticsRouter.use(protect);
analyticsRouter.get('/dashboard', authorize('admin'), analyticsCtrl.getDashboardStats);
analyticsRouter.get('/revenue', authorize('admin'), analyticsCtrl.getRevenueChart);
analyticsRouter.get('/users', authorize('admin'), analyticsCtrl.getUserActivityChart);
analyticsRouter.get('/workouts', authorize('admin', 'trainer'), analyticsCtrl.getWorkoutAnalytics);
analyticsRouter.get('/members', authorize('admin', 'trainer'), analyticsCtrl.getMemberProgressAnalytics);

module.exports = {
  authRouter,
  userRouter: userRouter.use(protect) && userRouter,
  workoutRouter,
  exerciseRouter,
  progressRouter,
  membershipRouter,
  bookingRouter,
  chatRouter,
  analyticsRouter,
};

// Fix: re-export each properly
module.exports = { authRouter, userRouter, workoutRouter, exerciseRouter, progressRouter, membershipRouter, bookingRouter, chatRouter, analyticsRouter };
