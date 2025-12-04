// ============================================
// FILE: src/constants/errors.js
// ============================================

const ERROR_MESSAGES = {
  // Database
  DB_CONNECTION_FAILED: 'Database connection failed',
  DB_QUERY_FAILED: 'Database query failed',
  
  // Validation
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_INPUT: 'Invalid input data',
  
  // Resources
  RESOURCE_NOT_FOUND: 'Resource not found',
  RESOURCE_ALREADY_EXISTS: 'Resource already exists',
  
  // AI
  AI_GENERATION_FAILED: 'AI generation failed',
  AI_PROVIDER_NOT_CONFIGURED: 'No AI provider configured',
  AI_RATE_LIMITED: 'AI provider rate limited',
  
  // File
  FILE_UPLOAD_FAILED: 'File upload failed',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File size exceeds limit',
  
  // PDF
  PDF_GENERATION_FAILED: 'PDF generation failed',
  
  // Translation
  TRANSLATION_FAILED: 'Translation failed',
  INVALID_LANGUAGE: 'Invalid language code',
  
  // Generic
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden'
};

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  AI_ERROR: 'AI_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

class AppError extends Error {
  constructor(message, statusCode = 500, code = ERROR_CODES.INTERNAL_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  ERROR_MESSAGES,
  ERROR_CODES,
  AppError
};