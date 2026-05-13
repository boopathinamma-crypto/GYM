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
  authRouter,
  userRouter,
  workoutRouter,
  exerciseRouter,
  progressRouter,
  membershipRouter,
  bookingRouter,
  chatRouter,
  analyticsRouter
} = require('./routes/index');

const app = express();


// ─── Security Middleware ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(mongoSanitize());
app.use(xss());


// ─── CORS ────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://gym-frontend.onrender.com"
  ],
  credentials: true
}));

// ─── Passport ────────────────────────────────────────────────────────
setupPassport();
app.use(passport.initialize());


// ─── Body Parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());


// ─── Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (msg) => logger.info(msg.trim()),
      },
    })
  );
}


// ─── Rate Limiter ────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}


// ─── Health Route ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'GymPro API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});


// ─── Root Route (NEW) ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'GymPro API is running successfully',
  });
});


// ─── Inject socket.io ────────────────────────────────────────────────
app.use((req, res, next) => {
  req.io = app.get('io');
  next();
});


// ─── API Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/ai', require('./routes/aiRoutes'));

app.use('/api/users', userRouter);
app.use('/api/workouts', workoutRouter);
app.use('/api/exercises', exerciseRouter);
app.use('/api/progress', progressRouter);
app.use('/api/membership', membershipRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/chat', chatRouter);
app.use('/api/analytics', analyticsRouter);


// ─── Stripe Webhook ──────────────────────────────────────────────────
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const paymentService = require('./services/payment.service');

    try {
      const event = paymentService.handleStripeWebhook(
        req.body,
        req.headers['stripe-signature']
      );

      logger.info(`Stripe webhook: ${event.type}`);

      res.json({ received: true });
    } catch (err) {
      logger.error(`Stripe webhook error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);


// ─── Serve Frontend ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(
    express.static(
      path.join(__dirname, '../../frontend/dist')
    )
  );

  app.get('*', (req, res) => {
    res.sendFile(
      path.resolve(
        __dirname,
        '../../frontend/dist/index.html'
      )
    );
  });
}


// ─── Error Handler ───────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);


module.exports = app;
