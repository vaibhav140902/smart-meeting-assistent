// ============================================================
// FILE: backend/src/middleware/auth.js
// PURPOSE: Handle JWT authentication and authorization
// ============================================================

// Import jsonwebtoken - creates and verifies JWT tokens
const jwt = require('jsonwebtoken');

// Import logger for logging authentication events
const logger = require('./logger');

// Import custom error class
const { AppError } = require('../utils/errors');

// ============================================================
// MIDDLEWARE 1: VERIFY TOKEN
// ============================================================

// This middleware checks if the user has a valid JWT token
// Used to protect routes that require authentication
const verifyToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    // Format: "Bearer <token>"
    // Split by space and take second part [1]
    const token = req.headers.authorization?.split(' ')[1];

    // If no token provided, send error
    // Token is required to access protected routes
    if (!token) {
      return next(new AppError('No token provided', 401));
    }

    // Verify token using JWT_SECRET from environment
    // If token is valid, decode it and get payload
    // If invalid, this throws an error (caught in catch block)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Store decoded token data in req.user
    // This makes user info available in route handlers
    // Contains: id, email, role (from when token was created)
    req.user = decoded;
    
    // Call next() to continue to the route handler
    next();
    
  } catch (error) {
    // Handle specific JWT errors
    
    // If token expired (more than 7 days old)
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    
    // If token malformed (corrupted or invalid)
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    
    // Any other authentication error
    next(new AppError('Authentication failed', 401));
  }
};

// ============================================================
// MIDDLEWARE 2: CHECK AUTHORIZATION (ROLE-BASED)
// ============================================================

// This middleware checks if user has required role
// Example: Only admins can delete users
// Takes roles as parameters: authorize('admin', 'manager')
const authorize = (...roles) => {
  // Return middleware function
  return (req, res, next) => {
    // Check if req.user exists (set by verifyToken)
    // If not, user is not authenticated
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    // If specific roles are required
    // Check if user's role is in the allowed roles list
    if (roles.length && !roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      // Helps track security issues
      logger.warn(`Unauthorized access attempt by user ${req.user.id}`);
      
      // Return 403 Forbidden error
      // 403 = user authenticated but not authorized
      return next(new AppError('Insufficient permissions', 403));
    }

    // If everything is OK, continue to route handler
    next();
  };
};

// ============================================================
// MIDDLEWARE 3: CHECK TEAM MEMBERSHIP
// ============================================================

// This middleware verifies user belongs to specific team
// Used in team-related routes
// Example: /api/teams/team-123 - verify user is member
const checkTeamMembership = async (req, res, next) => {
  try {
    // Extract teamId from URL parameters
    // Example: /api/teams/:teamId
    const { teamId } = req.params;
    
    // Get userId from authenticated user
    // Set by verifyToken middleware
    const userId = req.user.id;

    // TODO: Query database to verify membership
    // Check if user is member of this team
    // If not a member, return 403 error
    // (Implementation in next version)
    
    // If user is member, continue
    next();
  } catch (error) {
    // If any error occurs during verification
    next(new AppError('Team verification failed', 500));
  }
};

// ============================================================
// MIDDLEWARE 4: CHECK MEETING OWNERSHIP
// ============================================================

// This middleware verifies user owns or participates in meeting
// Prevents users from accessing other user's meetings
// Example: /api/meetings/meeting-123 - verify access
const checkMeetingOwnership = async (req, res, next) => {
  try {
    // Extract meetingId from URL parameters
    const { meetingId } = req.params;
    
    // Get userId from authenticated user
    const userId = req.user.id;

    // TODO: Query database
    // Check if user created this meeting OR is participant
    // If not, return 403 error
    // (Implementation in next version)
    
    // If user has access, continue
    next();
  } catch (error) {
    // If any error occurs during verification
    next(new AppError('Meeting verification failed', 500));
  }
};

// ============================================================
// EXPORT ALL MIDDLEWARE FUNCTIONS
// ============================================================

module.exports = {
  verifyToken,              // Check JWT is valid
  authorize,                // Check user has required role
  checkTeamMembership,      // Check user is in team
  checkMeetingOwnership,    // Check user can access meeting
};

// ============================================================
// HOW TO USE IN ROUTES:
// ============================================================

/*
const { verifyToken, authorize, checkMeetingOwnership } = require('../middleware/auth');

// Example 1: Public route (no auth needed)
app.get('/api/public', (req, res) => {
  res.json({ message: 'Anyone can access' });
});

// Example 2: Protected route (auth required)
app.get('/api/profile', verifyToken, (req, res) => {
  res.json({ user: req.user }); // Only authenticated users
});

// Example 3: Admin-only route
app.delete('/api/users/:id', verifyToken, authorize('admin'), (req, res) => {
  // Only admin users can delete
  res.json({ message: 'User deleted' });
});

// Example 4: Manager or Admin route
app.post('/api/reports', verifyToken, authorize('manager', 'admin'), (req, res) => {
  // Only managers or admins can create reports
});

// Example 5: Meeting with ownership check
app.get(
  '/api/meetings/:meetingId',
  verifyToken,
  checkMeetingOwnership,
  (req, res) => {
    // User must be authenticated AND have meeting access
  }
);
*/