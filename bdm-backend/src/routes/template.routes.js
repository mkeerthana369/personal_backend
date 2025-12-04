// ============================================
// FILE: src/routes/template.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');

router.post('/', templateController.create.bind(templateController));
router.post('/generate-ai', templateController.generateWithAI.bind(templateController));
router.get('/', templateController.findAll.bind(templateController));
router.get('/:id', templateController.findById.bind(templateController));
router.put('/:id', templateController.update.bind(templateController));
router.delete('/:id', templateController.delete.bind(templateController));
router.post('/:id/clauses', templateController.addClause.bind(templateController));
router.delete('/:id/clauses/:clause_id', templateController.removeClause.bind(templateController));

module.exports = router;
