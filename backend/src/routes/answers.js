const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const answersController = require('../controllers/answersController');

// Expert routes - use only requireAuth (which is the same as authenticate)
router.post('/expert', requireAuth, answersController.submitExpertAnswer);
router.get('/expert/my-answers', requireAuth, answersController.getExpertAnswers);
router.delete("/expert/answers/:answerId", requireAuth, answersController.deleteAnswer);
// General routes (accessible by authenticated users)
router.get('/question/:questionId', requireAuth, answersController.getAnswersByQuestion);
router.get('/idea/:ideaId', requireAuth, answersController.getAnswersByIdea);

// Admin routes - requireAdmin should include authentication
router.put('/:answerId/status', requireAdmin, answersController.updateAnswerStatus);

// File upload route
router.post('/upload', requireAuth, upload.single('file'), answersController.uploadAnswerFile);
module.exports = router;
