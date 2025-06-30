const session = require('express-session');
const bcrypt = require('bcrypt');

// Session configuration
const sessionConfig = {
  secret: 'pharmacy-system-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  next();
};

// Role-based authorization middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });

    }
    
    if (req.session.user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. ${role} role required.` 
      });
    }
    
    next();
  };
};

// Hash password utility
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password utility
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  sessionConfig,
  requireAuth,
  requireRole,
  hashPassword,
  comparePassword
};
