/**
 * ================================================
 * USER ROUTES (Placeholder)
 * ================================================
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder - will implement later
router.get('/', protect, (req, res) => {
  res.json({ success: true, message: 'User routes - Coming soon!' });
});

module.exports = router;