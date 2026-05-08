const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { AppError } = require('./error.middleware');
const { cacheGet } = require('../config/redis');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // Check blacklisted tokens
    const isBlacklisted = await cacheGet(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(new AppError('Token has been invalidated. Please log in again.', 401));
    }

    const decoded = verifyAccessToken(token);

    // Check user still exists
    const user = await User.findById(decoded.id).select('+isActive');
    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account has been deactivated.', 403));
    }

    if (user.isLocked()) {
      return next(new AppError('Account is temporarily locked due to too many failed login attempts.', 423));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired. Please refresh.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token.', 401));
    }
    logger.error(`Auth middleware error: ${error.message}`);
    next(new AppError('Authentication failed.', 401));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    }
  } catch (_) {
    // ignore errors - optional auth
  }
  next();
};

module.exports = { protect, optionalAuth };
