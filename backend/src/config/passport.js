// /src/config/passport.js
const passport = require('passport'); 
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const logger = require('../middleware/logger');

// Logging now uses the variables correctly to diagnose
console.log('=== Environment Variables ===');
console.log('clientID:', process.env.GOOGLE_CLIENT_ID ? 'Found' : 'Missing'); 
console.log('clientSecret:', process.env.GOOGLE_CLIENT_SECRET ? 'Found' : 'Missing');
console.log('=============================');

// ... serialize/deserialize functions ...
passport.serializeUser((user, done) => {
  done(null, user.id);
});
// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      // 🌟 THIS IS THE CRITICAL PART: MUST MATCH YOUR .env FILE NAMES
      clientID: process.env.GOOGLE_CLIENT_ID, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      // ...
    }
  )
);

module.exports = passport;