const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

// ─── Validate that email env vars are set ────────────────────────────────────
const isEmailConfigured = () => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || EMAIL_USER.trim() === '') return false;
  if (!EMAIL_PASS || EMAIL_PASS.trim() === '') return false;
  if (EMAIL_USER === 'your_email@gmail.com') return false;
  if (EMAIL_PASS === 'your_app_password') return false;
  return true;
};

// ─── Build transporter (lazy singleton) ──────────────────────────────────────
const getTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error(
      'Email not configured. Set EMAIL_USER and EMAIL_PASS in your .env file. ' +
      'See README for Gmail App Password setup instructions.'
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        // Allow self-signed certs in dev
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
    logger.info(`Email transporter created for ${process.env.EMAIL_USER}`);
  }
  return transporter;
};

// ─── Core send function ───────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailConfigured()) {
    const msg = `Email not configured — skipping send to ${to}. Set EMAIL_USER + EMAIL_PASS in .env`;
    logger.warn(msg);
    throw new Error(msg);
  }

  try {
    const t = getTransporter();
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || `GymPro <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html,
    });
    logger.info(`✅ Email sent to ${to} | MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    // Reset transporter so next attempt rebuilds it (handles auth token refresh)
    transporter = null;
    logger.error(`❌ Email send error to ${to}: ${error.message}`);
    throw error;
  }
};

