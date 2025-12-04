const xlsx = require('xlsx');
const JSZip = require('jszip');
const templateModel = require('../../database/models/template.model');
const documentModel = require('../../database/models/document.model');
const aiService = require('../ai/ai.service');
const fillerService = require('./filler.service');
const pdfService = require('../pdf.service');

class BulkService {
  
  async generateFromExcel(file, template_id) {
    if (!file || !file.buffer) {
      throw new Error('Excel file required');
    }
    
    const template = await templateModel.findById(template_id);
    if (!template) throw new Error('Template not found');
    
    const rows = this.parseExcel(file.buffer);
    this.validateHeaders(rows, template);
    
    const zip = new JSZip();
    let count = 0;
    
    for (const row of rows) {
      count++;
      const document = await this.processTemplateRow(row, template, count);
      const pdfBuffer = await pdfService.generatePDF(document);
      zip.file(`${document.document_name}.pdf`, pdfBuffer);
    }
    
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }
  
  async generateFromExcelAI(file, document_type) {
    if (!file || !file.buffer) {
      throw new Error('Excel file required');
    }
    
    const rows = this.parseExcel(file.buffer);
    const zip = new JSZip();
    let count = 0;
    
    for (const row of rows) {
      count++;
      const document = await this.processAIRow(row, document_type, count);
      const pdfBuffer = await pdfService.generatePDF(document);
      zip.file(`${document.document_name}.pdf`, pdfBuffer);
    }
    
    return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  }
  
  async processTemplateRow(row, template, rowNum) {
    const context = this.mapRowToContext(row);
    const identifier = this.getIdentifier(context) || `Row${rowNum}`;
    const cleanId = this.cleanForFilename(identifier);
    const docName = `${template.template_name}_${cleanId}`;
    
    const filledClauses = await fillerService.fillClauses(template.clauses, context);
    
    return documentModel.create({
      template_id: template.id,
      document_name: docName,
      document_type: template.document_type,
      content_json: { clauses: filledClauses },
      variables: context
    });
  }
  
  async processAIRow(row, document_type, rowNum) {
    const context = this.mapRowToContext(row);
    
    const aiResult = await aiService.generateClauses(document_type, context);
    if (!aiResult.success) {
      throw new Error(`AI generation failed for row ${rowNum}: ${aiResult.error}`);
    }
    
    const filledClauses = await fillerService.fillClauses(aiResult.clauses, context);
    
    const identifier = this.getIdentifier(context) || `Row${rowNum}`;
    const cleanId = this.cleanForFilename(identifier);
    const docName = `${document_type}_${cleanId}`;
    
    return documentModel.create({
      template_id: null,
      document_name: docName,
      document_type,
      content_json: { clauses: filledClauses },
      variables: context
    });
  }
  
  parseExcel(buffer) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet, { defval: '' });
  }
  
  validateHeaders(rows, template) {
    if (!rows.length) throw new Error('Excel file is empty');
    
    const placeholders = fillerService.extractFromTemplate(template);
    const headers = Object.keys(rows[0]);
    
    const missing = placeholders.filter(ph => !headers.includes(ph));
    if (missing.length > 0) {
      throw new Error(`Missing columns: ${missing.join(', ')}`);
    }
  }
  
  mapRowToContext(row) {
    const context = {};
    Object.entries(row).forEach(([key, value]) => {
      context[key] = value ?? '';
    });
    return context;
  }
  
  getIdentifier(context) {
    const keys = ['Employee Name', 'Full Name', 'Name', 'Candidate Name'];
    for (const key of keys) {
      if (context[key]) return context[key];
    }
    return Object.values(context).find(v => v && String(v).trim() !== '');
  }
  
  cleanForFilename(str) {
    return String(str || '').replace(/[^a-zA-Z0-9]/g, '');
  }
}

module.exports = new BulkService();