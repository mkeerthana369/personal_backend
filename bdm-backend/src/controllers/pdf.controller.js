// ============================================
// FILE: src/controllers/pdf.controller.js
// ============================================

const documentModel = require('../database/models/document.model');
const pdfService = require('../services/pdf.service');
const { badRequest, notFound, serverError } = require('../utils/response');

class PDFController {
  
  async generate(req, res) {
    try {
      const document = await documentModel.findById(req.params.id);
      
      if (!document) {
        return notFound(res, 'Document not found');
      }
      
      const pdfBuffer = await pdfService.generatePDF(document);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.document_name}.pdf"`
      });
      
      return res.end(pdfBuffer);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  async generateBilingual(req, res) {
    try {
      const { document_id, target_lang } = req.body;
      
      if (!document_id || !target_lang) {
        return badRequest(res, 'document_id and target_lang are required');
      }
      
      const document = await documentModel.findById(document_id);
      if (!document) return notFound(res, 'Document not found');
      
      const pdfBuffer = await pdfService.generateBilingualPDF(document, target_lang);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.document_name}_bilingual.pdf"`
      });
      
      return res.end(pdfBuffer);
    } catch (error) {
      return serverError(res, error);
    }
  }
}

module.exports = new PDFController();
