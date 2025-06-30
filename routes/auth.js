const express = require('express');
const { createSession, deleteSession, hashPassword, comparePassword } = require('../middleware/auth');
const { Users, Pharmacy, Fournisseur } = require('../database/models');

const router = express.Router();

// Login endpoint - handles all user types
router.post('/login', async (req, res) => {
  try {
    const { username, password, userType } = req.body;

    if (!username || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and userType are required'
      });
    }

    let user = null;
    let model = null;

    // Determine which model to query based on userType
    switch (userType) {
      case 'user':
        model = Users;
        break;
      case 'pharmacy':
        model = Pharmacy;
        break;
      case 'fournisseur':
        model = Fournisseur;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid userType. Must be user, pharmacy, or fournisseur'
        });
    }

    // Find user
    user = await model.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password (assuming passwords are hashed)
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create session
    const sessionId = await createSession(user, userType);

    // Set session cookie (secure: true only in production)
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      sessionId: sessionId, // Still return in response for clients who prefer headers
      user: {
        id: user.id,
        username: user.username,
        role: userType,
        name: user.name || null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, password, userType, name, location, phoneNumber } = req.body;

    if (!username || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and userType are required'
      });
    }

    let model = null;
    let userData = {
      username,
      password: await hashPassword(password)
    };

    // Add additional fields based on user type
    switch (userType) {
      case 'user':
        model = Users;
        break;
      case 'pharmacy':
        if (!name || !location || !phoneNumber) {
          return res.status(400).json({
            success: false,
            message: 'Name, location, and phone number are required for pharmacy registration'
          });
        }
        model = Pharmacy;
        userData = { ...userData, name, location, phoneNumber };
        break;
      case 'fournisseur':
        if (!name || !location || !phoneNumber) {
          return res.status(400).json({
            success: false,
            message: 'Name, location, and phone number are required for fournisseur registration'
          });
        }
        model = Fournisseur;
        userData = { ...userData, name, location, phoneNumber };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid userType. Must be user, pharmacy, or fournisseur'
        });
    }

    // Check if username already exists
    const existingUser = await model.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Create user
    const newUser = await model.create(userData);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: userType,
        name: newUser.name || null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '') || 
                     req.headers['x-session-id'] ||
                     req.cookies?.sessionId;
    
    if (sessionId) {
      await deleteSession(sessionId);
    }
    
    // Clear session cookie
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '') || 
                     req.headers['x-session-id'] ||
                     req.cookies?.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Session ID required'
      });
    }

    const { getSession } = require('../middleware/auth');
    const user = await getSession(sessionId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all active sessions (admin/debug route)
router.get('/sessions', async (req, res) => {
  try {
    const sessionId = req.headers.authorization?.replace('Bearer ', '') || 
                     req.headers['x-session-id'] ||
                     req.cookies?.sessionId;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Session ID required'
      });
    }

    const { getSession } = require('../middleware/auth');
    const currentUser = await getSession(sessionId);
    
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    // Only allow admin users (you can modify this logic as needed)
    // For now, only pharmacy users can view sessions
    if (currentUser.role !== 'pharmacy') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { Sessions } = require('../database/models');
    const { Op } = require('sequelize');
    
    const activeSessions = await Sessions.findAll({
      where: {
        expiresAt: { [Op.gt]: new Date() }
      },
      attributes: ['id', 'userId', 'userType', 'userData', 'createdAt', 'expiresAt'],
      order: [['createdAt', 'DESC']]
    });

    const sessionsData = activeSessions.map(session => ({
      sessionId: session.id,
      userId: session.userId,
      userType: session.userType,
      user: JSON.parse(session.userData),
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    }));

    res.json({
      success: true,
      count: sessionsData.length,
      sessions: sessionsData
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
