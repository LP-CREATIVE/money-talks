const { verifyToken } = require('../utils/auth');
const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    
    // Fetch the full user object
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Set the full user object on req.user
    req.user = user;
    req.userId = decoded.userId; // Keep for backward compatibility
    req.userType = decoded.userType; // Keep for backward compatibility
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireInstitutional = async (req, res, next) => {
  // First authenticate
  await authenticate(req, res, () => {
    if (!req.user || req.user.userType !== 'INSTITUTIONAL') {
      return res.status(403).json({ error: 'Institutional access required' });
    }
    next();
  });
};

const requireAdmin = async (req, res, next) => {
  // First authenticate
  await authenticate(req, res, () => {
    if (!req.user || req.user.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};


const requireExpert = async (req, res, next) => {
  // First authenticate
  await authenticate(req, res, () => {
    if (!req.user || req.user.userType !== 'RETAIL') {
    console.log("User type check:", req.user?.userType, "Expected: EXPERT");      return res.status(403).json({ error: 'Expert access required' });
    }
    next();
  });
};

module.exports = {
  authenticate,
  requireAuth: authenticate,
  requireInstitutional,
  requireAdmin,
  requireExpert
};
