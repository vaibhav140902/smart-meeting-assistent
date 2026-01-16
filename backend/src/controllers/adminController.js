// cat > backend/src/controllers/adminController.js << 'EOF'
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Transcript = require('../models/Transcript');
const logger = require('../middleware/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getStats = asyncHandler(async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.count();
    
    // Active users (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await User.count({
      where: {
        lastLogin: { [Op.gte]: sevenDaysAgo }
      }
    });

    // Total meetings
    const totalMeetings = await Meeting.count();

    // Meetings by status
    const scheduledMeetings = await Meeting.count({ where: { status: 'scheduled' } });
    const inProgressMeetings = await Meeting.count({ where: { status: 'in-progress' } });
    const completedMeetings = await Meeting.count({ where: { status: 'completed' } });
    const cancelledMeetings = await Meeting.count({ where: { status: 'cancelled' } });

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSignups = await User.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // Meetings created this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    const meetingsThisMonth = await Meeting.count({
      where: {
        createdAt: { [Op.gte]: firstDayOfMonth }
      }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalMeetings,
        meetingsByStatus: {
          scheduled: scheduledMeetings,
          'in-progress': inProgressMeetings,
          completed: completedMeetings,
          cancelled: cancelledMeetings
        },
        recentSignups,
        meetingsThisMonth,
        activeUserPercentage: totalUsers ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
});

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    const where = search ? {
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ]
    } : {};

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password', 'twoFactorSecret', 'googleTokens'] },
    });

    res.json({
      success: true,
      users: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

/**
 * @desc    Get user details with meetings
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password', 'twoFactorSecret', 'googleTokens'] }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get user's meetings
  const meetings = await Meeting.findAll({
    where: { createdBy: user.id },
    order: [['createdAt', 'DESC']],
    limit: 10
  });

  // Get meeting stats
  const meetingStats = {
    total: await Meeting.count({ where: { createdBy: user.id } }),
    completed: await Meeting.count({ where: { createdBy: user.id, status: 'completed' } }),
    upcoming: await Meeting.count({ where: { createdBy: user.id, status: 'scheduled' } })
  };

  res.json({
    success: true,
    user,
    meetings,
    meetingStats
  });
});

/**
 * @desc    Get all meetings with pagination
 * @route   GET /api/admin/meetings
 * @access  Private/Admin
 */
const getMeetings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    const where = {};
    
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Meeting.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['scheduledAt', 'DESC']],
    });

    res.json({
      success: true,
      meetings: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings',
    });
  }
});

/**
 * @desc    Update user status (ban/unban)
 * @route   PUT /api/admin/users/:id/status
 * @access  Private/Admin
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  
  const user = await User.findByPk(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isActive = isActive;
  await user.save();

  logger.info(`User ${user.email} ${isActive ? 'activated' : 'deactivated'} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    user: {
      id: user.id,
      email: user.email,
      isActive: user.isActive
    }
  });
});

/**
 * @desc    Delete user and all their data
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Don't allow deleting yourself
  if (user.id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account',
    });
  }

  // Delete user's meetings
  await Meeting.destroy({ where: { createdBy: user.id } });

  // Delete user
  await user.destroy();

  logger.info(`User ${user.email} deleted by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * @desc    Delete meeting
 * @route   DELETE /api/admin/meetings/:id
 * @access  Private/Admin
 */
const deleteMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const meeting = await Meeting.findByPk(id);

  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: 'Meeting not found',
    });
  }

  // Delete transcripts
  await Transcript.destroy({ where: { meetingId: id } });

  await meeting.destroy();

  logger.info(`Meeting ${id} deleted by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Meeting deleted successfully',
  });
});

module.exports = {
  getStats,
  getUsers,
  getUserDetails,
  getMeetings,
  updateUserStatus,
  deleteUser,
  deleteMeeting,
};
