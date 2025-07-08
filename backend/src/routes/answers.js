const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const answersController = require('../controllers/answersController');

// Submit answer as expert
router.post(
  '/submit',
  authenticate,
  [
    body('questionId').notEmpty().withMessage('Question ID is required'),
    body('content').isLength({ min: 100 }).withMessage('Answer must be at least 100 characters'),
    body('sources').optional().isArray().withMessage('Sources must be an array')
  ],
  answersController.submitExpertAnswer
);

// Get answers for a question
router.get('/question/:questionId', authenticate, answersController.getQuestionAnswers);

// Rate an answer (institutional users only)
router.post(
  '/:answerId/rate',
  authenticate,
  [
    body('rating').isFloat({ min: 0, max: 100 }).withMessage('Rating must be between 0 and 100'),
    body('feedback').optional().isString()
  ],
  answersController.rateAnswer
);

module.exports = router;
