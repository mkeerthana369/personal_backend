// ============================================
// FILE: server.js
// BDM Backend V2 - Entry Point (~80 lines)
// ============================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const config = require('./src/config');
const routes = require('./src/api/routes');
const { errorHandler, notFoundHandler } = require('./src/middleware/error.middleware');
const { requestLogger } = require('./src/middleware/logger.middleware');

const app = express();
const PORT = config.server.port;

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: config.server.allowedOrigins,
  credentials: true
}));

// Body parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'BDM Backend V2',
    version: '2.0.0',
    database: 'Connected',
    ai_providers: config.ai.getActiveProviders()
  });
});

// ============================================
// AI CONFIGURATION ENDPOINT
// ============================================

app.get('/ai-config', (req, res) => {
  res.json({
    success: true,
    providers: config.ai.getActiveProviders(),
    priority: ['ollama', 'openrouter', 'openai'],
    models: {
      ollama: config.ai.ollama.model,
      openrouter: config.ai.openrouter.model,
      openai: config.ai.openai.model
    }
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Business Document Management API V2',
    version: '2.0.0',
    documentation: 'https://github.com/yourusername/bdm-backend',
    endpoints: {
      health: '/health',
      ai_config: '/ai-config',
      documents: '/api/documents',
      clauses: '/api/clauses',
      templates: '/api/templates',
      pdf: '/api/pdf',
      translations: '/api/translate'
    }
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    // Test database connection
    const db = require('./src/database/connection');
    await db.testConnection();
    
    // Test AI providers
    console.log('🤖 Active AI Providers:', config.ai.getActiveProviders().join(', '));
    
    app.listen(PORT, () => {
      console.log('================================================');
      console.log(`🚀 BDM Backend V2 running on port ${PORT}`);
      console.log(`📍 Base URL: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log(`🤖 AI Config: http://localhost:${PORT}/ai-config`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
      console.log('================================================');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;