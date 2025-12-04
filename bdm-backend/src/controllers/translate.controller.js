// ============================================
// FILE: src/controllers/translate.controller.js
// ENHANCED: Full document translation endpoint
// ============================================

const { v4: uuidv4 } = require('uuid');
const translateModel = require('../database/models/translate.model');
const translateService = require('../services/translate.service');
const { success, created, badRequest, notFound, serverError } = require('../utils/response');

class TranslateController {
  
  // Preview single clause/item translation
  async preview(req, res) {
    try {
      const { original_id, original_type, target_lang } = req.body;
      
      if (!original_id || !original_type || !target_lang) {
        return badRequest(res, 'original_id, original_type, and target_lang are required');
      }
      
      console.log(`🌐 Translating ${original_type}:${original_id} to ${target_lang}`);
      
      const result = await translateService.translate(original_id, original_type, target_lang);
      
      const previewId = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await translateModel.createPreview({
        preview_id: previewId,
        original_id,
        original_type,
        lang: target_lang,
        translated_content: result.translated,
        created_by: null,
        expires_at: expiresAt
      });
      
      console.log(`✅ Translation preview created: ${previewId}`);
      
      return created(res, {
        preview_id: previewId,
        original_id,
        original_type,
        target_lang,
        translated_content: result.translated,
        expires_at: expiresAt,
        ai_metadata: {
          tokens_used: result.tokensUsed,
          model: result.model,
          provider: result.provider,
          is_html: result.isHTML
        }
      });
    } catch (error) {
      console.error('❌ Translation preview error:', error);
      return serverError(res, error);
    }
  }
  
  // NEW: Translate entire document
  async translateDocument(req, res) {
    try {
      const { document_id, target_lang } = req.body;
      
      if (!document_id || !target_lang) {
        return badRequest(res, 'document_id and target_lang are required');
      }
      
      console.log(`\n🌍 Starting full document translation`);
      console.log(`   Document ID: ${document_id}`);
      console.log(`   Target Language: ${target_lang}`);
      
      const translatedDoc = await translateService.translateDocument(
        document_id,
        target_lang
      );
      
      return created(res, {
        message: 'Document translated successfully',
        original_document_id: document_id,
        translated_document: translatedDoc,
        target_language: target_lang,
        clauses_translated: translatedDoc.content_json?.clauses?.length || 0
      });
      
    } catch (error) {
      console.error('❌ Document translation error:', error);
      return serverError(res, error);
    }
  }
  
  async confirm(req, res) {
    try {
      const { preview_id } = req.body;
      
      if (!preview_id) {
        return badRequest(res, 'preview_id is required');
      }
      
      console.log(`✅ Confirming translation preview: ${preview_id}`);
      
      const translationId = await translateModel.confirmPreview(preview_id, null);
      
      return success(res, {
        message: 'Translation confirmed',
        translation_id: translationId
      });
    } catch (error) {
      console.error('❌ Translation confirm error:', error);
      return serverError(res, error);
    }
  }
  
  async getTranslation(req, res) {
    try {
      const { original_id, original_type, lang } = req.params;
      
      const translation = await translateModel.findTranslation(
        parseInt(original_id),
        original_type,
        lang
      );
      
      if (!translation) {
        return notFound(res, 'Translation not found');
      }
      
      return success(res, translation);
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  async getAllTranslations(req, res) {
    try {
      const { original_id, original_type } = req.params;
      
      const translations = await translateModel.findAllTranslations(
        parseInt(original_id),
        original_type
      );
      
      return success(res, translations);
    } catch (error) {
      return serverError(res, error);
    }
  }
}

module.exports = new TranslateController();