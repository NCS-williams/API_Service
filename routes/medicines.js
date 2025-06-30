const express = require('express');
const { Medicines } = require('../database/models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get all medicines
router.get('/', requireAuth, async (req, res) => {
  try {
    const medicines = await Medicines.findAll();

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get medicine by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicines.findByPk(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new medicine
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name is required'
      });
    }

    // Check if medicine already exists
    const existingMedicine = await Medicines.findOne({ where: { name } });
    if (existingMedicine) {
      return res.status(409).json({
        success: false,
        message: 'Medicine already exists'
      });
    }

    const medicine = await Medicines.create({ name });

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: medicine
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update medicine
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name is required'
      });
    }

    const medicine = await Medicines.findByPk(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    await medicine.update({ name });

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete medicine
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicines.findByPk(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    await medicine.destroy();

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
