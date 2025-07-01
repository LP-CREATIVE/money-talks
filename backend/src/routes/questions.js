const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, requireInstitutional } = require('../middleware/auth');
const { 
  addQuestion, 
  getIdeaQuestions, 
  bidOnQuestionSlot,
  getMinimumEscrow
} = require('../controllers/questionsController');

// Validation rules
const addQuestionValidation = [
  body('ideaId').notEmpty().isString(),
  body('text').notEmpty().isLength({ min: 10, max: 500 }),
  body('bidAmount').isFloat({ min: 0 })
];

const bidValidation = [
  body('questionId').notEmpty().isString(),
  body('slot').isInt({ min: 1, max: 3 }),
  body('bidAmount').isFloat({ min: 0 })
];

// Routes
router.post('/add', authenticate, requireInstitutional, addQuestionValidation, addQuestion);
router.get('/idea/:ideaId', getIdeaQuestions);
router.post('/bid', authenticate, requireInstitutional, bidValidation, bidOnQuestionSlot);
router.get('/minimum-escrow', getMinimumEscrow);

module.exports = router;
