const redis = require('redis');
const logger = require('../middleware/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max retries exceeded');
            return new Error('Redis max retries exceeded');
          }
          return retries * 50;
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
    redisClient.on('connect', () => logger.info('Redis connected successfully'));
    redisClient.on('ready', () => logger.info('Redis client ready'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Redis connection error:', error);
    // Do not throw error here, allow application to continue without cache
    // return null; 
  }
};

const getRedisClient = () => {
  // If redisClient is null (due to connection failure), subsequent calls will handle it.
  return redisClient;
};

// Cache utilities
const setCache = async (key, value, ttl = 3600) => {
  try {
    const client = getRedisClient();
    if (!client) return logger.warn('Attempted to set cache, but Redis client is unavailable.');

    // Note: client.setEx is the correct way to set a value with an expiration in modern 'redis' package.
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Redis set cache error:', error);
  }
};

const getCache = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) return null;

    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis get cache error:', error);
    return null;
  }
};

const deleteCache = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) return;
    
    await client.del(key);
  } catch (error) {
    logger.error('Redis delete cache error:', error);
  }
};

const flushCache = async (pattern) => {
  try {
    const client = getRedisClient();
    if (!client) return;

    // In production, avoid running KEYS on a large dataset as it blocks the server.
    // Use SCAN in a real-world application. For development, KEYS is usually fine.
    const keys = await client.keys(pattern); 
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    logger.error('Redis flush cache error:', error);
  }
};

// 💡 FIX: Export the utility functions wrapped under a 'cache' object 
// to match the destructuring import const { cache } = require('./redis'); in authController.js
module.exports = {
  connectRedis,
  getRedisClient,
  cache: {
    set: setCache,
    get: getCache,
    del: deleteCache,
    flush: flushCache,
  },
};