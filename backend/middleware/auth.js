const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional auth middleware - allows requests without token (for guest users)
// but verifies token if provided
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } else {
      // No token - set guest user
      req.user = {
        id: 0,
        username: 'guest',
        email: 'guest@example.com',
        firstName: 'Guest',
        lastName: 'User',
        role: 'Guest'
      };
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const managerMiddleware = (req, res, next) => {
  if (!['Admin', 'Manager'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
};

module.exports = { authMiddleware, optionalAuthMiddleware, adminMiddleware, managerMiddleware };
