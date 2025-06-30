const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { Sessions } = require('../database/models');
const { Op } = require('sequelize');

// Simple session management
const createSession = async (user, userType) => {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  // Store user data as JSON string
  const userData = {
    id: user.id,
    username: user.username,
    role: userType,
    name: user.name || null
  };

  await Sessions.create({
    id: sessionId,
    userId: user.id,
    userType: userType,
    userData: JSON.stringify(userData),
    expiresAt: expiresAt
  });

  return sessionId;
};

const getSession = async (sessionId) => {
  if (!sessionId) return null;

  // Simple lookup with expiration check
  const session = await Sessions.findOne({
    where: {
      id: sessionId,
      expiresAt: { [Op.gt]: new Date() }
    }
  });

  return session ? JSON.parse(session.userData) : null;
};

const deleteSession = async (sessionId) => {
  if (sessionId) {
    await Sessions.destroy({ where: { id: sessionId } });
  }
};

// Clean up expired sessions
const cleanExpiredSessions = async () => {
  await Sessions.destroy({
    where: { expiresAt: { [Op.lt]: new Date() } }
  });
};

// Simple authentication middleware
const requireAuth = async (req, res, next) => {
  try {
    // Get session ID from header or cookie (supports multiple formats)
    const sessionId = req.headers.authorization?.replace('Bearer ', '') || 
                     req.headers['x-session-id'] ||
                     req.cookies?.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Session ID required' 
      });
    }

    // Simple session check
    const user = await getSession(sessionId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired session' 
      });
    }

    // Attach user to request
    req.user = user;
    req.sessionId = sessionId;
    next();
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// Simple role check middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: `${role} access required` 
      });
    }
    next();
  };
};

// Password utilities
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  createSession,
  getSession,
  deleteSession,
  cleanExpiredSessions,
  requireAuth,
  requireRole,
  hashPassword,
  comparePassword
};
