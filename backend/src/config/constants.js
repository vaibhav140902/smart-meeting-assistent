module.exports = {
  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    MEMBER: 'member',
  },

  // Meeting Status
  MEETING_STATUS: {
    SCHEDULED: 'scheduled',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    PAUSED: 'paused',
  },

  // Transcription Status
  TRANSCRIPTION_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },

  // Action Item Status
  ACTION_ITEM_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Action Item Priority
  ACTION_ITEM_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },

  // Summary Status
  SUMMARY_STATUS: {
    PENDING: 'pending',
    GENERATING: 'generating',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    MEETING_STARTED: 'meeting_started',
    MEETING_ENDED: 'meeting_ended',
    ACTION_ITEM_ASSIGNED: 'action_item_assigned',
    ACTION_ITEM_DUE: 'action_item_due',
    SUMMARY_READY: 'summary_ready',
    TRANSCRIPTION_COMPLETE: 'transcription_complete',
  },

  // Notification Status
  NOTIFICATION_STATUS: {
    UNREAD: 'unread',
    READ: 'read',
    ARCHIVED: 'archived',
  },

  // Error Codes
  ERROR_CODES: {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    MEETING_NOT_FOUND: 'MEETING_NOT_FOUND',
    INVALID_REQUEST: 'INVALID_REQUEST',
    SERVER_ERROR: 'SERVER_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    GOOGLE_AUTH_ERROR: 'GOOGLE_AUTH_ERROR',
    S3_ERROR: 'S3_ERROR',
    TRANSCRIPTION_ERROR: 'TRANSCRIPTION_ERROR',
  },

  // Time Limits
  TIME_LIMITS: {
    MAX_MEETING_DURATION: 480, // 8 hours in minutes
    IDLE_TIMEOUT: 30, // 30 minutes
    SESSION_TIMEOUT: 1440, // 24 hours
    RATE_LIMIT_WINDOW: 900, // 15 minutes
  },

  // Rate Limits
  RATE_LIMITS: {
    AUTH_ATTEMPTS: 5,
    API_CALLS: 100,
    UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    BATCH_SIZE: 100,
  },

  // Cache Keys
  CACHE_KEYS: {
    USER: 'user:',
    MEETING: 'meeting:',
    TRANSCRIPTION: 'transcription:',
    SUMMARY: 'summary:',
    ACTION_ITEM: 'action_item:',
    SESSION: 'session:',
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // File Types
  FILE_TYPES: {
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/mp4'],
    VIDEO: ['video/mp4', 'video/mpeg'],
    DOCUMENT: ['application/pdf', 'text/plain'],
  },

  // Meeting Settings
  MEETING_SETTINGS: {
    MAX_PARTICIPANTS: 50,
    RECORDING_QUALITY: '1080p',
    AUDIO_CODEC: 'opus',
    VIDEO_CODEC: 'h264',
  },

  // Transcription Settings
  TRANSCRIPTION_SETTINGS: {
    LANGUAGE: 'en-US',
    CONFIDENCE_THRESHOLD: 0.7,
    CHUNK_SIZE: 4096,
    TIMEOUT: 30000,
  },

  // AI Settings
  AI_SETTINGS: {
    SUMMARY_MODEL: 'gpt-3.5-turbo',
    SUMMARY_TEMPERATURE: 0.7,
    SUMMARY_MAX_TOKENS: 500,
    ACTION_ITEM_MODEL: 'gpt-3.5-turbo',
    ACTION_ITEM_TEMPERATURE: 0.5,
    ACTION_ITEM_MAX_TOKENS: 300,
  },

  // Default Values
  DEFAULTS: {
    LANGUAGE: 'en',
    TIMEZONE: 'UTC',
    THEME: 'light',
    NOTIFICATIONS_ENABLED: true,
  },

  // Email Templates
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    RESET_PASSWORD: 'reset_password',
    ACTION_ITEM_ASSIGNED: 'action_item_assigned',
    MEETING_SUMMARY: 'meeting_summary',
    INVITATION: 'invitation',
  },

  // Response Messages
  RESPONSE_MESSAGES: {
    SUCCESS: 'Operation successful',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    ERROR: 'An error occurred',
    VALIDATION_ERROR: 'Validation failed',
  },
};