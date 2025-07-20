const express = require('express');
const router = express.Router();
const expertOnboardingController = require('../controllers/expertOnboardingController');
const { requireAuth, requireExpert } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireExpert);

router.get('/profile', expertOnboardingController.getOnboardingProfile);
router.post('/submit', expertOnboardingController.submitOnboardingProfile);
router.post('/observable-pattern', expertOnboardingController.addObservablePattern);
router.post('/employment', expertOnboardingController.addEmployment);
router.put('/employment', expertOnboardingController.updateEmployment);
router.delete('/employment/:id', expertOnboardingController.deleteEmployment);
router.post('/expertise', expertOnboardingController.addExpertise);
router.put('/expertise', expertOnboardingController.updateExpertise);
router.delete('/expertise/:id', expertOnboardingController.deleteExpertise);module.exports = router;
