require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 5000,
  env: process.env.NODE_ENV || 'development',
  
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  
  bodyLimit: '10mb'
};
