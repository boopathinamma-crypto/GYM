const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

const activeUsers = new Map(); // userId -> Set of socketIds

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth Middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('_id name role avatar isActive');
      if (!user || !user.isActive) return next(new Error('User not found or inactive'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection ───────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`Socket connected: ${socket.user.name} (${userId})`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join role room
    socket.join(`role:${socket.user.role}`);

    // Track active users
    if (!activeUsers.has(userId)) activeUsers.set(userId, new Set());
    activeUsers.get(userId).add(socket.id);

    // Broadcast online status to trainer/admin
    socket.to(`role:trainer`).emit('user:online', { userId, name: socket.user.name });
    socket.to(`role:admin`).emit('user:online', { userId, name: socket.user.name });

    // ─── Chat Events ────────────────────────────────────────────────────────
    socket.on('chat:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('chat:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        userId,
        name: socket.user.name,
        isTyping,
      });
    });

    // ─── Workout Events ──────────────────────────────────────────────────────
    socket.on('workout:start', ({ workoutId, workoutTitle }) => {
      logger.info(`${socket.user.name} started workout: ${workoutTitle}`);
      // Notify trainer if assigned
      socket.to(`role:trainer`).emit('member:workout:started', {
        memberId: userId,
        memberName: socket.user.name,
        workoutId,
        workoutTitle,
        startedAt: new Date(),
      });
    });

    socket.on('workout:complete', ({ workoutId, duration, calories }) => {
      socket.emit('achievement:check', { workoutId });
      io.to(`role:trainer`).emit('member:workout:completed', {
        memberId: userId,
        memberName: socket.user.name,
        workoutId,
        duration,
        calories,
        completedAt: new Date(),
      });
    });

    // ─── Notifications ───────────────────────────────────────────────────────
    socket.on('notification:read', async ({ notificationId }) => {
      try {
        await User.updateOne(
          { _id: userId, 'notifications._id': notificationId },
          { $set: { 'notifications.$.read': true } }
        );
      } catch (err) {
        logger.error(`Notification read error: ${err.message}`);
      }
    });

    // ─── Live Stats (Admin) ──────────────────────────────────────────────────
    if (socket.user.role === 'admin') {
      const statsInterval = setInterval(() => {
        socket.emit('stats:live', {
          activeUsers: activeUsers.size,
          timestamp: new Date(),
        });
      }, 30000); // every 30 seconds

      socket.on('disconnect', () => clearInterval(statsInterval));
    }

    // ─── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.user.name} — ${reason}`);

      const userSockets = activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUsers.delete(userId);
          socket.to(`role:trainer`).emit('user:offline', { userId });
          socket.to(`role:admin`).emit('user:offline', { userId });
        }
      }
    });

    // ─── Error Handling ──────────────────────────────────────────────────────
    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.user.name}: ${err.message}`);
    });
  });

  // ─── Broadcast helpers ───────────────────────────────────────────────────
  io.sendToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  io.broadcastToRole = (role, event, data) => {
    io.to(`role:${role}`).emit(event, data);
  };

  io.getActiveUserCount = () => activeUsers.size;

  logger.info('Socket.io initialized');
  return io;
};

module.exports = { initializeSocket };
