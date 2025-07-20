const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, requireInstitutional } = require('../middleware/auth');
const { 
  addQuestion, 
  getIdeaQuestions,
  getQuestionById
} = require('../controllers/questionsController');

// Validation rules
const addQuestionValidation = [
  body('ideaId').notEmpty().isString(),
  body('text').notEmpty().isLength({ min: 10, max: 500 })
];

// Routes
router.post('/add', authenticate, requireInstitutional, addQuestionValidation, addQuestion);
router.get('/idea/:ideaId', getIdeaQuestions);
router.get('/:id', authenticate, getQuestionById);

module.exports = router;
