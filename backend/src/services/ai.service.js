const Workout = require('../models/Workout');
const { calculateTDEE, calculateMacros, getBMICategory } = require('../utils/helpers');

/**
 * AI Workout Recommendation Engine
 * Uses BMI, fitness goal, history, and level to suggest workouts
 */
const recommendWorkout = async (user, recentWorkouts = []) => {
  const { profile } = user;
  const bmi = profile?.bmi;
  const goal = profile?.fitnessGoal;
  const level = profile?.fitnessLevel || 'beginner';

  // Build recommendation criteria
  const criteria = { isPublic: true, difficulty: level };

  // Goal-based category mapping
  const goalCategoryMap = {
    weight_loss: ['weight_loss', 'cardio', 'hiit'],
    muscle_gain: ['muscle_gain', 'strength'],
    endurance: ['cardio', 'hiit', 'endurance'],
    flexibility: ['flexibility', 'yoga'],
    general_fitness: ['strength', 'cardio', 'hiit', 'flexibility'],
  };

  if (goal && goalCategoryMap[goal]) {
    criteria.category = { $in: goalCategoryMap[goal] };
  }

  // Exclude recently done workouts (last 5)
  const recentIds = recentWorkouts.map((w) => w.workout?._id).filter(Boolean);
  if (recentIds.length > 0) {
    criteria._id = { $nin: recentIds };
  }

  // BMI-based adjustments
  let intensityNote = '';
  if (bmi) {
    if (bmi > 30) {
      // Obese: recommend low-impact
      criteria.tags = { $in: ['low-impact', 'beginner-friendly'] };
      intensityNote = 'Low-impact workouts recommended based on your BMI.';
    } else if (bmi < 18.5) {
      // Underweight: focus on muscle building
      criteria.category = { $in: ['muscle_gain', 'strength'] };
      intensityNote = 'Muscle-building workouts recommended to help you gain healthy weight.';
    }
  }

  const workouts = await Workout.find(criteria)
    .select('title category difficulty estimatedDuration caloriesBurn thumbnail averageRating completionCount tags')
    .sort({ averageRating: -1, completionCount: -1 })
    .limit(6);

  // Score each workout
  const scored = workouts.map((workout) => {
    let score = workout.averageRating * 10 + workout.completionCount * 0.1;

    // Boost score for goal alignment
    if (goal && goalCategoryMap[goal]?.includes(workout.category)) score += 20;

    // Boost for matching level
    if (workout.difficulty === level) score += 15;
    else if (
      (level === 'intermediate' && workout.difficulty === 'beginner') ||
      (level === 'advanced' && workout.difficulty === 'intermediate')
    ) score += 5;

    return { ...workout.toObject(), aiScore: score.toFixed(1) };
  });

  scored.sort((a, b) => b.aiScore - a.aiScore);

  // Variety: mix categories
  const uniqueCategories = new Set();
  const recommendations = [];
  for (const w of scored) {
    if (!uniqueCategories.has(w.category) || recommendations.length < 3) {
      recommendations.push(w);
      uniqueCategories.add(w.category);
    }
    if (recommendations.length >= 4) break;
  }

  // Generate personalized reasoning
  const reasoning = generateReasoning(user, recommendations, intensityNote);

  return {
    recommendations,
    reasoning,
    basedOn: {
      bmi: bmi ? `${bmi} (${getBMICategory(bmi)})` : 'Not set',
      goal: goal || 'Not set',
      level,
      recentWorkoutsExcluded: recentIds.length,
    },
  };
};

