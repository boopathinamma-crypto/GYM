// Load environment variables (IMPORTANT FIX)
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initializeSocket } = require('./sockets/socket');
const { initializeCronJobs } = require('./jobs/cron.jobs');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 🔍 DEBUG (you can remove later)
    console.log("MONGO_URI:", process.env.MONGO_URI);

    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    connectRedis();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    const io = initializeSocket(server);
    app.set('io', io);

    // Initialize Cron Jobs
    initializeCronJobs(io);

    // Start server
    server.listen(PORT, () => {
      logger.info(`
╔════════════════════════════════════════╗
║     GymPro Server Running              ║
║     Port: ${PORT}                          ║
║     Mode: ${process.env.NODE_ENV || 'development'}                 ║
╚════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error(`Unhandled Rejection: ${reason}`);
    });

  } catch (error) {
    logger.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();