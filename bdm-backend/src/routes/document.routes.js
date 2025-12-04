// ============================================
// FILE: src/routes/document.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { upload } = require('../middleware/upload.middleware');

router.post('/generate', documentController.generate.bind(documentController));
router.post('/bulk-generate', upload.single('file'), documentController.bulkGenerate.bind(documentController));
router.post('/bulk-generate-ai', upload.single('file'), documentController.bulkGenerateAI.bind(documentController));
router.get('/', documentController.findAll.bind(documentController));
router.get('/:id', documentController.findById.bind(documentController));
router.get('/:id/content', documentController.getContent.bind(documentController));
router.put('/:id', documentController.update.bind(documentController));
router.delete('/:id', documentController.delete.bind(documentController));

module.exports = router;
