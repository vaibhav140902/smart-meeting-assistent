const joi = require('joi');
const logger = require('./logger');
const { AppError } = require('../utils/errors');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const data = { ...req.body, ...req.params, ...req.query };
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error:', messages);
      return next(new AppError('Validation failed', 400, messages));
    }

    // Replace request data with validated data
    Object.keys(value).forEach((key) => {
      if (req.body.hasOwnProperty(key)) {
        req.body[key] = value[key];
      }
      if (req.params.hasOwnProperty(key)) {
        req.params[key] = value[key];
      }
      if (req.query.hasOwnProperty(key)) {
        req.query[key] = value[key];
      }
    });

    next();
  };
};

// Common validation schemas
const schemas = {
  // Auth
  register: joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
    firstName: joi.string().min(2).required(),
    lastName: joi.string().min(2).required(),
  }),

  login: joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  }),

  // Meeting
  createMeeting: joi.object({
    title: joi.string().min(3).max(100).required(),
    description: joi.string().max(500),
    startTime: joi.date().required(),
    endTime: joi.date().min(joi.ref('startTime')).required(),
    participantEmails: joi.array().items(joi.string().email()),
    teamId: joi.string().uuid(),
  }),

  updateMeeting: joi.object({
    title: joi.string().min(3).max(100),
    description: joi.string().max(500),
    startTime: joi.date(),
    endTime: joi.date().min(joi.ref('startTime')),
    status: joi.string().valid('scheduled', 'ongoing', 'completed', 'cancelled'),
  }).min(1),

  // Action Item
  createActionItem: joi.object({
    title: joi.string().min(3).max(200).required(),
    description: joi.string().max(1000),
    assignedTo: joi.string().uuid().required(),
    dueDate: joi.date().required(),
    priority: joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    meetingId: joi.string().uuid().required(),
  }),

  updateActionItem: joi.object({
    title: joi.string().min(3).max(200),
    description: joi.string().max(1000),
    assignedTo: joi.string().uuid(),
    dueDate: joi.date(),
    priority: joi.string().valid('low', 'medium', 'high', 'urgent'),
    status: joi.string().valid('open', 'in_progress', 'completed', 'cancelled'),
  }).min(1),

  // Team
  createTeam: joi.object({
    name: joi.string().min(2).max(100).required(),
    description: joi.string().max(500),
  }),

  // Pagination
  pagination: joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(20),
    sortBy: joi.string(),
    order: joi.string().valid('asc', 'desc').default('desc'),
  }),
};

module.exports = {
  validate,
  schemas,
};