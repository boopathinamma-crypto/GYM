const crypto = require('crypto');

// Generate OTP
const generateOTP = (length = 6) => {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
};

// Generate random token
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

// Calculate BMI
const calculateBMI = (weightKg, heightCm) => {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

// BMI category
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

// Calculate TDEE (Total Daily Energy Expenditure)
const calculateTDEE = ({ weight, height, age, gender, activityLevel }) => {
  // Mifflin-St Jeor equation
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    super_active: 1.9,
  };

  return Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
};

// Calculate macros
const calculateMacros = (tdee, goal) => {
  let calories = tdee;
  if (goal === 'weight_loss') calories = tdee - 500;
  if (goal === 'muscle_gain') calories = tdee + 300;

  return {
    calories,
    protein: Math.round((calories * 0.30) / 4), // 30% protein, 4 cal/g
    carbs: Math.round((calories * 0.45) / 4),   // 45% carbs, 4 cal/g
    fat: Math.round((calories * 0.25) / 9),      // 25% fat, 9 cal/g
  };
};

// Pagination helper
const paginate = (query, page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return {
    skip,
    limit: parseInt(limit),
    page: parseInt(page),
  };
};

// Format pagination response
const paginateResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

// Sanitize user object (remove sensitive fields)
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.emailOTP;
  delete obj.emailOTPExpiry;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

// Date range helpers
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();
  switch (period) {
    case 'week': start.setDate(now.getDate() - 7); break;
    case 'month': start.setMonth(now.getMonth() - 1); break;
    case 'quarter': start.setMonth(now.getMonth() - 3); break;
    case 'year': start.setFullYear(now.getFullYear() - 1); break;
    default: start.setDate(now.getDate() - 30);
  }
  return { start, end: now };
};

// Leaderboard points calculation
const calculatePoints = (action) => {
  const points = {
    workout_completed: 100,
    streak_7days: 200,
    streak_30days: 500,
    personal_record: 150,
    first_class: 50,
    referral: 300,
  };
  return points[action] || 0;
};

module.exports = {
  generateOTP,
  generateToken,
  calculateBMI,
  getBMICategory,
  calculateTDEE,
  calculateMacros,
  paginate,
  paginateResponse,
  sanitizeUser,
  getDateRange,
  calculatePoints,
};
