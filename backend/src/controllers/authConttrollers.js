// ============================================================
// FILE: backend/src/controllers/authController.js
// PURPOSE: Handle HTTP requests for authentication
// ============================================================

// Import auth service (contains business logic)
const authService = require('../services/authService');

// Import asyncHandler to catch errors automatically
const { asyncHandler } = require('../middleware/errorHandler');

// Import helpers for formatting responses
const { formatSuccessResponse } = require('../utils/helpers');

// Import logger
const logger = require('../middleware/logger');

// ============================================================
// CREATE AUTH CONTROLLER CLASS
// ============================================================

class AuthController {
  
  // ============================================================
  // ENDPOINT 1: POST /api/auth/register
  // PURPOSE: Create new user account
  // ============================================================

  register = asyncHandler(async (req, res) => {
    // asyncHandler automatically catches errors and passes to globalErrorHandler

    // Step 1: Call auth service to register
    // Service handles validation and database operations
    const result = await authService.register(req.body);

    // Step 2: Set refresh token as secure cookie
    // HttpOnly: can't access from JavaScript (security)
    // Secure: only sent over HTTPS (security)
    // SameSite: prevents CSRF attacks
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,                                    // Can't be accessed by JS
      secure: process.env.NODE_ENV === 'production',   // Only HTTPS in production
      sameSite: 'strict',                               // CSRF protection
      maxAge: 30 * 24 * 60 * 60 * 1000,                // 30 days in milliseconds
    });

    // Step 3: Send response to client
    // Status 201 = Created (resource created successfully)
    res.status(201).json(
      formatSuccessResponse(
        {
          user: result.user,                    // User data (no password)
          accessToken: result.tokens.accessToken, // JWT token (send in response)
        },
        'User registered successfully',  // Success message
        201                              // Status code
      )
    );
  });

  // ============================================================
  // ENDPOINT 2: POST /api/auth/login
  // PURPOSE: Authenticate user and return tokens
  // ============================================================

  login = asyncHandler(async (req, res) => {
    // Step 1: Extract email and password from request body
    const { email, password } = req.body;

    // Step 2: Call auth service to authenticate
    // Service verifies email exists and password is correct
    const result = await authService.login(email, password);

    // Step 3: Set refresh token as secure cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
    });

    // Step 4: Send response to client
    // Status 200 = OK (successful login)
    res.json(
      formatSuccessResponse(
        {
          user: result.user,
          accessToken: result.tokens.accessToken,  // Client stores in state/localStorage
        },
        'Login successful'  // Success message
      )
    );
  });

  // ============================================================
  // ENDPOINT 3: GET /api/auth/google/callback
  // PURPOSE: Handle Google OAuth redirect
  // ============================================================

  googleCallback = asyncHandler(async (req, res) => {
    // Step 1: Call auth service with Google profile
    // req.user is populated by Passport.js middleware
    const result = await authService.googleLogin(req.user);

    // Step 2: Set refresh token cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Step 3: Redirect to frontend with tokens
    // Frontend URL from environment variables
    const frontendUrl = process.env.FRONTEND_URL;
    
    // Build redirect URL with tokens as query parameters
    // Frontend will extract tokens and store them
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.tokens.accessToken}&refreshToken=${result.tokens.refreshToken}`;

    // Redirect browser to frontend
    res.redirect(redirectUrl);
  });

  // ============================================================
  // ENDPOINT 4: POST /api/auth/refresh-token
  // PURPOSE: Get new access token using refresh token
  // ============================================================

  refreshToken = asyncHandler(async (req, res) => {
    // Step 1: Get refresh token from cookie OR body
    // Try cookie first (more secure), fall back to body (for mobile)
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    // Step 2: If no token provided
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found',
      });
    }

    // Step 3: Call auth service to generate new token
    const tokens = await authService.refreshToken(refreshToken);

    // Step 4: Update refresh token in cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Step 5: Send new access token to client
    res.json(
      formatSuccessResponse(
        {
          accessToken: tokens.accessToken,  // New access token
        },
        'Token refreshed successfully'
      )
    );
  });

  // ============================================================
  // ENDPOINT 5: POST /api/auth/logout
  // PURPOSE: Logout user and blacklist token
  // ============================================================

  logout = asyncHandler(async (req, res) => {
    // Step 1: Extract token from Authorization header
    // Format: "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];

    // Step 2: Call auth service to logout
    // Adds token to blacklist in Redis
    await authService.logout(req.user.id, token);

    // Step 3: Clear refresh token cookie
    // Removes token from browser storage
    res.clearCookie('refreshToken');

    // Step 4: Send success response
    res.json(
      formatSuccessResponse(null, 'Logout successful')  // No data to return
    );
  });

  // ============================================================
  // ENDPOINT 6: POST /api/auth/update-password
  // PURPOSE: Change user password
  // ============================================================

  updatePassword = asyncHandler(async (req, res) => {
    // Step 1: Extract passwords from request body
    const { oldPassword, newPassword } = req.body;

    // Step 2: Call auth service to update password
    // Service verifies old password before allowing change
    await authService.updatePassword(req.user.id, oldPassword, newPassword);

    // Step 3: Send success response
    res.json(
      formatSuccessResponse(null, 'Password updated successfully')
    );
  });

  // ============================================================
  // ENDPOINT 7: GET /api/auth/verify
  // PURPOSE: Check if JWT token is still valid
  // ============================================================

  verifyToken = asyncHandler(async (req, res) => {
    // This endpoint is behind verifyToken middleware
    // If we reach here, token is valid

    // Step 1: Send response confirming token is valid
    res.json(
      formatSuccessResponse(
        {
          user: req.user,      // User data from token
          isValid: true,       // Token is valid
        },
        'Token is valid'
      )
    );
  });

  // ============================================================
  // ENDPOINT 8: GET /api/auth/me
  // PURPOSE: Get current authenticated user data
  // ============================================================

  getCurrentUser = asyncHandler(async (req, res) => {
    // Step 1: Import User model
    const User = require('../models/User');

    // Step 2: Find user by ID from token
    // req.user.id comes from verifyToken middleware
    const user = await User.findByPk(req.user.id);

    // Step 3: If user not found
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Step 4: Send user data
    res.json(
      formatSuccessResponse(
        user,  // Full user object
        'User retrieved successfully'
      )
    );
  });
}

// ============================================================
// EXPORT AS SINGLETON
// ============================================================

// Create single instance and export
module.exports = new AuthController();

// ============================================================
// ENDPOINT SUMMARY:
// ============================================================

/*
POST   /api/auth/register          - Create account
POST   /api/auth/login             - Login
GET    /api/auth/google/callback   - Google OAuth
POST   /api/auth/refresh-token     - Get new token
POST   /api/auth/logout            - Logout
POST   /api/auth/update-password   - Change password
GET    /api/auth/verify            - Check token valid
GET    /api/auth/me                - Get user profile

// ============================================================
// REQUEST/RESPONSE EXAMPLES:
// ============================================================

// 1. REGISTER
Request:
POST /api/auth/register
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}

// 2. LOGIN
Request:
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}

// 3. GET CURRENT USER
Request:
GET /api/auth/me
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "message": "User retrieved successfully",
  "data": { ... user data ... }
}

// ============================================================
// MIDDLEWARE CHAIN:
// ============================================================

Register & Login:
  → Request → Rate Limiter → Validation → Controller → Service → Database

Protected Endpoints:
  → Request → verifyToken → authorize → Controller → Service
*/