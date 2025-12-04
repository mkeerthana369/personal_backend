// ============================================
// FILE: src/database/connection.js
// Database connection pool
// ============================================

const mysql = require('mysql2/promise');
const config = require('../config/database.config');

const pool = mysql.createPool({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
  port: config.port,
  ...config.pool
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection
};
