const cron = require('node-cron');
const { Membership } = require('../models/Membership');
const User = require('../models/User');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

const initializeCronJobs = (io) => {
  // ─── Check Expiring Memberships (Daily at 9 AM) ────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    logger.info('Cron: Checking expiring memberships...');
    try {
      const now = new Date();
      const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const in1day = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const expiring = await Membership.find({
        status: 'active',
        endDate: { $gte: now, $lte: in7days },
      }).populate('user', 'name email');

      for (const membership of expiring) {
        const daysLeft = Math.ceil((membership.endDate - now) / (1000 * 60 * 60 * 24));

        if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
          await notificationService.sendMembershipExpiring(membership.user, daysLeft).catch(() => {});

          // In-app notification
          await User.findByIdAndUpdate(membership.user._id, {
            $push: {
              notifications: {
                type: 'membership_expiry',
                message: `Your membership expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew now!`,
                read: false,
              },
            },
          });

          // Socket notification
          if (io) {
            io.sendToUser(membership.user._id.toString(), 'notification:membership', {
              type: 'expiring',
              daysLeft,
              message: `Your membership expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
            });
          }
        }
      }

      logger.info(`Cron: Processed ${expiring.length} expiring memberships`);
    } catch (err) {
      logger.error(`Cron membership check error: ${err.message}`);
    }
  });

  // ─── Mark Expired Memberships (Every Hour) ─────────────────────────────────
  cron.schedule('0 * * * *', async () => {
    try {
      const result = await Membership.updateMany(
        { status: 'active', endDate: { $lt: new Date() } },
        { $set: { status: 'expired' } }
      );
      if (result.modifiedCount > 0) {
        logger.info(`Cron: Marked ${result.modifiedCount} memberships as expired`);
      }
    } catch (err) {
      logger.error(`Cron expire memberships error: ${err.message}`);
    }
  });

  // ─── Workout Reminders (Daily at 7 AM) ───────────────────────────────────
  cron.schedule('0 7 * * *', async () => {
    logger.info('Cron: Sending workout reminders...');
    try {
      const Progress = require('../models/Progress');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Find users who haven't worked out in 2+ days (streak at risk)
      const activeUsers = await User.find({
        role: 'member',
        isActive: true,
        'streaks.current': { $gt: 0 },
        'streaks.lastWorkoutDate': { $lt: yesterday },
      }).select('name email streaks savedWorkouts').populate('savedWorkouts', 'title');

      for (const user of activeUsers.slice(0, 100)) { // Max 100 at a time
        const workout = user.savedWorkouts?.[0];
        if (workout) {
          await notificationService.sendWorkoutReminder(user, workout.title).catch(() => {});
        }

        await User.findByIdAndUpdate(user._id, {
          $push: {
            notifications: {
              type: 'workout_reminder',
              message: `Don't break your ${user.streaks.current}-day streak! Time to work out.`,
              read: false,
            },
          },
        });
      }
    } catch (err) {
      logger.error(`Cron workout reminder error: ${err.message}`);
    }
  });

  // ─── Weekly Leaderboard Update (Monday at midnight) ───────────────────────
  cron.schedule('0 0 * * 1', async () => {
    logger.info('Cron: Updating weekly leaderboard...');
    try {
      const Progress = require('../models/Progress');
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const topUsers = await Progress.aggregate([
        { $match: { type: 'workout_log', date: { $gte: lastWeek } } },
        { $group: { _id: '$user', workouts: { $sum: 1 } } },
        { $sort: { workouts: -1 } },
        { $limit: 3 },
      ]);

      for (let i = 0; i < topUsers.length; i++) {
        const bonusPoints = [500, 300, 200][i];
        await User.findByIdAndUpdate(topUsers[i]._id, {
          $inc: { leaderboardPoints: bonusPoints },
          $push: {
            notifications: {
              type: 'achievement',
              message: `🏆 You ranked #${i + 1} on last week's leaderboard! +${bonusPoints} bonus points.`,
              read: false,
            },
          },
        });
      }

      logger.info(`Cron: Leaderboard updated`);
    } catch (err) {
      logger.error(`Cron leaderboard error: ${err.message}`);
    }
  });

  // ─── Cleanup Old Notifications (Weekly) ──────────────────────────────────
  cron.schedule('0 0 * * 0', async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      await User.updateMany(
        {},
        { $pull: { notifications: { createdAt: { $lt: cutoff }, read: true } } }
      );
      logger.info('Cron: Old notifications cleaned up');
    } catch (err) {
      logger.error(`Cron cleanup error: ${err.message}`);
    }
  });

  logger.info('Cron jobs initialized');
};

module.exports = { initializeCronJobs };