const generateReasoning = (user, workouts, intensityNote) => {
  const { profile } = user;
  const reasons = [];

  if (profile?.fitnessGoal) {
    const goalMessages = {
      weight_loss: 'These workouts are optimized for fat burning and calorie expenditure.',
      muscle_gain: 'These workouts focus on progressive resistance training to build muscle mass.',
      endurance: 'These workouts will improve your cardiovascular fitness and stamina.',
      flexibility: 'These workouts will improve your range of motion and reduce injury risk.',
      general_fitness: 'A balanced mix of strength and cardio for overall fitness.',
    };
    reasons.push(goalMessages[profile.fitnessGoal]);
  }

  if (intensityNote) reasons.push(intensityNote);

  if (profile?.fitnessLevel) {
    reasons.push(`Matched to your ${profile.fitnessLevel} fitness level.`);
  }

  if (workouts.length > 0) {
    const avgDuration = Math.round(workouts.reduce((s, w) => s + w.estimatedDuration, 0) / workouts.length);
    reasons.push(`Average session time: ${avgDuration} minutes — fits a busy schedule.`);
  }

  return reasons;
};

/**
 * AI Diet Plan Generator
 * Calculates TDEE and generates macro-balanced meal plan
 */
const generateDietPlan = async (user) => {
  const { profile } = user;

  if (!profile?.weight || !profile?.height || !profile?.age) {
    return { error: 'Incomplete profile. Please update height, weight, and age.' };
  }

  const tdee = calculateTDEE({
    weight: profile.weight,
    height: profile.height,
    age: profile.age,
    gender: profile.gender || 'male',
    activityLevel: profile.activityLevel || 'moderately_active',
  });

  const macros = calculateMacros(tdee, profile.fitnessGoal);
  const bmiCategory = getBMICategory(profile.bmi || 22);

  // Generate meal plan templates based on goal
  const mealPlans = generateMealTemplates(macros, profile.fitnessGoal);

  return {
    tdee,
    targetCalories: macros.calories,
    macros: {
      protein: { grams: macros.protein, calories: macros.protein * 4, percentage: 30 },
      carbohydrates: { grams: macros.carbs, calories: macros.carbs * 4, percentage: 45 },
      fat: { grams: macros.fat, calories: macros.fat * 9, percentage: 25 },
    },
    bmiCategory,
    goalAdjustment: profile.fitnessGoal === 'weight_loss'
      ? 'Calorie deficit of 500 kcal/day for ~0.5kg/week loss'
      : profile.fitnessGoal === 'muscle_gain'
      ? 'Calorie surplus of 300 kcal/day for lean muscle gain'
      : 'Maintenance calories for general fitness',
    hydration: Math.round(profile.weight * 35) + ' ml/day',
    mealPlan: mealPlans,
    tips: getDietTips(profile.fitnessGoal),
    supplements: getSupplementRecommendations(profile.fitnessGoal),
  };
};

const generateMealTemplates = (macros, goal) => {
  const proteinPerMeal = Math.round(macros.protein / 4);
  const carbsPerMeal = Math.round(macros.carbs / 4);

  return [
    {
      meal: 'Breakfast',
      time: '7:00 AM',
      calories: Math.round(macros.calories * 0.25),
      examples: goal === 'muscle_gain'
        ? ['Oatmeal with whey protein', 'Eggs (4 whole)', 'Greek yogurt with banana']
        : ['Poha with vegetables', 'Idli with sambar', 'Smoothie bowl'],
      macros: { protein: proteinPerMeal, carbs: carbsPerMeal, fat: Math.round(macros.fat / 4) },
    },
    {
      meal: 'Pre-Workout Snack',
      time: '10:30 AM',
      calories: Math.round(macros.calories * 0.10),
      examples: ['Banana with peanut butter', 'Rice cakes', 'Dates and nuts'],
      macros: { protein: Math.round(proteinPerMeal * 0.5), carbs: Math.round(carbsPerMeal * 1.2), fat: 5 },
    },
    {
      meal: 'Lunch',
      time: '1:00 PM',
      calories: Math.round(macros.calories * 0.30),
      examples: goal === 'muscle_gain'
        ? ['Chicken/Paneer rice bowl', 'Dal with rice and veggies', 'Grilled fish with quinoa']
        : ['Dal khichdi', 'Grilled chicken salad', 'Tofu stir fry with brown rice'],
      macros: { protein: Math.round(proteinPerMeal * 1.2), carbs: Math.round(carbsPerMeal * 1.2), fat: Math.round(macros.fat / 4) },
    },
    {
      meal: 'Dinner',
      time: '7:30 PM',
      calories: Math.round(macros.calories * 0.25),
      examples: ['Grilled protein with salad', 'Vegetable curry with roti', 'Egg bhurji with multigrain bread'],
      macros: { protein: proteinPerMeal, carbs: Math.round(carbsPerMeal * 0.6), fat: Math.round(macros.fat / 4) },
    },
  ];
};

