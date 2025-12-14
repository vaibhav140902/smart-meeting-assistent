const express = require('express');
const router = express.Router();
const {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  saveTranscript,
  startMeeting,
  endMeeting,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Meeting CRUD
router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/:id', getMeeting);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

// Meeting actions
router.post('/:id/start', startMeeting);
router.post('/:id/end', endMeeting);
router.post('/:id/transcript', saveTranscript);

module.exports = router;