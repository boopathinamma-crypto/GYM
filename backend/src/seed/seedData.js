require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Exercise = require('../models/Exercise');
const Workout = require('../models/Workout');
const { MembershipPlan } = require('../models/Membership');
const { GymClass } = require('../models/Booking');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gym_management');
  console.log('✅ MongoDB connected for seeding');
};

const seedUsers = async () => {
  await User.deleteMany({});

  const users = [
    {
      name: 'Admin User',
      email: 'admin@gympro.com',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    },
    {
      name: 'Rajan Kumar',
      email: 'trainer1@gympro.com',
      password: 'Trainer@123',
      role: 'trainer',
      isEmailVerified: true,
      isActive: true,
      profile: { age: 28, gender: 'male', height: 175, weight: 75, fitnessGoal: 'muscle_gain', fitnessLevel: 'advanced', fitnessGoal: 'general_fitness' },
    },
    {
      name: 'Priya Sharma',
      email: 'trainer2@gympro.com',
      password: 'Trainer@123',
      role: 'trainer',
      isEmailVerified: true,
      isActive: true,
      profile: { age: 26, gender: 'female', height: 162, weight: 58, fitnessLevel: 'advanced', fitnessGoal: 'general_fitness' },
    },
    {
      name: 'Arjun Mehta',
      email: 'member1@gympro.com',
      password: 'Member@123',
      role: 'member',
      isEmailVerified: true,
      isActive: true,
      profile: { age: 25, gender: 'male', height: 178, weight: 80, fitnessGoal: 'muscle_gain', fitnessLevel: 'beginner', activityLevel: 'lightly_active' },
      leaderboardPoints: 450,
    },
    {
      name: 'Neha Singh',
      email: 'member2@gympro.com',
      password: 'Member@123',
      role: 'member',
      isEmailVerified: true,
      isActive: true,
      profile: { age: 23, gender: 'female', height: 160, weight: 65, fitnessGoal: 'weight_loss', fitnessLevel: 'intermediate', activityLevel: 'moderately_active' },
      leaderboardPoints: 780,
    },
  ];

  const created = await User.insertMany(users);
  console.log(`✅ ${created.length} users seeded`);
  return created;
};

