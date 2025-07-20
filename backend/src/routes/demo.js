const express = require('express');
const router = express.Router();
const { sendDemoOutreachEmail, getQuestionPreview } = require('../controllers/demoController');
const { requireAdmin } = require('../middleware/auth');

// Send demo outreach email (admin only)
router.post('/send-outreach', requireAdmin, sendDemoOutreachEmail);

// Get question preview (no auth required for demo)
router.get('/preview/:token', getQuestionPreview);

module.exports = router;
