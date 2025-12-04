// ============================================
// FILE: src/routes/index.js
// ============================================

const express = require('express');
const router = express.Router();
const debugRoutes = require('./debug.routes');
router.use('/debug', debugRoutes);
const clauseRoutes = require('./clause.routes');
const documentRoutes = require('./document.routes');
const templateRoutes = require('./template.routes');
const pdfRoutes = require('./pdf.routes');
const translateRoutes = require('./translate.routes');

router.use('/clauses', clauseRoutes);
router.use('/documents', documentRoutes);
router.use('/templates', templateRoutes);
router.use('/pdf', pdfRoutes);
router.use('/translate', translateRoutes);

module.exports = router;