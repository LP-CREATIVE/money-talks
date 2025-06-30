const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, requireInstitutional } = require('../middleware/auth');
const { 
  contributeToIdea, 
  getMyContributions, 
  getIdeaContributions, 
  processRefund 
} = require('../controllers/escrowController');

// Validation rules
const contributeValidation = [
  body('ideaId').notEmpty().isString(),
  body('amount').isFloat({ min: 5000 }).withMessage('Minimum contribution is $5,000')
];

const refundValidation = [
  body('contributionId').notEmpty().isString(),
  body('reason').notEmpty().isString()
];

// Routes
router.post('/contribute', authenticate, requireInstitutional, contributeValidation, contributeToIdea);
router.get('/my-contributions', authenticate, getMyContributions);
router.get('/idea/:ideaId', authenticate, getIdeaContributions);
router.post('/refund', authenticate, refundValidation, processRefund);

module.exports = router;
