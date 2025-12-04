// ============================================
// FILE: src/services/document/generator.service.js
// IMPROVED: Auto-infer document_type from template
// ============================================

const aiService = require('../ai/ai.service');
const fillerService = require('./filler.service');
const templateModel = require('../../database/models/template.model');
const documentModel = require('../../database/models/document.model');

class GeneratorService {
  
  async generate(data) {
    let { document_type, context, template_id, content_json } = data;
    
    // IMPROVEMENT: Auto-infer document_type from template
    if (template_id && !document_type) {
      const template = await templateModel.findById(template_id);
      if (template) {
        document_type = template.document_type;
        console.log(`ℹ️ Auto-inferred document_type: ${document_type} from template ${template_id}`);
      }
    }
    
    // Now validate
    if (!document_type) {
      throw new Error('document_type is required (or provide valid template_id)');
    }
    
    // PATH 1: Direct content save (no generation)
    if (content_json && !template_id) {
      return this.createDirect({ document_type, content_json, context });
    }
    
    // PATH 2: Generate from template
    if (template_id) {
      return this.generateFromTemplate({ template_id, context, document_type });
    }
    
    // PATH 3: Full AI generation
    return this.generateFromAI({ document_type, context });
  }
  
  async createDirect({ document_type, content_json, context }) {
    return documentModel.create({
      template_id: null,
      document_name: `${document_type}_${Date.now()}`,
      document_type,
      content_json,
      variables: context || {}
    });
  }
  
  async generateFromTemplate({ template_id, context, document_type }) {
    const template = await templateModel.findById(template_id);
    if (!template) throw new Error('Template not found');
    
    // Use template's document_type if not provided
    if (!document_type) {
      document_type = template.document_type;
    }
    
    let filledContent = { clauses: template.clauses || [] };
    
    if (context && Object.keys(context).length > 0) {
      filledContent.clauses = await fillerService.fillClauses(template.clauses, context);
    }
    
    const docName = `${template.template_name}_${Date.now()}`;
    
    return documentModel.create({
      template_id: template.id,
      document_name: docName,
      document_type: document_type,
      content_json: filledContent,
      variables: context || {}
    });
  }
  
  async generateFromAI({ document_type, context }) {
    const aiResult = await aiService.generateClauses(document_type, context || {});
    
    if (!aiResult.success) {
      throw new Error(aiResult.error || 'AI generation failed');
    }
    
    let filledContent = { clauses: aiResult.clauses };
    
    if (context && Object.keys(context).length > 0) {
      filledContent.clauses = await fillerService.fillClauses(aiResult.clauses, context);
    }
    
    const docName = `${document_type}_AI_${Date.now()}`;
    
    const document = await documentModel.create({
      template_id: null,
      document_name: docName,
      document_type,
      content_json: filledContent,
      variables: context || {}
    });
    
    // Log AI usage
    await documentModel.logAIGeneration({
      request_type: 'document_generation',
      prompt: `Generate ${document_type}`,
      response_data: { clauses_count: aiResult.clauses.length },
      tokens_used: aiResult.tokensUsed,
      provider: aiResult.provider,
      model: aiResult.model
    });
    
    return document;
  }
}

module.exports = new GeneratorService();