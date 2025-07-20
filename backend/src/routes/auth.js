const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { generateToken } = require('../utils/auth');

const prisma = require("../utils/prisma");const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('userType').isIn(['INSTITUTIONAL', 'RETAIL']).withMessage('Invalid user type'),
  body('organizationName').optional().isLength({ min: 2 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);

module.exports = router;

const passport = require('../config/passport');

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      
      if (!user.userType || user.userType === 'RETAIL' && !user.organizationName) {
        const tempToken = generateToken(user.id, 'RETAIL');
        res.redirect(`${process.env.FRONTEND_URL}/complete-profile?token=${tempToken}&provider=google`);
      } else {
        const token = generateToken(user.id, user.userType);
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&userType=${user.userType}`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

router.get('/linkedin', passport.authenticate('linkedin'));

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      
      if (!user.userType || user.userType === 'RETAIL' && !user.organizationName) {
        const tempToken = generateToken(user.id, 'RETAIL');
        res.redirect(`${process.env.FRONTEND_URL}/complete-profile?token=${tempToken}&provider=linkedin`);
      } else {
        const token = generateToken(user.id, user.userType);
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&userType=${user.userType}`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

router.put('/complete-profile', authenticate, async (req, res) => {
  try {
    const { userType, organizationName } = req.body;
    const userId = req.userId;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userType,
        organizationName
      }
    });

    res.json({
      message: 'Profile completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        userType: updatedUser.userType,
        organizationName: updatedUser.organizationName
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ error: 'Failed to complete profile' });
  }
});