const getDietTips = (goal) => {
  const tips = {
    weight_loss: [
      'Eat slowly and mindfully — it takes 20 mins to feel full',
      'Prioritize protein to preserve muscle while losing fat',
      'Avoid liquid calories (sodas, juices)',
      'Fill half your plate with vegetables',
    ],
    muscle_gain: [
      'Eat protein within 30 minutes post-workout',
      'Don\'t skip carbs — they fuel your workouts',
      'Track your calories to ensure you\'re in a surplus',
      'Sleep 7-9 hours for optimal muscle recovery',
    ],
    general_fitness: [
      'Eat whole, minimally processed foods',
      'Stay hydrated throughout the day',
      'Include a variety of colorful vegetables',
      'Plan and prep meals to avoid unhealthy choices',
    ],
  };
  return tips[goal] || tips.general_fitness;
};

const getSupplementRecommendations = (goal) => {
  const base = ['Vitamin D3', 'Omega-3 (Fish Oil)', 'Multivitamin'];
  const goalSpecific = {
    muscle_gain: ['Whey Protein', 'Creatine Monohydrate', 'BCAA'],
    weight_loss: ['Green Tea Extract', 'L-Carnitine'],
    endurance: ['Beta-Alanine', 'Electrolytes', 'Iron'],
  };
  return [...base, ...(goalSpecific[goal] || [])];
};

/**
 * Smart Progress Prediction
 */
const predictProgress = async (user, progressHistory) => {
  if (progressHistory.length < 3) {
    return { error: 'Need at least 3 measurement entries to predict trends.' };
  }

  const weights = progressHistory
    .filter((p) => p.bodyMeasurement?.weight)
    .map((p) => ({ date: new Date(p.date), weight: p.bodyMeasurement.weight }))
    .sort((a, b) => a.date - b.date);

  if (weights.length < 2) return { error: 'Not enough weight measurements for prediction.' };

  // Simple linear regression
  const n = weights.length;
  const xValues = weights.map((_, i) => i);
  const yValues = weights.map((w) => w.weight);
  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  const slope = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0) /
    xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

  const intercept = yMean - slope * xMean;

  // Predict next 4 weeks
  const predictions = [];
  for (let i = 1; i <= 4; i++) {
    const predictedWeight = parseFloat((intercept + slope * (n + i * 7 / (weights.length > 1 ? (weights[weights.length - 1].date - weights[0].date) / (n - 1) / 86400000 : 1))).toFixed(1));
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i * 7);
    predictions.push({ week: i, date: futureDate.toISOString().split('T')[0], predictedWeight });
  }

  const trend = slope > 0.05 ? 'gaining' : slope < -0.05 ? 'losing' : 'maintaining';
  const weeklyChange = Math.abs(slope).toFixed(2);

  return {
    trend,
    weeklyChange: `${trend === 'losing' ? '-' : '+'}${weeklyChange} kg/week`,
    currentWeight: weights[weights.length - 1].weight,
    predictions,
    insight: trend === 'losing'
      ? `At this rate, you'll reach your goal in approximately ${Math.ceil((weights[weights.length - 1].weight - (user.profile?.targetWeight || weights[weights.length - 1].weight - 5)) / Math.abs(slope))} weeks.`
      : trend === 'gaining'
      ? 'Great progress on muscle building! Ensure you\'re hitting protein targets.'
      : 'Your weight is stable. Adjust calories to meet your goal.',
  };
};

module.exports = { recommendWorkout, generateDietPlan, predictProgress };
