const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createOrUpdateProfile,
  uploadEvidence,
  addEducation,
  addCertification,
  addReference,
  takeDomainTest,
  getProfile,
  getVerificationRequirements
} = require('../controllers/expertController');

// All routes require authentication
router.use(authenticate);

// Profile management
router.post('/profile', createOrUpdateProfile);
router.get('/profile', getProfile); // Get current user's profile
router.get('/profile/:userId', getProfile); // Get specific user's profile

// Verification evidence
router.post('/evidence', uploadEvidence);

// Credentials
router.post('/education', addEducation);
router.post('/certification', addCertification);
router.post('/reference', addReference);

// Testing
router.post('/test', takeDomainTest);

// Requirements
router.get('/requirements', getVerificationRequirements);

module.exports = router;
