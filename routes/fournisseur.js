const express = require('express');
const { Fournisseur } = require('../database/models');
const { requireAuth, requireRole, hashPassword } = require('../middleware/auth');

const router = express.Router();

// Get all fournisseurs
router.get('/', requireAuth, async (req, res) => {
  try {
    const fournisseurs = await Fournisseur.findAll({
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: fournisseurs
    });
  } catch (error) {
    console.error('Error fetching fournisseurs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get fournisseur by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const fournisseur = await Fournisseur.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur not found'
      });
    }

    res.json({
      success: true,
      data: fournisseur
    });
  } catch (error) {
    console.error('Error fetching fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update fournisseur
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, name, location, phoneNumber } = req.body;

    const fournisseur = await Fournisseur.findByPk(id);
    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur not found'
      });
    }

    // Check if current user can update this fournisseur
    if (req.user.role === 'fournisseur' && req.user.id != id) {
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

    await fournisseur.update(updateData);

    res.json({
      success: true,
      message: 'Fournisseur updated successfully',
      data: {
        id: fournisseur.id,
        username: fournisseur.username,
        name: fournisseur.name,
        location: fournisseur.location,
        phoneNumber: fournisseur.phoneNumber
      }
    });
  } catch (error) {
    console.error('Error updating fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete fournisseur
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const fournisseur = await Fournisseur.findByPk(id);
    if (!fournisseur) {
      return res.status(404).json({
        success: false,
        message: 'Fournisseur not found'
      });
    }

    // Check if current user can delete this fournisseur
    if (req.user.role === 'fournisseur' && req.user.id != id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await fournisseur.destroy();

    res.json({
      success: true,
      message: 'Fournisseur deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting fournisseur:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
