// ============================================
// FILE: src/routes/debug.routes.js
// Add this to help test the system
// ============================================

const express = require('express');
const router = express.Router();
const aiService = require('../services/ai/ai.service');
const templateModel = require('../database/models/template.model');
const { success, serverError } = require('../utils/response');

// Test AI generation RAW (see exactly what AI returns)
router.post('/test-ai-raw', async (req, res) => {
  try {
    const { document_type = 'offer_letter', context = {} } = req.body;
    
    const result = await aiService.generateClauses(document_type, context);
    
    return success(res, {
      success: result.success,
      clauses: result.clauses,
      provider: result.provider,
      model: result.model,
      tokens: result.tokensUsed,
      error: result.error
    });
  } catch (error) {
    return serverError(res, error);
  }
});

// Test template creation with manual clauses
router.post('/test-template-manual', async (req, res) => {
  try {
    const template = await templateModel.create({
      template_name: 'Test Template ' + Date.now(),
      document_type: 'test',
      description: 'Manual test',
      is_ai_generated: false
    }, []);
    
    return success(res, template);
  } catch (error) {
    return serverError(res, error);
  }
});

// Get all templates with their clauses
router.get('/templates-detailed', async (req, res) => {
  try {
    const templates = await templateModel.findAll();
    
    const detailed = [];
    for (const template of templates) {
      const full = await templateModel.findById(template.id);
      detailed.push(full);
    }
    
    return success(res, detailed);
  } catch (error) {
    return serverError(res, error);
  }
});

module.exports = router;
