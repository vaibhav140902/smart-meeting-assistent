const asyncHandler = require('express-async-handler');
const calendarService = require('../services/calendarService');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const logger = require('../middleware/logger');

/**
 * @desc    Initiate Google Calendar OAuth
 * @route   GET /api/calendar/auth
 * @access  Private
 */
const initiateAuth = asyncHandler(async (req, res) => {
  const authUrl = calendarService.getAuthUrl();
  
  res.json({
    success: true,
    authUrl,
  });
});

/**
 * @desc    Handle OAuth callback
 * @route   GET /api/calendar/oauth/callback
 * @access  Public
 */
const handleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code is required',
    });
  }

  try {
    const tokens = await calendarService.getTokensFromCode(code);

    // In production, you should store these tokens securely in the database
    // For now, we'll return them to be stored in the frontend
    
    res.json({
      success: true,
      message: 'Calendar connected successfully',
      tokens,
    });
  } catch (error) {
    logger.error('Calendar OAuth callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect calendar',
    });
  }
});

/**
 * @desc    Create calendar event for meeting
 * @route   POST /api/calendar/events
 * @access  Private
 */
const createCalendarEvent = asyncHandler(async (req, res) => {
  const { meetingId, tokens } = req.body;

  if (!tokens || !tokens.access_token) {
    return res.status(400).json({
      success: false,
      message: 'Calendar tokens are required. Please connect your calendar first.',
    });
  }

  const meeting = await Meeting.findByPk(meetingId);

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

  try {
    // Calculate end time
    const startTime = new Date(meeting.scheduledAt);
    const endTime = new Date(startTime.getTime() + meeting.duration * 60000);

    const eventData = {
      title: meeting.title,
      description: meeting.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      attendees: meeting.participants.map(email => ({ email })),
      meetingLink: meeting.meetingLink,
    };

    const calendarEvent = await calendarService.createEvent(tokens, eventData);

    // Update meeting with Google Event ID
    meeting.googleEventId = calendarEvent.eventId;
    meeting.calendarProvider = 'google';
    await meeting.save();

    logger.info(`Calendar event created for meeting: ${meeting.id}`);

    res.json({
      success: true,
      message: 'Calendar event created',
      calendarEvent,
    });
  } catch (error) {
    logger.error('Error creating calendar event:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create calendar event',
    });
  }
});

/**
 * @desc    Update calendar event
 * @route   PUT /api/calendar/events/:meetingId
 * @access  Private
 */
const updateCalendarEvent = asyncHandler(async (req, res) => {
  const { tokens } = req.body;
  const { meetingId } = req.params;

  if (!tokens || !tokens.access_token) {
    return res.status(400).json({
      success: false,
      message: 'Calendar tokens are required',
    });
  }

  const meeting = await Meeting.findByPk(meetingId);

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

  if (!meeting.googleEventId) {
    return res.status(400).json({
      success: false,
      message: 'No calendar event associated with this meeting',
    });
  }

  try {
    const startTime = new Date(meeting.scheduledAt);
    const endTime = new Date(startTime.getTime() + meeting.duration * 60000);

    const eventData = {
      title: meeting.title,
      description: meeting.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      attendees: meeting.participants.map(email => ({ email })),
    };

    const calendarEvent = await calendarService.updateEvent(
      tokens,
      meeting.googleEventId,
      eventData
    );

    logger.info(`Calendar event updated for meeting: ${meeting.id}`);

    res.json({
      success: true,
      message: 'Calendar event updated',
      calendarEvent,
    });
  } catch (error) {
    logger.error('Error updating calendar event:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update calendar event',
    });
  }
});

/**
 * @desc    Delete calendar event
 * @route   DELETE /api/calendar/events/:meetingId
 * @access  Private
 */
const deleteCalendarEvent = asyncHandler(async (req, res) => {
  const { tokens } = req.body;
  const { meetingId } = req.params;

  if (!tokens || !tokens.access_token) {
    return res.status(400).json({
      success: false,
      message: 'Calendar tokens are required',
    });
  }

  const meeting = await Meeting.findByPk(meetingId);

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

  if (!meeting.googleEventId) {
    return res.status(400).json({
      success: false,
      message: 'No calendar event associated with this meeting',
    });
  }

  try {
    await calendarService.deleteEvent(tokens, meeting.googleEventId);

    meeting.googleEventId = null;
    meeting.calendarProvider = 'manual';
    await meeting.save();

    logger.info(`Calendar event deleted for meeting: ${meeting.id}`);

    res.json({
      success: true,
      message: 'Calendar event deleted',
    });
  } catch (error) {
    logger.error('Error deleting calendar event:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete calendar event',
    });
  }
});

/**
 * @desc    List calendar events
 * @route   GET /api/calendar/events
 * @access  Private
 */
const listCalendarEvents = asyncHandler(async (req, res) => {
  const { tokens } = req.query;

  if (!tokens) {
    return res.status(400).json({
      success: false,
      message: 'Calendar tokens are required',
    });
  }

  try {
    const parsedTokens = JSON.parse(tokens);
    const events = await calendarService.listEvents(parsedTokens);

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    logger.error('Error listing calendar events:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list calendar events',
    });
  }
});

module.exports = {
  initiateAuth,
  handleCallback,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents,
};