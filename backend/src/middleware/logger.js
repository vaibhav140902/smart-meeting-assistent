// ============================================================
// FILE: backend/src/middleware/logger.js
// PURPOSE: Configure Winston logging for the entire application
// ============================================================

// Import winston - a professional logging library for Node.js
const winston = require('winston');

// Import path module - helps work with file paths
const path = require('path');

// Import fs module - file system operations
const fs = require('fs');

// ============================================================
// STEP 1: CREATE LOGS DIRECTORY
// ============================================================

// Define the logs directory path
// path.join(__dirname, '../../logs') - Goes up 2 folders from middleware
// to backend/logs directory
const logsDir = path.join(__dirname, '../../logs');

// Check if logs directory exists, if not create it
// { recursive: true } allows creating parent directories if needed
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ============================================================
// STEP 2: DEFINE LOG LEVELS
// ============================================================

// Log levels define severity of messages (0 = most severe, 4 = least)
// This determines which logs get displayed/saved
const levels = {
  error: 0,    // Most important - application errors
  warn: 1,     // Warnings - something might be wrong
  info: 2,     // Information - general app info
  http: 3,     // HTTP requests info
  debug: 4,    // Debugging - detailed info for developers
};

// ============================================================
// STEP 3: DEFINE COLORS FOR CONSOLE OUTPUT
// ============================================================

// Colors make console output easier to read
// error = red (catches attention), info = green (good), etc.
const colors = {
  error: 'red',      // Red for errors
  warn: 'yellow',    // Yellow for warnings
  info: 'green',     // Green for info
  http: 'magenta',   // Magenta for HTTP requests
  debug: 'white',    // White for debug
};

// Apply these colors to winston
winston.addColors(colors);

// ============================================================
// STEP 4: DEFINE LOG FORMAT
// ============================================================

// This controls HOW logs are formatted and displayed
const format = winston.format.combine(
  // Add timestamp to each log entry
  // Format: YYYY-MM-DD HH:mm:ss:ms (e.g., 2024-11-27 10:30:45:123)
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  
  // Custom printf format - controls what gets displayed
  // ${info.timestamp} - the time the log was created
  // ${info.level} - the log level (error, warn, info, etc)
  // ${info.message} - the actual message
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// ============================================================
// STEP 5: DEFINE TRANSPORTS (WHERE LOGS GO)
// ============================================================

// Transports define WHERE logs are saved/displayed
const transports = [
  // TRANSPORT 1: Console transport - logs displayed in terminal
  new winston.transports.Console(),

  // TRANSPORT 2: Error file - saves ONLY error logs
  // This file contains only errors for easy troubleshooting
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),  // File path for error logs
    level: 'error',                              // Only log errors
    maxsize: 5242880,                            // Max file size: 5MB
    maxFiles: 5,                                 // Keep max 5 files (rotate)
  }),

  // TRANSPORT 3: All logs file - saves ALL log levels
  // This file has everything for complete record
  new winston.transports.File({
    filename: path.join(logsDir, 'all.log'),    // File path for all logs
    maxsize: 5242880,                            // Max file size: 5MB
    maxFiles: 5,                                 // Keep max 5 files (rotate)
  }),
];

// ============================================================
// STEP 6: CREATE MAIN LOGGER
// ============================================================

// Create the main logger instance with all settings
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',  // Minimum level to log (default: debug)
  levels,                                     // Use our defined log levels
  format,                                     // Use our defined format
  transports,                                 // Use our defined transports
});

// ============================================================
// STEP 7: CREATE HTTP LOGGER (OPTIONAL)
// ============================================================

// Separate logger for HTTP requests
// Useful for tracking all API requests separately
const httpLogger = winston.createLogger({
  level: 'http',                    // Only log HTTP level messages
  format: winston.format.combine(
    // Add timestamp
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    // Custom format for HTTP logs
    winston.format.printf((info) => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
    })
  ),
  transports: [
    // Show HTTP logs in console
    new winston.transports.Console(),
    // Save HTTP logs to separate file
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),  // File for HTTP logs
      maxsize: 5242880,                           // 5MB max
      maxFiles: 5,                                // Keep 5 files
    }),
  ],
});

// ============================================================
// STEP 8: EXPORT LOGGERS
// ============================================================

// Export main logger as default
module.exports = logger;

// Also export HTTP logger as a property
module.exports.httpLogger = httpLogger;

// ============================================================
// HOW TO USE THIS LOGGER IN OTHER FILES:
// ============================================================

/*
const logger = require('../middleware/logger');

// Log different levels:
logger.error('This is an error');      // Red - for errors
logger.warn('This is a warning');      // Yellow - for warnings
logger.info('Application started');    // Green - for info
logger.debug('Debug information');     // White - for debugging

// Logs will automatically:
// 1. Show in console (color-coded)
// 2. Save to backend/logs/all.log (all logs)
// 3. Save to backend/logs/error.log (only errors)
// 4. Rotate files when they reach 5MB
*/