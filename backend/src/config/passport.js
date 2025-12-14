// /src/config/passport.js

require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../middleware/logger');

// Debug: Check environment variables
console.log('=== Environment Variables ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Found' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Found' : 'Missing');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
console.log('=============================');

// ============================================================
// SERIALIZE / DESERIALIZE USER (for session-based OAuth flow)
// ============================================================

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    logger.error('Deserialize user error:', error);
    done(error, null);
  }
});

// ============================================================
// GOOGLE OAUTH STRATEGY
// ============================================================

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          logger.info(`Google OAuth attempt for: ${email}`);

          // Check if user exists with this Google ID
          let user = await User.findByGoogleId(profile.id);

          if (user) {
            // User exists, update last login and tokens
            user.lastLogin = new Date();
            user.googleTokens = { accessToken, refreshToken };
            await user.save();
            logger.info(`Existing Google user logged in: ${email}`);
            return done(null, user);
          }

          // Check if user exists with this email (from local registration)
          user = await User.findByEmail(email);

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.googleTokens = { accessToken, refreshToken };
            user.profileImage = user.profileImage || profile.photos[0]?.value;
            user.isEmailVerified = true;
            user.lastLogin = new Date();
            await user.save();
            logger.info(`Google account linked to existing user: ${email}`);
            return done(null, user);
          }

          // Create new user from Google profile
          const [firstName, ...lastNameParts] = profile.displayName.split(' ');
          const lastName = lastNameParts.join(' ') || firstName;

          user = await User.create({
            googleId: profile.id,
            email: email,
            firstName: firstName,
            lastName: lastName,
            profileImage: profile.photos[0]?.value,
            googleTokens: { accessToken, refreshToken },
            isEmailVerified: true,
            isActive: true,
            lastLogin: new Date(),
            password: Math.random().toString(36).slice(-12) + 'Aa1!', // Random secure password
          });

          logger.info(`New Google user created: ${email}`);
          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn('⚠️ Google OAuth not configured - missing CLIENT_ID or CLIENT_SECRET');
}

module.exports = passport;