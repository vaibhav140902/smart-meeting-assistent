const asyncHandler = require('express-async-handler');
const Meeting = require('../models/Meeting');
const { Op } = require('sequelize');

/**
 * @desc    Get analytics data
 * @route   GET /api/analytics
 * @access  Private
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

  const meetings = await Meeting.findAll({
    where: {
      createdBy: req.user.id,
      scheduledAt: {
        [Op.gte]: cutoffDate
      }
    },
    order: [['scheduledAt', 'DESC']]
  });

  // Calculate metrics
  const totalMeetings = meetings.length;
  const completed = meetings.filter(m => m.status === 'completed');
  const avgDuration = completed.length 
    ? completed.reduce((sum, m) => sum + m.duration, 0) / completed.length 
    : 0;

  res.json({
    success: true,
    analytics: {
      totalMeetings,
      avgDuration: Math.round(avgDuration),
      completedMeetings: completed.length,
      scheduledMeetings: meetings.filter(m => m.status === 'scheduled').length
    },
    meetings
  });
});

module.exports = {
  getAnalytics
};