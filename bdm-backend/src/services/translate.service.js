// ============================================
// FILE: src/services/translate.service.js
// Translation orchestration (~120 lines)
// ============================================

const aiService = require('./ai/ai.service');
const clauseModel = require('../database/models/clause.model');
const documentModel = require('../database/models/document.model');
const templateModel = require('../database/models/template.model');

class TranslateService {
  
  async translate(original_id, original_type, target_lang) {
    let content = '';
    
    if (original_type === 'clause') {
      const clause = await clauseModel.findById(original_id);
      if (!clause) throw new Error('Clause not found');
      content = clause.content_html || clause.content;
      
    } else if (original_type === 'document') {
      const document = await documentModel.findById(original_id);
      if (!document) throw new Error('Document not found');
      content = this.extractDocumentContent(document);
      
    } else if (original_type === 'template') {
      const template = await templateModel.findById(original_id);
      if (!template) throw new Error('Template not found');
      content = this.extractTemplateContent(template);
      
    } else {
      throw new Error('Invalid original_type');
    }
    
    const result = await aiService.translateText(content, target_lang);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result;
  }
  
  extractDocumentContent(document) {
    const clauses = document.content_json?.clauses || [];
    return clauses.map(c => c.content_html || c.content).join('\n\n');
  }
  
  extractTemplateContent(template) {
    const clauses = template.clauses || [];
    return clauses.map(c => c.content_html || c.content).join('\n\n');
  }
}

module.exports = new TranslateService();