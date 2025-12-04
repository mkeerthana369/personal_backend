// ============================================
// FILE: src/config/index.js
// Central configuration export
// ============================================

const database = require('./database.config');
const ai = require('./ai.config');
const server = require('./server.config');

module.exports = {
  database,
  ai,
  server
};