// ============================================
// FILE: src/controllers/template.controller.js
// ============================================

const templateModel = require('../database/models/template.model');
const aiService = require('../services/ai/ai.service');
const clauseModel = require('../database/models/clause.model');
const { success, created, badRequest, notFound, serverError } = require('../utils/response');

class TemplateController {
  
  async create(req, res) {
    try {
      const { template_name, document_type, description, clause_ids } = req.body;
      
      if (!template_name || !document_type) {
        return badRequest(res, 'template_name and document_type are required');
      }
      
      const template = await templateModel.create(
        { template_name, document_type, description, is_ai_generated: false },
        clause_ids || []
      );
      
      return created(res, template);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  async generateWithAI(req, res) {
    try {
      const { template_name, document_type, context } = req.body;
      
      if (!template_name || !document_type) {
        return badRequest(res, 'template_name and document_type are required');
      }
      
      const aiResult = await aiService.generateClauses(document_type, context || {});
      
      if (!aiResult.success) {
        return serverError(res, new Error(aiResult.error));
      }
      
      const createdClauses = await clauseModel.createMany(
        aiResult.clauses.map(c => ({
          ...c,
          is_ai_generated: true,
          is_sample: false
        }))
      );
      
      const clauseIds = createdClauses.map(c => c.id);
      
      const template = await templateModel.create(
        { template_name, document_type, description: 'AI Generated', is_ai_generated: true },
        clauseIds
      );
      
      return created(res, {
        template,
        ai_metadata: {
          clauses_generated: createdClauses.length,
          tokens_used: aiResult.tokensUsed,
          model: aiResult.model,
          provider: aiResult.provider
        }
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  async findAll(req, res) {
    try {
      const { document_type } = req.query;
      const filters = {};
      if (document_type) filters.document_type = document_type;
      
      const templates = await templateModel.findAll(filters);
      return success(res, templates);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  async findById(req, res) {
    try {
      const template = await templateModel.findById(req.params.id);
      if (!template) return notFound(res, 'Template not found');
      return success(res, template);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  async update(req, res) {
    try {
      const template = await templateModel.update(req.params.id, req.body);
      if (!template) return notFound(res, 'Template not found');
      return success(res, template);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  async delete(req, res) {
    try {
      const deleted = await templateModel.delete(req.params.id);
      if (!deleted) return notFound(res, 'Template not found');
      return success(res, { message: 'Template deleted successfully' });
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  async addClause(req, res) {
    try {
      const { clause_id, position } = req.body;
      if (!clause_id) return badRequest(res, 'clause_id is required');
      
      const template = await templateModel.addClause(
        req.params.id,
        clause_id,
        position || null
      );
      
      return success(res, template);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  async removeClause(req, res) {
    try {
      const template = await templateModel.removeClause(
        req.params.id,
        req.params.clause_id
      );
      return success(res, template);
    } catch (error) {
      return serverError(res, error);
    }
  }
}

module.exports = new TemplateController();
