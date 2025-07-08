const prisma = require('../utils/prisma');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { validationResult } = require('express-validator');

// Register new user
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, userType, organizationName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        userType,
        organizationName: userType === 'INSTITUTIONAL' ? organizationName : null
      }
    });

    // Generate token
    const token = generateToken(user.id, user.userType);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        organizationName: user.organizationName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        expertProfile: true
      }
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.userType);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        organizationName: user.organizationName,
        expertProfile: user.expertProfile,        walletBalance: user.walletBalance,
        reputationScore: user.reputationScore
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        expertProfile: true
      }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        organizationName: user.organizationName,
        expertProfile: user.expertProfile,        walletBalance: user.walletBalance,
        reputationScore: user.reputationScore,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getMe
};
