const express = require('express');
const { Pharmacy } = require('../database/models');
const { requireAuth, requireRole, hashPassword } = require('../middleware/auth');

const router = express.Router();

// Get all pharmacies
router.get('/', requireAuth, async (req, res) => {
  try {
    const pharmacies = await Pharmacy.findAll({
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: pharmacies
    });
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pharmacy by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const pharmacy = await Pharmacy.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    res.json({
      success: true,
      data: pharmacy
    });
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update pharmacy
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, name, location, phoneNumber } = req.body;

    const pharmacy = await Pharmacy.findByPk(id);
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    // Check if current user can update this pharmacy
    if (req.session.user.role === 'pharmacy' && req.session.user.id != id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password = await hashPassword(password);
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    await pharmacy.update(updateData);

    res.json({
      success: true,
      message: 'Pharmacy updated successfully',
      data: {
        id: pharmacy.id,
        username: pharmacy.username,
        name: pharmacy.name,
        location: pharmacy.location,
        phoneNumber: pharmacy.phoneNumber
      }
    });
  } catch (error) {
    console.error('Error updating pharmacy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete pharmacy
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const pharmacy = await Pharmacy.findByPk(id);
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    // Check if current user can delete this pharmacy
    if (req.session.user.role === 'pharmacy' && req.session.user.id != id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await pharmacy.destroy();

    res.json({
      success: true,
      message: 'Pharmacy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pharmacy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
