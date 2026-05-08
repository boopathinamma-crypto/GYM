const rateLimit = require('express-rate-limit');
const { AppError } = require('./error.middleware');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * In development mode: rate limits are very permissive so testing is easy.
 * In production mode: strict limits protect the API.
 */
const createLimiter = (windowMs, max, devMax, message) => {
  // In dev: use devMax (very high). In production: use max (strict).
  const effectiveMax = isDev ? devMax : max;

  return rateLimit({
    windowMs,
    max: effectiveMax,
    message: { status: 'fail', message },
    standardHeaders: true,   // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    skip: () => isDev && devMax >= 9999, // Skip entirely in dev for unlimited limiters
    handler: (req, res, next, options) => {
      next(new AppError(
        `${options.message.message} (limit: ${effectiveMax} req/${Math.round(windowMs / 60000)} min)`,
        429
      ));
    },
    keyGenerator: (req) => {
      // Use IP, but also support X-Forwarded-For for proxies
      return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    },
  });
};

// ─── General API Limiter ──────────────────────────────────────────────────────
// Production: 100 req / 15 min
// Dev:        unlimited (skip)
const apiLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  parseInt(process.env.RATE_LIMIT_MAX) || 100,
  9999,   // dev: essentially unlimited
  'Too many requests from this IP. Please try again later.'
);

// ─── Auth Limiter (login / register) ─────────────────────────────────────────
// Production: 20 req / 15 min  (was 10 — doubled to avoid false positives)
// Dev:        500 req / 15 min (no accidental blocks while testing)
const authLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  500,
  'Too many auth attempts from this IP. Please wait 15 minutes before trying again.'
);

// ─── Upload Limiter ───────────────────────────────────────────────────────────
// Production: 20 req / hr
// Dev:        200 req / hr
const uploadLimiter = createLimiter(
  60 * 60 * 1000,
  20,
  200,
  'Upload limit reached. Please wait an hour.'
);

// ─── Password Reset Limiter ───────────────────────────────────────────────────
// Production: 5 req / hr
// Dev:        50 req / hr
const passwordResetLimiter = createLimiter(
  60 * 60 * 1000,
  5,
  50,
  'Too many password reset requests. Please wait an hour.'
);

module.exports = { apiLimiter, authLimiter, uploadLimiter, passwordResetLimiter };