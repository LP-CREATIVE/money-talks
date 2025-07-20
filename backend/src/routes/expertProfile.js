const express = require('express');
const router = express.Router();
const expertProfileController = require('../controllers/expertProfileController');
const { requireAuth, requireExpert } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireExpert);

router.get('/profile', expertProfileController.getExpertProfile);
router.put('/profile', expertProfileController.updateExpertProfile);

module.exports = router;
