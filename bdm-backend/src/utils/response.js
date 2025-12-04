// ============================================
// FILE: src/utils/response.js
// Standardized API responses
// ============================================

const success = (res, data, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data
  });
};

const created = (res, data, message = 'Created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data
  });
};

const badRequest = (res, message = 'Bad request') => {
  return res.status(400).json({
    success: false,
    error: message
  });
};

const notFound = (res, message = 'Not found') => {
  return res.status(404).json({
    success: false,
    error: message
  });
};

const serverError = (res, error) => {
  console.error('Server error:', error);
  
  return res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = {
  success,
  created,
  badRequest,
  notFound,
  serverError
};