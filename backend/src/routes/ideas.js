const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, requireInstitutional } = require('../middleware/auth');
const { getIdeas, createIdea, getIdeaById, updateRankings } = require('../controllers/ideasController');

// Validation rules
const createIdeaValidation = [
  body('title').notEmpty().isLength({ min: 5, max: 200 }),
  body('summary').notEmpty().isLength({ min: 50, max: 1000 }),
  body('detailedPlan').optional().isString(),
  body('sector').optional().isString(),
  body('marketCap').optional().isString()
];

// Routes
router.get('/', getIdeas); // Public - anyone can view ideas
router.post('/', authenticate, requireInstitutional, createIdeaValidation, createIdea);
router.get('/:id', getIdeaById); // Public - anyone can view idea details
router.post('/update-rankings', authenticate, updateRankings); // Admin only in production

module.exports = router;
