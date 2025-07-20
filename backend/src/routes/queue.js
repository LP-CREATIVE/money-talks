const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, requireExpert } = require('../middleware/auth');
const queueController = require('../controllers/queueController');

router.get('/next-assignment', requireAuth, requireExpert, queueController.getNextAssignment);
router.post('/assignments/:questionId/accept', requireAuth, requireExpert, queueController.acceptAssignment);
router.post('/assignments/:questionId/decline', requireAuth, requireExpert, queueController.declineAssignment);

router.get('/status/:questionId', requireAuth, requireAdmin, queueController.getQueueStatus);
router.post('/build/:questionId', requireAuth, requireAdmin, queueController.buildQueue);

module.exports = router;
