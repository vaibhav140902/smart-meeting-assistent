require('dotenv').config();
require('express-async-errors');

const app = require('./src/app');
const { connectPostgreSQL, connectMongoDB, syncDatabase } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const logger = require('./src/middleware/logger');

const PORT = process.env.PORT || 5000;
let server;

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    logger.info('Connecting to databases...');
    await connectPostgreSQL();
    await connectMongoDB();
    await connectRedis();

    // Sync database
    logger.info('Syncing database models...');
    await syncDatabase();

    // Start server
    server = app.listen(PORT, () => {
      logger.info(`Server started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');

  if (server) {
    server.close(async () => {
      logger.info('Server closed');
      process.exit(0);
    });
  }

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();