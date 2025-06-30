const { verifyToken } = require('../utils/auth');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireInstitutional = (req, res, next) => {
  if (req.userType !== 'INSTITUTIONAL') {
    return res.status(403).json({ error: 'Institutional access required' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.userType !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticate,
  requireInstitutional,
  requireAdmin
};
