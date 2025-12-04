// ============================================
// FILE: src/routes/clause.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const clauseController = require('../controllers/clause.controller');

router.post('/', clauseController.create.bind(clauseController));
router.post('/generate-ai', clauseController.generateWithAI.bind(clauseController));
router.post('/merge', clauseController.merge.bind(clauseController));
router.get('/', clauseController.findAll.bind(clauseController));
router.get('/samples', clauseController.findAllSamples.bind(clauseController));
router.get('/category/:category', clauseController.findByCategory.bind(clauseController));
router.get('/:id', clauseController.findById.bind(clauseController));
router.put('/:id', clauseController.update.bind(clauseController));
router.delete('/:id', clauseController.delete.bind(clauseController));
router.post('/:id/mark-sample', clauseController.markAsSample.bind(clauseController));
router.post('/:id/clone', clauseController.cloneFromSample.bind(clauseController));

module.exports = router;