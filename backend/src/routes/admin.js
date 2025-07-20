const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.patch('/users/:userId/verify', adminController.verifyUser);

// Content review
router.get('/answers/pending', adminController.getPendingAnswers);
router.post('/answers/:answerId/approve', adminController.approveAnswer);
router.post('/answers/:answerId/reject', adminController.rejectAnswer);

// Platform metrics
router.get('/metrics', adminController.getPlatformMetrics);

// Ideas overview
router.get('/ideas', adminController.getAllIdeas);

module.exports = router;
