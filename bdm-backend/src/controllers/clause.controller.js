// ============================================
// FILE: src/controllers/clause.controller.js
// Clause CRUD + AI generation (~220 lines)
// ============================================

const clauseModel = require('../database/models/clause.model');
const aiService = require('../services/ai/ai.service');
const { success, created, badRequest, notFound, serverError } = require('../utils/response');

class ClauseController {
  
  // CREATE: Manual clause
  async create(req, res) {
    try {
      const { clause_type, content, content_html, category, is_sample } = req.body;
      
      if (!clause_type || !content || !category) {
        return badRequest(res, 'clause_type, content, and category are required');
      }
      
      const clause = await clauseModel.create({
        clause_type,
        content,
        content_html: content_html || null,
        category,
        is_ai_generated: false,
        is_sample: is_sample || false
      });
      
      return created(res, clause);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // CREATE: AI-generated clause
  async generateWithAI(req, res) {
    try {
      const { clause_type, category, context } = req.body;
      
      if (!clause_type || !category) {
        return badRequest(res, 'clause_type and category are required');
      }
      
      const result = await aiService.generateSingleClause(
        clause_type,
        category,
        context || {}
      );
      
      if (!result.success) {
        return serverError(res, new Error(result.error));
      }
      
      const clause = await clauseModel.create({
        clause_type: result.clause.clause_type,
        content: result.clause.content,
        content_html: result.clause.content,
        category,
        is_ai_generated: true,
        is_sample: false
      });
      
      return created(res, {
        clause,
        ai_metadata: {
          tokens_used: result.tokensUsed,
          model: result.model,
          provider: result.provider
        }
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // READ: Get all clauses
  async findAll(req, res) {
    try {
      const { category, clause_type, is_sample, is_merged } = req.query;
      
      const filters = {};
      if (category) filters.category = category;
      if (clause_type) filters.clause_type = clause_type;
      if (is_sample !== undefined) filters.is_sample = is_sample === 'true';
      if (is_merged === 'true') filters.is_merged = true;
      
      const clauses = await clauseModel.findAll(filters);
      return success(res, clauses);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // READ: Get by ID
  async findById(req, res) {
    try {
      const clause = await clauseModel.findById(req.params.id);
      
      if (!clause) {
        return notFound(res, 'Clause not found');
      }
      
      return success(res, clause);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // READ: Get by category
  async findByCategory(req, res) {
    try {
      const clauses = await clauseModel.findByCategory(req.params.category);
      return success(res, clauses);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // UPDATE
  async update(req, res) {
    try {
      const { clause_type, content, content_html, category } = req.body;
      
      const updateData = {};
      if (clause_type) updateData.clause_type = clause_type;
      if (content) updateData.content = content;
      if (content_html !== undefined) updateData.content_html = content_html;
      if (category) updateData.category = category;
      
      const clause = await clauseModel.update(req.params.id, updateData);
      
      if (!clause) {
        return notFound(res, 'Clause not found');
      }
      
      return success(res, clause);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // DELETE
  async delete(req, res) {
    try {
      const deleted = await clauseModel.delete(req.params.id);
      
      if (!deleted) {
        return notFound(res, 'Clause not found');
      }
      
      return success(res, { message: 'Clause deleted successfully' });
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // MERGE: Combine multiple clauses
  async merge(req, res) {
    try {
      const { clause_ids, clause_type, category, is_sample } = req.body;
      
      if (!clause_ids || !Array.isArray(clause_ids) || clause_ids.length < 2) {
        return badRequest(res, 'At least 2 clause_ids required');
      }
      
      const merged = await clauseModel.merge(clause_ids, {
        clause_type,
        category,
        is_sample
      });
      
      return created(res, merged);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // SAMPLE: Get all sample clauses
  async findAllSamples(req, res) {
    try {
      const { category } = req.query;
      const samples = await clauseModel.findAllSamples(category || null);
      return success(res, samples);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // SAMPLE: Mark as sample
  async markAsSample(req, res) {
    try {
      const { is_sample } = req.body;
      
      const clause = await clauseModel.markAsSample(
        req.params.id,
        is_sample === true
      );
      
      return success(res, clause);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // SAMPLE: Clone from sample
  async cloneFromSample(req, res) {
    try {
      const { new_category } = req.body;
      
      const clause = await clauseModel.cloneFromSample(
        req.params.id,
        new_category
      );
      
      return created(res, clause);
    } catch (error) {
      return serverError(res, error);
    }
  }
}

module.exports = new ClauseController();