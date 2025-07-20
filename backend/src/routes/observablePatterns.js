const express = require('express');
const router = express.Router();
const observablePatternsController = require('../controllers/observablePatternsController');
const { requireAuth, requireExpert } = require('../middleware/auth');

// All routes require authentication and expert role
router.use(requireAuth);
router.use(requireExpert);

// Observable patterns management
router.get('/patterns', observablePatternsController.getExpertPatterns);
router.post('/patterns', observablePatternsController.createPattern);
router.put('/patterns/:id', observablePatternsController.updatePattern);
router.delete('/patterns/:id', observablePatternsController.deletePattern);

// Company-specific patterns
router.get('/patterns/company/:company', observablePatternsController.getCompanyPatterns);

// Pattern statistics
router.get('/patterns/stats', observablePatternsController.getPatternStats);

// Question-specific observations
router.post('/observations/question/:questionId', observablePatternsController.recordObservation);
router.get('/observations/question/:questionId', observablePatternsController.getQuestionObservations);

module.exports = router;