const seedExercises = async () => {
  await Exercise.deleteMany({});

  const exercises = [
    {
      name: 'Barbell Bench Press',
      description: 'A compound chest exercise using a barbell on a flat bench.',
      muscleGroup: { primary: ['chest'], secondary: ['triceps', 'shoulders'] },
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
      category: 'strength',
      instructions: [
        { step: 1, text: 'Lie flat on a bench with your feet on the floor.' },
        { step: 2, text: 'Grip the barbell slightly wider than shoulder-width.' },
        { step: 3, text: 'Lower the bar slowly to your chest.' },
        { step: 4, text: 'Press back up to the starting position.' },
      ],
      tips: ['Keep your shoulder blades retracted', 'Don\'t bounce the bar off your chest'],
      mechanics: 'compound',
      forceType: 'push',
      isApproved: true,
      usageCount: 150,
    },
    {
      name: 'Pull-Up',
      description: 'Upper body compound movement targeting the back.',
      muscleGroup: { primary: ['back', 'lats'], secondary: ['biceps'] },
      equipment: ['pull_up_bar'],
      difficulty: 'intermediate',
      category: 'strength',
      instructions: [
        { step: 1, text: 'Hang from a pull-up bar with palms facing away.' },
        { step: 2, text: 'Pull yourself up until your chin clears the bar.' },
        { step: 3, text: 'Lower yourself slowly to full extension.' },
      ],
      mechanics: 'compound',
      forceType: 'pull',
      isApproved: true,
      usageCount: 120,
    },
    {
      name: 'Barbell Squat',
      description: 'The king of lower body exercises.',
      muscleGroup: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves'] },
      equipment: ['barbell'],
      difficulty: 'intermediate',
      category: 'strength',
      instructions: [
        { step: 1, text: 'Position bar on upper back, feet shoulder-width apart.' },
        { step: 2, text: 'Descend by bending at hips and knees.' },
        { step: 3, text: 'Lower until thighs are parallel to ground.' },
        { step: 4, text: 'Drive through heels to return to starting position.' },
      ],
      mechanics: 'compound',
      forceType: 'push',
      isApproved: true,
      usageCount: 200,
    },
    {
      name: 'Treadmill Running',
      description: 'Cardio exercise on a treadmill.',
      muscleGroup: { primary: ['quads', 'calves'], secondary: ['glutes', 'hamstrings'] },
      equipment: ['machine'],
      difficulty: 'beginner',
      category: 'cardio',
      instructions: [
        { step: 1, text: 'Start at a walking pace for 2 minutes warm-up.' },
        { step: 2, text: 'Increase speed to a comfortable jogging pace.' },
        { step: 3, text: 'Maintain form: upright posture, light foot strike.' },
      ],
      mechanics: 'compound',
      forceType: 'dynamic',
      isApproved: true,
      usageCount: 300,
    },
    {
      name: 'Plank',
      description: 'Core stability exercise.',
      muscleGroup: { primary: ['abs', 'obliques'], secondary: ['shoulders', 'back'] },
      equipment: ['none'],
      difficulty: 'beginner',
      category: 'strength',
      instructions: [
        { step: 1, text: 'Start in a push-up position on forearms.' },
        { step: 2, text: 'Keep body straight from head to heels.' },
        { step: 3, text: 'Hold position without letting hips sag.' },
      ],
      mechanics: 'compound',
      forceType: 'static',
      isApproved: true,
      usageCount: 250,
    },
    {
      name: 'Dumbbell Curl',
      description: 'Isolation exercise for biceps.',
      muscleGroup: { primary: ['biceps'], secondary: ['forearms'] },
      equipment: ['dumbbell'],
      difficulty: 'beginner',
      category: 'strength',
      instructions: [
        { step: 1, text: 'Stand with dumbbells at sides, palms forward.' },
        { step: 2, text: 'Curl weights up to shoulder level.' },
        { step: 3, text: 'Lower slowly to starting position.' },
      ],
      mechanics: 'isolation',
      forceType: 'pull',
      isApproved: true,
      usageCount: 180,
    },
    {
      name: 'Deadlift',
      description: 'The ultimate full-body strength exercise.',
      muscleGroup: { primary: ['back', 'hamstrings', 'glutes'], secondary: ['traps', 'forearms'] },
      equipment: ['barbell'],
      difficulty: 'advanced',
      category: 'strength',
      instructions: [
        { step: 1, text: 'Stand with feet hip-width apart, bar over mid-foot.' },
        { step: 2, text: 'Hinge at hips and grip bar just outside legs.' },
        { step: 3, text: 'Lift bar by driving hips forward, keeping back straight.' },
        { step: 4, text: 'Lower under control back to floor.' },
      ],
      mechanics: 'compound',
      forceType: 'pull',
      isApproved: true,
      usageCount: 160,
    },
    {
      name: 'Burpee',
      description: 'Full-body HIIT exercise.',
      muscleGroup: { primary: ['full_body'] },
      equipment: ['none'],
      difficulty: 'intermediate',
      category: 'plyometric',
      instructions: [
        { step: 1, text: 'Start standing, drop into a squat position.' },
        { step: 2, text: 'Jump feet back into plank position.' },
        { step: 3, text: 'Perform a push-up.' },
        { step: 4, text: 'Jump feet forward and explosively jump up.' },
      ],
      mechanics: 'compound',
      forceType: 'dynamic',
      isApproved: true,
      usageCount: 220,
    },
  ];

  const created = await Exercise.insertMany(exercises);
  console.log(`✅ ${created.length} exercises seeded`);
  return created;
};

