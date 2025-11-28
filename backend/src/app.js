/**
 * ================================================
 * EXPRESS APP CONFIGURATION
 * ================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const passport = require('./config/passport');
const session = require('express-session');
const { globalErrorHandler } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet - Set security headers
app.use(helmet());

// CORS - Cross Origin Resource Sharing
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Sanitize data - prevent NoSQL injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Session middleware (for Passport)
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ============================================================
// REQUEST LOGGING
// ============================================================

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));

// Google OAuth Routes
app.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { session: false }),
  require('./controllers/authController').googleCallback
);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(globalErrorHandler);

module.exports = app;