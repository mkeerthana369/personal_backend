// ============================================
// FILE: src/services/translate.service.js
// FIXED: Full document translation to target language
// ============================================

const aiService = require('./ai/ai.service');
const clauseModel = require('../database/models/clause.model');
const documentModel = require('../database/models/document.model');
const templateModel = require('../database/models/template.model');

class TranslateService {
  
  // Translate single clause
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
    
    console.log(`🌐 Translating ${original_type}:${original_id} to ${target_lang}`);
    console.log(`📝 Content length: ${content.length} chars`);
    
    const result = await aiService.translateText(content, target_lang);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    console.log(`✅ Translation completed: ${result.translated.length} chars`);
    
    return result;
  }
  
  // NEW: Translate entire document and return new document
  async translateDocument(documentId, targetLang) {
    const document = await documentModel.findById(documentId);
    if (!document) throw new Error('Document not found');
    
    const clauses = document.content_json?.clauses || [];
    
    console.log(`\n🌍 Translating entire document to ${targetLang}`);
    console.log(`📄 Document has ${clauses.length} clauses`);
    
    const translatedClauses = [];
    
    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      const originalContent = clause.content_html || clause.content || '';
      
      console.log(`  ${i + 1}/${clauses.length} Translating ${clause.clause_type}...`);
      
      if (!originalContent.trim()) {
        translatedClauses.push({
          ...clause,
          content: '',
          content_html: ''
        });
        continue;
      }
      
      try {
        const result = await aiService.translateText(originalContent, targetLang);
        
        if (result.success) {
          translatedClauses.push({
            ...clause,
            clause_type: clause.clause_type,
            content: result.translated.replace(/<[^>]+>/g, ''), // Strip HTML for plain content
            content_html: result.translated,
            category: clause.category
          });
          console.log(`    ✅ Translated successfully`);
        } else {
          console.log(`    ⚠️ Translation failed, keeping original`);
          translatedClauses.push(clause);
        }
        
        // Small delay to avoid overwhelming the AI
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`    ❌ Error translating clause:`, error.message);
        translatedClauses.push(clause);
      }
    }
    
    // Create new translated document
    const translatedDoc = await documentModel.create({
      template_id: document.template_id,
      document_name: `${document.document_name}_${targetLang}`,
      document_type: document.document_type,
      content_json: { clauses: translatedClauses },
      variables: document.variables
    });
    
    console.log(`✅ Translated document created: ID ${translatedDoc.id}`);
    
    return translatedDoc;
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