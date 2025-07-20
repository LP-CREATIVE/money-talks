const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const expertPaymentController = require('../controllers/expertPaymentController');

router.get('/pending', requireAuth, requireAdmin, paymentController.getPendingPayments);
router.post('/:answerId/review', requireAuth, requireAdmin, paymentController.reviewPayment);
router.post('/:answerId/process', requireAuth, requireAdmin, paymentController.processPayment);
router.get('/analytics', requireAuth, requireAdmin, paymentController.getPaymentAnalytics);

router.get('/veracity/:answerId', requireAuth, paymentController.getVeracityScore);

router.get('/expert/history', requireAuth, expertPaymentController.getPaymentHistory);
router.get('/expert/summary', requireAuth, expertPaymentController.getEarningsSummary);

module.exports = router;
