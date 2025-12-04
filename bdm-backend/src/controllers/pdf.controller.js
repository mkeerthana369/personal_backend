// ============================================
// FILE: src/controllers/pdf.controller.js
// UPDATED: Generate translated PDF directly
// ============================================

const documentModel = require('../database/models/document.model');
const translateService = require('../services/translate.service');
const pdfService = require('../services/pdf.service');
const { badRequest, notFound, serverError } = require('../utils/response');

class PDFController {
  
  // Generate regular PDF
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
  
  // NEW: Generate fully translated PDF
  async generateTranslated(req, res) {
    try {
      const { document_id, target_lang } = req.body;
      
      if (!document_id || !target_lang) {
        return badRequest(res, 'document_id and target_lang are required');
      }
      
      console.log(`\n📄 Generating translated PDF`);
      console.log(`   Document: ${document_id}`);
      console.log(`   Language: ${target_lang}`);
      
      // Translate the document first
      const translatedDoc = await translateService.translateDocument(
        document_id,
        target_lang
      );
      
      // Generate PDF from translated document
      const pdfBuffer = await pdfService.generatePDF(translatedDoc);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${translatedDoc.document_name}.pdf"`
      });
      
      console.log(`✅ Translated PDF generated`);
      return res.end(pdfBuffer);
      
    } catch (error) {
      console.error('❌ Translated PDF error:', error);
      return serverError(res, error);
    }
  }
  
  // Bilingual PDF (original + translation side by side)
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