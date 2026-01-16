const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  getMeetings,
  updateUserStatus,
  deleteUser,
  deleteMeeting,
  getUserDetails,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Stats
router.get('/stats', getStats);

// Users management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Meetings management
router.get('/meetings', getMeetings);
router.delete('/meetings/:id', deleteMeeting);

module.exports = router;