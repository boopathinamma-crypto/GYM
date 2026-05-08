const crypto = require('crypto');
const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { generateOTP, generateToken, sanitizeUser } = require('../utils/helpers');
const { AppError, asyncHandler } = require('../middleware/error.middleware');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const isDev = process.env.NODE_ENV !== 'production';

// ─── Register ────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already registered. Please log in.', 409);

  const otp = generateOTP(6);
  const otpExpiry = new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000);

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'trainer' ? 'trainer' : 'member',
    emailOTP: otp,
    emailOTPExpiry: otpExpiry,
  });

  let emailSent = false;
  let emailError = null;

  try {
    await notificationService.sendEmailOTP(email, name, otp);
    emailSent = true;
    logger.info(`OTP email sent to ${email}`);
  } catch (err) {
    emailError = err.message;
    logger.warn(`OTP email failed for ${email}: ${err.message}`);
  }

  if (isDev) {
    logger.info(`══════════════════════════════════════`);
    logger.info(`DEV MODE — OTP for ${email}: ${otp}`);
    logger.info(`══════════════════════════════════════`);
  }

  const responseData = {
    userId: user._id,
    email: user.email,
    emailSent,
  };

  if (isDev && !emailSent) {
    responseData.devOTP = otp;
    responseData.devNote = 'Email sending failed. Use this OTP for development testing.';
  }

  const message = emailSent
    ? 'Registration successful. Please check your email for the 6-digit OTP.'
    : isDev
      ? `Registration successful. Email not configured — use devOTP from this response (also printed in backend logs).`
      : 'Registration successful. If you do not receive an email within a few minutes, click Resend OTP.';

  res.status(201).json({
    status: 'success',
    message,
    data: responseData,
    ...(isDev && emailError && { emailError }),
  });
});

// ─── Verify Email OTP (Registration) ─────────────────────────────────────────
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId) throw new AppError('userId is required.', 400);
  if (!otp) throw new AppError('OTP is required.', 400);

  const user = await User.findById(userId).select('+emailOTP +emailOTPExpiry +refreshTokens');
  if (!user) throw new AppError('User not found.', 404);
  if (user.isEmailVerified) throw new AppError('Email already verified. Please log in.', 400);

  if (!user.emailOTP) throw new AppError('No OTP found. Please request a new one.', 400);
  if (user.emailOTP !== String(otp)) throw new AppError('Invalid OTP. Please check and try again.', 400);
  if (user.emailOTPExpiry < Date.now()) throw new AppError('OTP has expired. Please click Resend OTP.', 400);

  user.isEmailVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = generateTokenPair(user);
  user.refreshTokens = [...(user.refreshTokens || []), refreshToken];
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully! Welcome to GymPro.',
    data: { accessToken, user: sanitizeUser(user) },
  });
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────
exports.resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required.', 400);

  const user = await User.findOne({ email }).select('+emailOTP +emailOTPExpiry');
  if (!user) throw new AppError('User not found.', 404);
  if (user.isEmailVerified) throw new AppError('Email already verified.', 400);

  const resendKey = `otp_resend:${user._id}`;
  const attempts = await cacheGet(resendKey).catch(() => null);
  if (parseInt(attempts) >= 3) {
    throw new AppError('Too many OTP requests. Please wait an hour.', 429);
  }
  await cacheSet(resendKey, parseInt(attempts || 0) + 1, 3600).catch(() => { });

  const otp = generateOTP(6);
  user.emailOTP = otp;
  user.emailOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  let emailSent = false;
  let emailError = null;
  try {
    await notificationService.sendEmailOTP(email, user.name, otp);
    emailSent = true;
  } catch (err) {
    emailError = err.message;
    logger.warn(`Resend OTP email failed: ${err.message}`);
  }

  if (isDev) {
    logger.info(`DEV MODE — Resend OTP for ${email}: ${otp}`);
  }

  res.status(200).json({
    status: 'success',
    message: emailSent ? 'New OTP sent to your email.' : 'OTP generated.',
    ...(isDev && !emailSent && { devOTP: otp, emailError }),
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
// Step 1: Verify password → send OTP → wait for verifyLoginOTP
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email })
    .select('+password +loginAttempts +lockUntil +refreshTokens +isActive +emailOTP +emailOTPExpiry');

  if (!user) throw new AppError('Invalid email or password.', 401);

  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new AppError(`Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`, 423);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isEmailVerified) {
    throw new AppError(
      'Please verify your email before logging in. Check your inbox or click Resend OTP.',
      403,
      'EMAIL_NOT_VERIFIED'
    );
  }

  if (!user.isActive) throw new AppError('Your account has been deactivated. Contact support.', 403);

  // Reset login attempts on success
  if (user.loginAttempts > 0) {
    await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
  }

  // ── Generate login OTP and send every time ───────────────────────────────
  const otp = generateOTP(6);
  user.emailOTP = otp;
  user.emailOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
  await user.save({ validateBeforeSave: false });

  let emailSent = false;
  let emailError = null;
  try {
    await notificationService.sendEmailOTP(email, user.name, otp);
    emailSent = true;
    logger.info(`Login OTP sent to ${email}`);
  } catch (err) {
    emailError = err.message;
    logger.warn(`Login OTP email failed for ${email}: ${err.message}`);
  }

  if (isDev) {
    logger.info(`══════════════════════════════════════`);
    logger.info(`DEV MODE — Login OTP for ${email}: ${otp}`);
    logger.info(`══════════════════════════════════════`);
  }

  res.status(200).json({
    status: 'success',
    message: emailSent
      ? 'OTP sent to your email. Please verify to complete login.'
      : isDev
        ? 'Email not configured — use devOTP to complete login.'
        : 'OTP sent. Please check your email.',
    data: {
      userId: user._id,
      email: user.email,
      emailSent,
      requiresOTP: true,
      ...(isDev && !emailSent && { devOTP: otp }),
      ...(isDev && emailError && { emailError }),
    },
  });
});