const seedWorkouts = async (users, exercises) => {
  await Workout.deleteMany({});
  const trainer = users.find((u) => u.role === 'trainer');

  const workouts = [
    {
      title: 'Beginner Full Body Blast',
      description: 'Perfect starter workout targeting all major muscle groups.',
      category: 'strength',
      difficulty: 'beginner',
      targetMuscles: ['chest', 'back', 'legs', 'abs'],
      equipment: ['barbell', 'dumbbell', 'none'],
      estimatedDuration: 45,
      caloriesBurn: 300,
      createdBy: trainer._id,
      isPublic: true,
      isPremium: false,
      tags: ['beginner-friendly', 'full-body', 'no-cardio'],
      sections: [
        {
          type: 'warmup',
          exercises: [
            { exercise: exercises[3]._id, sets: 1, duration: 300, restInterval: 60, order: 1, notes: '5 min light jog' },
          ],
        },
        {
          type: 'main',
          exercises: [
            { exercise: exercises[2]._id, sets: 3, reps: 10, restInterval: 90, weight: 40, order: 1 },
            { exercise: exercises[1]._id, sets: 3, reps: 8, restInterval: 90, order: 2 },
            { exercise: exercises[5]._id, sets: 3, reps: 12, restInterval: 60, weight: 10, order: 3 },
            { exercise: exercises[4]._id, sets: 3, duration: 45, restInterval: 60, order: 4, notes: '45 second holds' },
          ],
        },
        {
          type: 'cooldown',
          exercises: [
            { exercise: exercises[4]._id, sets: 1, duration: 60, restInterval: 0, order: 1, notes: 'Stretch and breathe' },
          ],
        },
      ],
      completionCount: 45,
    },
    {
      title: 'Fat Burning HIIT Circuit',
      description: 'High-intensity interval training to maximize fat loss.',
      category: 'hiit',
      difficulty: 'intermediate',
      targetMuscles: ['full_body'],
      equipment: ['none'],
      estimatedDuration: 30,
      caloriesBurn: 400,
      createdBy: trainer._id,
      isPublic: true,
      isPremium: false,
      tags: ['fat-loss', 'no-equipment', 'hiit', 'cardio'],
      sections: [
        {
          type: 'warmup',
          exercises: [{ exercise: exercises[3]._id, sets: 1, duration: 180, restInterval: 0, order: 1 }],
        },
        {
          type: 'main',
          exercises: [
            { exercise: exercises[7]._id, sets: 4, reps: 10, restInterval: 20, order: 1 },
            { exercise: exercises[4]._id, sets: 4, duration: 30, restInterval: 10, order: 2 },
            { exercise: exercises[7]._id, sets: 4, reps: 8, restInterval: 20, order: 3 },
          ],
        },
        {
          type: 'cooldown',
          exercises: [{ exercise: exercises[4]._id, sets: 1, duration: 120, restInterval: 0, order: 1 }],
        },
      ],
      completionCount: 89,
    },
    {
      title: 'Advanced Powerlifting Program',
      description: 'Focus on the big three: squat, bench, deadlift.',
      category: 'strength',
      difficulty: 'advanced',
      targetMuscles: ['chest', 'back', 'legs'],
      equipment: ['barbell', 'bench'],
      estimatedDuration: 75,
      caloriesBurn: 450,
      createdBy: trainer._id,
      isPublic: true,
      isPremium: true,
      tags: ['powerlifting', 'strength', 'advanced'],
      sections: [
        {
          type: 'warmup',
          exercises: [{ exercise: exercises[2]._id, sets: 2, reps: 10, weight: 20, restInterval: 60, order: 1, notes: 'Warm-up sets' }],
        },
        {
          type: 'main',
          exercises: [
            { exercise: exercises[2]._id, sets: 5, reps: 5, restInterval: 180, weight: 80, order: 1 },
            { exercise: exercises[0]._id, sets: 5, reps: 5, restInterval: 180, weight: 60, order: 2 },
            { exercise: exercises[6]._id, sets: 5, reps: 5, restInterval: 180, weight: 100, order: 3 },
          ],
        },
        {
          type: 'cooldown',
          exercises: [{ exercise: exercises[4]._id, sets: 2, duration: 60, restInterval: 30, order: 1 }],
        },
      ],
      completionCount: 32,
      progressiveOverload: { enabled: true, incrementPercentage: 5, incrementFrequency: 'weekly' },
    },
  ];

  const created = await Workout.insertMany(workouts);
  console.log(`✅ ${created.length} workouts seeded`);
  return created;
};

