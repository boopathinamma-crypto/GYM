const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');

const { errorHandler, notFound } = require('./middleware/error.middleware');
const passport = require('passport');
const { setupPassport } = require('./config/passport');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const {
  authRouter, userRouter, workoutRouter, exerciseRouter,
  progressRouter, membershipRouter, bookingRouter, chatRouter, analyticsRouter
} = require('./routes/index');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(mongoSanitize());
app.use(xss());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Passport (Google OAuth)
setupPassport();
app.use(passport.initialize());

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
// Skip entirely in development so local testing is never blocked.
// Individual route-level limiters (authLimiter etc.) still apply in dev
// but with much higher ceilings — see rateLimiter.js.
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'GymPro API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Inject io into req ───────────────────────────────────────────────────────
app.use((req, res, next) => {
  req.io = app.get('io');
  next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
// ── AI Routes (mounted at /api/ai — no conflict with userRouter) ─────────────
app.use('/api/ai', require('./routes/aiRoutes'));

app.use('/api/users', userRouter);
app.use('/api/workouts', workoutRouter);
app.use('/api/exercises', exerciseRouter);
app.use('/api/progress', progressRouter);
app.use('/api/membership', membershipRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/chat', chatRouter);
app.use('/api/analytics', analyticsRouter);



// ─── Stripe Webhook (raw body needed) ────────────────────────────────────────
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const paymentService = require('./services/payment.service');
  try {
    const event = paymentService.handleStripeWebhook(req.body, req.headers['stripe-signature']);
    logger.info(`Stripe webhook: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      // Handle async payment confirmation
    }
    res.json({ received: true });
  } catch (err) {
    logger.error(`Stripe webhook error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ─── Serve frontend in production ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend/dist/index.html'));
  });
}

// ─── 404 & Error Handler ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;