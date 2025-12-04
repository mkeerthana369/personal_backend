// ============================================
// FILE: src/routes/translate.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const translateController = require('../controllers/translate.controller');

router.post('/preview', translateController.preview.bind(translateController));
router.post('/confirm', translateController.confirm.bind(translateController));
router.get('/:original_type/:original_id/:lang', translateController.getTranslation.bind(translateController));
router.get('/:original_type/:original_id', translateController.getAllTranslations.bind(translateController));

module.exports = router;