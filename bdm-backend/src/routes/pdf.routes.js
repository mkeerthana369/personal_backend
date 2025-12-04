// ============================================
// FILE: src/routes/pdf.routes.js
// UPDATED: Added translated PDF route
// ============================================

const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdf.controller');

// Generate regular PDF
router.get('/generate/:id', pdfController.generate.bind(pdfController));

// NEW: Generate fully translated PDF
router.post('/generate-translated', pdfController.generateTranslated.bind(pdfController));

// Generate bilingual PDF (original + translation)
router.post('/generate-bilingual', pdfController.generateBilingual.bind(pdfController));

module.exports = router;