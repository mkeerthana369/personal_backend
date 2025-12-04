require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bdm_system_v2',
  port: parseInt(process.env.DB_PORT) || 3306,
  
  pool: {
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }
};