// ─── HTML Email Template ──────────────────────────────────────────────────────
const emailTemplate = (title, content, ctaText = '', ctaUrl = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0d0d0d; padding: 24px; }
    .wrapper { max-width: 580px; margin: 0 auto; }
    .card { background: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a2a; }
    .header { background: linear-gradient(135deg, #e63946, #ff6b35); padding: 28px 32px; text-align: center; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 800; letter-spacing: 2px; }
    .body { padding: 32px; color: #d0d0d0; line-height: 1.7; }
    .body h2 { color: #f0f0f0; margin-bottom: 16px; font-size: 20px; }
    .body p { margin-bottom: 12px; color: #b0b0b0; }
    .body strong { color: #f0f0f0; }
    .otp-box { background: #111; border: 2px solid #e63946; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 44px; font-weight: 900; letter-spacing: 12px; color: #e63946; font-family: monospace; }
    .cta { display: inline-block; background: linear-gradient(135deg, #e63946, #ff6b35); color: #fff; padding: 13px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; margin-top: 20px; }
    .footer { padding: 20px 32px; text-align: center; color: #555; font-size: 12px; border-top: 1px solid #2a2a2a; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header"><h1>💪 GYMPRO</h1></div>
      <div class="body">
        <h2>${title}</h2>
        ${content}
        ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="cta">${ctaText}</a>` : ''}
      </div>
      <div class="footer">© ${new Date().getFullYear()} GymPro · This is an automated message, please do not reply.</div>
    </div>
  </div>
</body>
</html>
`;

// ─── OTP Email ────────────────────────────────────────────────────────────────
const sendEmailOTP = async (email, name, otp) => {
  return sendEmail({
    to: email,
    subject: 'GymPro — Your Verification Code',
    html: emailTemplate(
      'Verify Your Email Address',
      `<p>Hi <strong>${name}</strong>,</p>
       <p>Use the 6-digit code below to verify your GymPro account:</p>
       <div class="otp-box">
         <div class="otp-code">${otp}</div>
       </div>
       <p>This code expires in <strong>10 minutes</strong>.</p>
       <p>If you did not create a GymPro account, please ignore this email.</p>`
    ),
  });
};


// ─── Login OTP Email ──────────────────────────────────────────────────────────
const sendLoginOTP = async (email, name, otp) => {
  return sendEmail({
    to: email,
    subject: 'GymPro — Your Login Verification Code',
    html: emailTemplate(
      'Login Verification',
      `<p>Hi <strong>${name}</strong>,</p>
       <p>Someone is trying to log in to your GymPro account. Use this code to verify it's you:</p>
       <div class="otp-box">
         <div class="otp-code">${otp}</div>
       </div>
       <p>This code expires in <strong>10 minutes</strong>.</p>
       <p>If this wasn't you, please ignore this email and your account remains secure.</p>`
    ),
  });
};

// ─── Password Reset ───────────────────────────────────────────────────────────
const sendPasswordReset = async (email, name, resetURL) => {
  return sendEmail({
    to: email,
    subject: 'GymPro — Reset Your Password',
    html: emailTemplate(
      'Reset Your Password',
      `<p>Hi <strong>${name}</strong>,</p>
       <p>Click the button below to create a new password. This link expires in <strong>1 hour</strong>.</p>
       <p>If you didn't request this, you can safely ignore this email.</p>`,
      'Reset Password',
      resetURL
    ),
  });
};

// ─── Membership Confirmation ──────────────────────────────────────────────────
const sendMembershipConfirmation = async (user, plan, endDate) => {
  return sendEmail({
    to: user.email,
    subject: 'GymPro — Membership Activated! 🎉',
    html: emailTemplate(
      'Welcome to GymPro Premium!',
      `<p>Hi <strong>${user.name}</strong>,</p>
       <p>Your <strong>${plan.name}</strong> membership is now active!</p>
       <ul style="margin: 16px 0; padding-left: 20px; color: #b0b0b0;">
         <li style="margin-bottom: 6px;">Plan: <strong style="color:#f0f0f0">${plan.name}</strong></li>
         <li style="margin-bottom: 6px;">Valid Until: <strong style="color:#f0f0f0">${new Date(endDate).toLocaleDateString()}</strong></li>
         <li>Amount Paid: <strong style="color:#f0f0f0">₹${plan.price}</strong></li>
       </ul>`,
      'Go to Dashboard',
      `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`
    ),
  });
};

// ─── Membership Expiring ──────────────────────────────────────────────────────
const sendMembershipExpiring = async (user, daysLeft) => {
  return sendEmail({
    to: user.email,
    subject: `GymPro — Membership Expiring in ${daysLeft} Day${daysLeft > 1 ? 's' : ''}`,
    html: emailTemplate(
      'Your Membership is Expiring Soon',
      `<p>Hi <strong>${user.name}</strong>,</p>
       <p>Your GymPro membership expires in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>. Renew now to keep your fitness momentum going!</p>`,
      'Renew Now',
      `${process.env.CLIENT_URL || 'http://localhost:3000'}/membership`
    ),
  });
};

// ─── Class Cancellation ───────────────────────────────────────────────────────
const sendClassCancellation = async (user, gymClass) => {
  return sendEmail({
    to: user.email,
    subject: 'GymPro — Class Cancelled',
    html: emailTemplate(
      'Class Cancellation Notice',
      `<p>Hi <strong>${user.name}</strong>,</p>
       <p>The <strong>${gymClass.title}</strong> class on ${new Date(gymClass.startTime).toLocaleString()} has been cancelled.</p>
       <p>Please book an alternative from our schedule.</p>`,
      'View Classes',
      `${process.env.CLIENT_URL || 'http://localhost:3000'}/booking`
    ),
  });
};

// ─── Workout Reminder ─────────────────────────────────────────────────────────
const sendWorkoutReminder = async (user, workoutTitle) => {
  return sendEmail({
    to: user.email,
    subject: "GymPro — Don't Break Your Streak! 💪",
    html: emailTemplate(
      "Time to Work Out!",
      `<p>Hi <strong>${user.name}</strong>,</p>
       <p>Your planned workout <strong>${workoutTitle}</strong> is waiting. Your current streak is <strong>${user.streaks?.current || 0} days</strong> — keep it going!</p>`,
      'Start Workout',
      `${process.env.CLIENT_URL || 'http://localhost:3000'}/workouts`
    ),
  });
};

module.exports = {
  sendEmail,
  sendEmailOTP,
  sendLoginOTP,
  sendPasswordReset,
  sendMembershipConfirmation,
  sendMembershipExpiring,
  sendClassCancellation,
  sendWorkoutReminder,
  isEmailConfigured,
};