const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const {
  getPhilosophies,
  createPhilosophy,
  updatePhilosophy,
  deletePhilosophy,
  togglePhilosophy
} = require('../controllers/philosophyController');

// All routes require admin access
router.get('/', requireAdmin, getPhilosophies);
router.post('/', requireAdmin, createPhilosophy);
router.put('/:id', requireAdmin, updatePhilosophy);
router.delete('/:id', requireAdmin, deletePhilosophy);
router.post('/:id/toggle', requireAdmin, togglePhilosophy);

module.exports = router;
