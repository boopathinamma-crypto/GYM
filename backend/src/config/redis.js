const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error(`Redis error: ${err}`));
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));

    return redisClient;
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);
    return null;
  }
};

const getRedisClient = () => redisClient;

const cacheSet = async (key, value, ttl = 3600) => {
  if (!redisClient) return null;
  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.error(`Cache set error: ${err}`);
  }
};

const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Cache get error: ${err}`);
    return null;
  }
};

const cacheDel = async (key) => {
  if (!redisClient) return null;
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.error(`Cache del error: ${err}`);
  }
};

const cacheDelPattern = async (pattern) => {
  if (!redisClient) return null;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch (err) {
    logger.error(`Cache del pattern error: ${err}`);
  }
};

module.exports = { connectRedis, getRedisClient, cacheSet, cacheGet, cacheDel, cacheDelPattern };
