// ============================================
// FILE: src/routes/translate.routes.js
// UPDATED: Added full document translation route
// ============================================

const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translate.controller');

// Preview single clause translation
router.post('/preview', translateController.preview.bind(translateController));

// NEW: Translate entire document to target language
router.post('/document', translateController.translateDocument.bind(translateController));

// Confirm preview
router.post('/confirm', translateController.confirm.bind(translateController));

// Get translation
router.get('/:original_type/:original_id/:lang', translateController.getTranslation.bind(translateController));

// Get all translations
router.get('/:original_type/:original_id', translateController.getAllTranslations.bind(translateController));

module.exports = router;