// Custom App Error Class
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation Error
class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

// Authentication Error
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

// Authorization Error
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

// Not Found Error
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

// Conflict Error
class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// Rate Limit Error
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Internal Server Error
class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
    this.name = 'InternalServerError';
  }
}

// External Service Error
class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`${service} service error: ${message}`, 502);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

// Business Logic Error
class BusinessLogicError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'BusinessLogicError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ExternalServiceError,
  BusinessLogicError,
};