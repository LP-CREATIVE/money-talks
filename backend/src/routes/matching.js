const router = require('express').Router();
const { authenticate, requireInstitutional } = require('../middleware/auth');
const matchingController = require('../controllers/matchingController');

// Find matching experts for a question
router.get(
  '/question/:questionId/experts',
  authenticate,
  requireInstitutional,
  matchingController.findExperts
);

// Notify selected experts
router.post(
  '/question/:questionId/notify',
  authenticate,
  requireInstitutional,
  matchingController.notifyExperts
);

module.exports = router;
