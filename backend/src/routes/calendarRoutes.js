const express = require('express');
const router = express.Router();
const {
  initiateAuth,
  handleCallback,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
} = require('../controllers/calendarController');
const { protect } = require('../middleware/auth');

// OAuth routes
router.get('/auth', protect, initiateAuth);
router.get('/oauth/callback', handleCallback);

// Calendar event management
router.post('/events', protect, createCalendarEvent);
router.put('/events/:meetingId', protect, updateCalendarEvent);
router.delete('/events/:meetingId', protect, deleteCalendarEvent);
router.get('/events', protect, listCalendarEvents);

module.exports = router;