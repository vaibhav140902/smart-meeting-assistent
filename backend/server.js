const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env') // Adjust if .env is not in the parent folder
});
const app = require('./src/app');
const { sequelize } = require('./src/config/database');
const { connectRedis, getRedisClient } = require('./src/config/redis');
const logger = require('./src/middleware/logger');
const { createServer } = require('http');
const { initializeSocketIO } = require('./src/services/socketService');
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = createServer(app);
initializeSocketIO(server);

async function startServer() {
  try {
    // 1️⃣ CONNECT REDIS FIRST
    await connectRedis();
    const redisClient = getRedisClient();
    await redisClient.ping();
    logger.info("✅ Redis connected successfully");

    // 2️⃣ CONNECT DATABASES
    await sequelize.authenticate();
    logger.info('✅ Database connected');

    if (NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Database models synchronized');
    }

    // 3️⃣ START SERVER
    server.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT}`);
    });

  } catch (error) {
    logger.error("❌ ERROR STARTING SERVER:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

startServer();

module.exports = server;