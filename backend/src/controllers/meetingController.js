const asyncHandler = require('express-async-handler');
const Meeting = require('../models/Meeting');
const Transcript = require('../models/Transcript');
const User = require('../models/User');
const logger = require('../middleware/logger');

/**
 * @desc    Create new meeting
 * @route   POST /api/meetings
 * @access  Private
 */
const createMeeting = asyncHandler(async (req, res) => {
  const { title, description, scheduledAt, duration, participants, meetingLink } = req.body;

  if (!title || !scheduledAt) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title and scheduled time',
    });
  }

  const meeting = await Meeting.create({
    title,
    description,
    scheduledAt,
    duration: duration || 60,
    participants: participants || [],
    meetingLink,
    createdBy: req.user.id,
    status: 'scheduled',
  });

  logger.info(`Meeting created: ${meeting.id} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Meeting created successfully',
    meeting,
  });
});

/**
 * @desc    Get all meetings for user
 * @route   GET /api/meetings
 * @access  Private
 */
const getMeetings = asyncHandler(async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  const where = { createdBy: req.user.id };
  if (status) {
    where.status = status;
  }

  const meetings = await Meeting.findAll({
    where,
    order: [['scheduledAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json({
    success: true,
    count: meetings.length,
    meetings,
  });
});

/**
 * @desc    Get single meeting
 * @route   GET /api/meetings/:id
 * @access  Private
 */
const getMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findByPk(req.params.id);

  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: 'Meeting not found',
    });
  }

  // Check if user has access
  if (meeting.createdBy !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this meeting',
    });
  }

  // Get transcripts
  const transcripts = await Transcript.findAll({
    where: { meetingId: meeting.id },
    order: [['timestamp', 'ASC']],
  });

  res.json({
    success: true,
    meeting: {
      ...meeting.toJSON(),
      transcripts,
    },
  });
});

/**
 * @desc    Update meeting
 * @route   PUT /api/meetings/:id
 * @access  Private
 */
const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findByPk(req.params.id);

  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: 'Meeting not found',
    });
  }

  if (meeting.createdBy !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this meeting',
    });
  }

  const { title, description, scheduledAt, duration, status, meetingLink, participants } = req.body;

  if (title) meeting.title = title;
  if (description !== undefined) meeting.description = description;
  if (scheduledAt) meeting.scheduledAt = scheduledAt;
  if (duration) meeting.duration = duration;
  if (status) meeting.status = status;
  if (meetingLink !== undefined) meeting.meetingLink = meetingLink;
  if (participants) meeting.participants = participants;

  await meeting.save();

  logger.info(`Meeting updated: ${meeting.id}`);

  res.json({
    success: true,
    message: 'Meeting updated successfully',
    meeting,
  });
});

/**
 * @desc    Delete meeting
 * @route   DELETE /api/meetings/:id
 * @access  Private
 */
const deleteMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findByPk(req.params.id);

  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: 'Meeting not found',
    });
  }

  if (meeting.createdBy !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this meeting',
    });
  }

  // Delete associated transcripts
  await Transcript.destroy({ where: { meetingId: meeting.id } });

  await meeting.destroy();

  logger.info(`Meeting deleted: ${req.params.id}`);

  res.json({
    success: true,
    message: 'Meeting deleted successfully',
  });
});

/**
 * @desc    Save transcript
 * @route   POST /api/meetings/:id/transcript
 * @access  Private
 */
const saveTranscript = asyncHandler(async (req, res) => {
  const { content, speaker, timestamp, confidence } = req.body;

  const meeting = await Meeting.findByPk(req.params.id);

  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: 'Meeting not found',
    });
  }

  if (meeting.createdBy !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const transcript = await Transcript.create({
    meetingId: meeting.id,
    content,
    speaker: speaker || 'Unknown',
    timestamp: timestamp || 0,
    confidence: confidence || 0,
  });

  // Update meeting's full transcript
  const allTranscripts = await Transcript.findAll({
    where: { meetingId: meeting.id },
    order: [['timestamp', 'ASC']],
  });

  meeting.transcript = allTranscripts.map(t => t.content).join(' ');
  await meeting.save();

  res.status(201).json({
    success: true,
    transcript,
  });
});

/**
 * @desc    Start meeting (change status to in-progress)
 * @route   POST /api/meetings/:id/start
 * @access  Private
 */
const startMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findByPk(req.params.id);

  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: 'Meeting not found',
    });
  }

  if (meeting.createdBy !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  meeting.status = 'in-progress';
  await meeting.save();

  logger.info(`Meeting started: ${meeting.id}`);

  res.json({
    success: true,
    message: 'Meeting started',
    meeting,
  });
});

/**
 * @desc    End meeting (change status to completed)
 * @route   POST /api/meetings/:id/end
 * @access  Private
 */
const endMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findByPk(req.params.id);

  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: 'Meeting not found',
    });
  }

  if (meeting.createdBy !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  meeting.status = 'completed';
  await meeting.save();

  logger.info(`Meeting ended: ${meeting.id}`);

  res.json({
    success: true,
    message: 'Meeting ended',
    meeting,
  });
});

module.exports = {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  saveTranscript,
  startMeeting,
  endMeeting,
};