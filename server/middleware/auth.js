const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.token;
    if (!token) {
      const header = req.headers.authorization || '';
      token = header.startsWith('Bearer ') ? header.slice(7) : null;
    }
    
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user || !user.active) return res.status(401).json({ message: 'Invalid or inactive user' });

    if (!user.emailVerified && user.authProvider === 'local') {
      const isAuthRoute = req.originalUrl.includes('/api/auth/me') || req.originalUrl.includes('/api/auth/resend-verification') || req.originalUrl.includes('/api/auth/logout');
      if (!isAuthRoute) {
        return res.status(403).json({ message: 'Email verification required', unverified: true });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

// Usage: requireRole(ROLES.SALES_MANAGER, ROLES.FINANCE)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