// ─── Verify Login OTP ─────────────────────────────────────────────────────────
// Step 2: Verify OTP → issue tokens → login complete
exports.verifyLoginOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId) throw new AppError('userId is required.', 400);
  if (!otp) throw new AppError('OTP is required.', 400);

  const user = await User.findById(userId)
    .select('+emailOTP +emailOTPExpiry +refreshTokens +isActive');

  if (!user) throw new AppError('User not found.', 404);
  if (!user.isActive) throw new AppError('Your account has been deactivated. Contact support.', 403);
  if (!user.emailOTP) throw new AppError('No OTP found. Please log in again.', 400);
  if (user.emailOTP !== String(otp)) throw new AppError('Invalid OTP. Please check and try again.', 400);
  if (user.emailOTPExpiry < Date.now()) throw new AppError('OTP has expired. Please log in again.', 400);

  // Clear OTP after successful verification
  user.emailOTP = undefined;
  user.emailOTPExpiry = undefined;
  user.lastLogin = new Date();

  const { accessToken, refreshToken } = generateTokenPair(user);
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    status: 'success',
    message: 'Login successful. Welcome back!',
    data: { accessToken, user: sanitizeUser(user) },
  });
});

// ─── Resend Login OTP ─────────────────────────────────────────────────────────
exports.resendLoginOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new AppError('userId is required.', 400);

  const user = await User.findById(userId).select('+emailOTP +emailOTPExpiry');
  if (!user) throw new AppError('User not found.', 404);

  // Rate limit: max 3 resends per 10 minutes
  const resendKey = `login_otp_resend:${user._id}`;
  const attempts = await cacheGet(resendKey).catch(() => null);
  if (parseInt(attempts) >= 3) {
    throw new AppError('Too many OTP requests. Please wait 10 minutes.', 429);
  }
  await cacheSet(resendKey, parseInt(attempts || 0) + 1, 600).catch(() => { });

  const otp = generateOTP(6);
  user.emailOTP = otp;
  user.emailOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  let emailSent = false;
  let emailError = null;
  try {
    await notificationService.sendEmailOTP(user.email, user.name, otp);
    emailSent = true;
  } catch (err) {
    emailError = err.message;
    logger.warn(`Resend login OTP failed: ${err.message}`);
  }

  if (isDev) {
    logger.info(`DEV MODE — Resend Login OTP for ${user.email}: ${otp}`);
  }

  res.status(200).json({
    status: 'success',
    message: emailSent ? 'New OTP sent to your email.' : 'OTP generated.',
    ...(isDev && !emailSent && { devOTP: otp, emailError }),
  });
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new AppError('Refresh token not provided.', 401);

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(token)) {
    throw new AppError('Invalid refresh token. Please log in again.', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  user.refreshTokens.push(newRefreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
  res.status(200).json({ status: 'success', data: { accessToken } });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (req.token) {
    await cacheSet(`blacklist:${req.token}`, '1', 15 * 60).catch(() => { });
  }

  if (token) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: token } });
  }

  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({
      status: 'success',
      message: 'If that email is registered, a reset link has been sent.',
    });
  }

  const resetToken = generateToken(32);
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  try {
    await notificationService.sendPasswordReset(email, user.name, resetURL);
  } catch (err) {
    logger.warn(`Password reset email failed: ${err.message}`);
    if (isDev) logger.info(`DEV — Reset URL: ${resetURL}`);
  }

  res.status(200).json({
    status: 'success',
    message: 'If that email is registered, a reset link has been sent.',
    ...(isDev && { devResetURL: resetURL }),
  });
});

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpiry +refreshTokens');

  if (!user) throw new AppError('Invalid or expired reset link. Please request a new one.', 400);

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  user.refreshTokens = [];
  await user.save();

  res.status(200).json({ status: 'success', message: 'Password reset successful. Please log in.' });
});

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password +refreshTokens');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect.', 400);

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  if (req.token) await cacheSet(`blacklist:${req.token}`, '1', 15 * 60).catch(() => { });
  res.clearCookie('refreshToken');

  res.status(200).json({ status: 'success', message: 'Password changed. Please log in again.' });
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('assignedTrainer', 'name email avatar profile.fitnessLevel')
    .populate('savedWorkouts', 'title category difficulty estimatedDuration thumbnail');

  res.status(200).json({
    status: 'success',
    data: { user: sanitizeUser(user) },
  });
});