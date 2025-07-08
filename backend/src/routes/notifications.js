const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;
    
    const result = await notificationService.getUserNotifications(req.userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.put('/read-all', authenticate, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
