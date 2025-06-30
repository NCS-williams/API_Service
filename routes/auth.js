const express = require('express');
const { hashPassword, comparePassword } = require('../middleware/auth');
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
    req.session.user = {
      id: user.id,
      username: user.username,
      role: userType,
      name: user.name || null
    };

    res.json({
      success: true,
      message: 'Login successful',
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
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Could not log out'
      });
    }
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  res.json({
    success: true,
    user: req.session.user
  });
});

module.exports = router;
