// ============================================
// FILE: src/controllers/document.controller.js
// Document CRUD (~180 lines)
// ============================================

const documentModel = require('../database/models/document.model');
const generatorService = require('../services/document/generator.service');
const bulkService = require('../services/document/bulk.service');
const { success, created, badRequest, notFound, serverError } = require('../utils/response');

class DocumentController {
  
  // CREATE: Generate single document
  async generate(req, res) {
    try {
      const { document_type, context, template_id, content_json } = req.body;
      
      if (!document_type) {
        return badRequest(res, 'document_type is required');
      }
      
      const document = await generatorService.generate({
        document_type,
        context: context || {},
        template_id: template_id || null,
        content_json: content_json || null
      });
      
      return created(res, document);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // CREATE: Bulk generation from Excel (template-based)
  async bulkGenerate(req, res) {
    try {
      if (!req.file) {
        return badRequest(res, 'Excel file is required');
      }
      
      const { template_id } = req.body;
      
      if (!template_id) {
        return badRequest(res, 'template_id is required');
      }
      
      const zipBuffer = await bulkService.generateFromExcel(
        req.file,
        parseInt(template_id)
      );
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="documents.zip"'
      });
      
      return res.end(zipBuffer);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // CREATE: Bulk AI generation from Excel
  async bulkGenerateAI(req, res) {
    try {
      if (!req.file) {
        return badRequest(res, 'Excel file is required');
      }
      
      const { document_type } = req.body;
      
      if (!document_type) {
        return badRequest(res, 'document_type is required');
      }
      
      const zipBuffer = await bulkService.generateFromExcelAI(
        req.file,
        document_type
      );
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="documents_ai.zip"'
      });
      
      return res.end(zipBuffer);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // READ: Get all documents
  async findAll(req, res) {
    try {
      const { document_type, template_id } = req.query;
      
      const filters = {};
      if (document_type) filters.document_type = document_type;
      if (template_id) filters.template_id = parseInt(template_id);
      
      const documents = await documentModel.findAll(filters);
      return success(res, documents);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // READ: Get by ID
  async findById(req, res) {
    try {
      const document = await documentModel.findById(req.params.id);
      
      if (!document) {
        return notFound(res, 'Document not found');
      }
      
      return success(res, document);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // READ: Get content (for translation)
  async getContent(req, res) {
    try {
      const document = await documentModel.findById(req.params.id);
      
      if (!document) {
        return notFound(res, 'Document not found');
      }
      
      return success(res, {
        id: document.id,
        document_type: document.document_type,
        content: document.content_json
      });
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // UPDATE
  async update(req, res) {
    try {
      const { document_name, content_json, variables } = req.body;
      
      const updateData = {};
      if (document_name) updateData.document_name = document_name;
      if (content_json) updateData.content_json = content_json;
      if (variables) updateData.variables = variables;
      
      const document = await documentModel.update(req.params.id, updateData);
      
      if (!document) {
        return notFound(res, 'Document not found');
      }
      
      return success(res, document);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // DELETE
  async delete(req, res) {
    try {
      const deleted = await documentModel.delete(req.params.id);
      
      if (!deleted) {
        return notFound(res, 'Document not found');
      }
      
      return success(res, { message: 'Document deleted successfully' });
    } catch (error) {
      return serverError(res, error);
    }
  }
}

module.exports = new DocumentController();