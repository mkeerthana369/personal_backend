// ============================================
// FILE: src/routes/pdf.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdf.controller');

router.get('/generate/:id', pdfController.generate.bind(pdfController));
router.post('/generate-bilingual', pdfController.generateBilingual.bind(pdfController));

module.exports = router;