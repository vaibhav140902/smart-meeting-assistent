const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
const logger = require('../middleware/logger');

// PostgreSQL Connection
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'smart_meeting_assistant',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_meeting_assistant';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    logger.info('MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    setTimeout(() => connectMongoDB(), 5000);
  }
};

// PostgreSQL Connection Check
const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connected successfully');
    return sequelize;
  } catch (error) {
    logger.error('PostgreSQL connection error:', error);
    setTimeout(() => connectPostgreSQL(), 5000);
  }
};

// Sync Database Models (for development)
const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    } else {
      await sequelize.sync({ force: false });
    }
  } catch (error) {
    logger.error('Database sync error:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  mongoose,
  connectMongoDB,
  connectPostgreSQL,
  syncDatabase,
};