const seedMembershipPlans = async () => {
  await MembershipPlan.deleteMany({});

  const plans = [
    {
      name: 'Basic Monthly',
      type: 'monthly',
      price: 999,
      currency: 'INR',
      duration: 30,
      features: ['Access to all basic workouts', 'Exercise library', 'Progress tracking', 'Community forum'],
      maxBookingsPerMonth: 8,
      trainerAccess: false,
      premiumContent: false,
    },
    {
      name: 'Pro Quarterly',
      type: 'quarterly',
      price: 2499,
      currency: 'INR',
      duration: 90,
      features: ['All Basic features', 'Premium workouts', 'AI recommendations', 'Nutrition planning', '2 trainer sessions/month'],
      maxBookingsPerMonth: 20,
      trainerAccess: true,
      premiumContent: true,
    },
    {
      name: 'Elite Annual',
      type: 'yearly',
      price: 7999,
      currency: 'INR',
      duration: 365,
      features: ['All Pro features', 'Unlimited trainer sessions', 'Custom meal plans', '1-on-1 coaching', 'Priority support', 'Progress PDF reports'],
      maxBookingsPerMonth: -1,
      trainerAccess: true,
      premiumContent: true,
    },
  ];

  const created = await MembershipPlan.insertMany(plans);
  console.log(`✅ ${created.length} membership plans seeded`);
  return created;
};

const seedClasses = async (users) => {
  await GymClass.deleteMany({});
  const trainer = users.find((u) => u.role === 'trainer');

  const now = new Date();
  const classes = Array.from({ length: 7 }, (_, i) => {
    const classDate = new Date(now);
    classDate.setDate(now.getDate() + i + 1);
    classDate.setHours(7 + (i % 3) * 3, 0, 0, 0);
    const endDate = new Date(classDate);
    endDate.setHours(endDate.getHours() + 1);

    return {
      title: ['Yoga Flow', 'Morning HIIT', 'Strength Circuit', 'Cardio Blast', 'Pilates Core', 'Boxing Basics', 'Spin Class'][i],
      type: ['yoga', 'hiit', 'strength', 'cardio', 'hiit', 'cardio', 'cardio'][i],
      trainer: trainer._id,
      description: 'Join us for an energizing group session!',
      startTime: classDate,
      endTime: endDate,
      capacity: 15,
      enrolledCount: Math.floor(Math.random() * 10),
      difficulty: ['beginner', 'intermediate', 'intermediate', 'beginner', 'intermediate', 'beginner', 'intermediate'][i],
    };
  });

  const created = await GymClass.insertMany(classes);
  console.log(`✅ ${created.length} gym classes seeded`);
};

const runSeed = async () => {
  try {
    await connectDB();
    const users = await seedUsers();
    const exercises = await seedExercises();
    await seedWorkouts(users, exercises);
    await seedMembershipPlans();
    await seedClasses(users);

    console.log('\n🌱 Seed completed successfully!\n');
    console.log('📋 Login credentials:');
    console.log('   Admin:   admin@gympro.com / Admin@123');
    console.log('   Trainer: trainer1@gympro.com / Trainer@123');
    console.log('   Member:  member1@gympro.com / Member@123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

runSeed();
