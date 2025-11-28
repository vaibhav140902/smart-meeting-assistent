/**
 * ================================================
 * SOCKET SERVICE
 * ================================================
 * Handles WebSocket connections and real-time events
 */

const { Server } = require('socket.io');
const logger = require('../middleware/logger');

let io;

/**
 * Initialize Socket.IO
 */
const initializeSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Add more socket event handlers here as needed
  });

  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocketIO,
  getIO,
};