const express = require('express');
const { Stocks, Medicines, Pharmacy } = require('../database/models');
const { requireAuth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Get all stocks with filters
router.get('/', requireAuth, async (req, res) => {
  try {
    const { pharmId } = req.query;
    const where = {};

    // Add filters
    if (pharmId) where.pharmId = pharmId;

    // Role-based filtering
    if (req.session.user.role === 'pharmacy') {
      where.pharmId = req.session.user.id;
    }

    const stocks = await Stocks.findAll({
      where,
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ],
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: stocks
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get stocks by medicine ID (show which pharmacies have this medicine)
router.get('/by-medicine/:medicineId', requireAuth, async (req, res) => {
  try {
    const { medicineId } = req.params;

    // Verify medicine exists
    const medicine = await Medicines.findByPk(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const stocks = await Stocks.findAll({
      where: {
        medicalId: medicineId,
        numOfUnits: { [Op.gt]: 0 } // Only show stocks with available units
      },
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ],
      order: [['numOfUnits', 'DESC']] // Order by highest stock first
    });

    res.json({
      success: true,
      data: stocks,
      medicine: medicine,
      totalPharmacies: stocks.length,
      totalUnits: stocks.reduce((sum, stock) => sum + stock.numOfUnits, 0)
    });
  } catch (error) {
    console.error('Error fetching stocks by medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get stock by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await Stocks.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ]
    });

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    // Check access rights
    if (req.session.user.role === 'pharmacy' && stock.pharmId !== req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new stock (pharmacy only)
router.post('/', requireRole('pharmacy'), async (req, res) => {
  try {
    const { medicalId, numOfUnits } = req.body;

    if (!medicalId || numOfUnits === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Medicine ID and number of units are required'
      });
    }

    // Verify medicine exists
    const medicine = await Medicines.findByPk(medicalId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Check if stock already exists for this pharmacy and medicine
    const existingStock = await Stocks.findOne({
      where: {
        pharmId: req.session.user.id,
        medicalId
      }
    });

    if (existingStock) {
      return res.status(409).json({
        success: false,
        message: 'Stock already exists for this medicine. Use update endpoint instead.'
      });
    }

    const stock = await Stocks.create({
      pharmId: req.session.user.id,
      medicalId,
      numOfUnits
    });

    // Fetch the created stock with includes
    const createdStock = await Stocks.findByPk(stock.id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Stock created successfully',
      data: createdStock
    });
  } catch (error) {
    console.error('Error creating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update stock (pharmacy only)
router.put('/:id', requireRole('pharmacy'), async (req, res) => {
  try {
    const { id } = req.params;
    const { numOfUnits } = req.body;

    if (numOfUnits === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Number of units is required'
      });
    }

    const stock = await Stocks.findByPk(id);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    if (stock.pharmId !== req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await stock.update({ numOfUnits });

    // Fetch updated stock with includes
    const updatedStock = await Stocks.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ]
    });

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: updatedStock
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add to stock (pharmacy only)
router.patch('/:id/add', requireRole('pharmacy'), async (req, res) => {
  try {
    const { id } = req.params;
    const { units } = req.body;

    if (!units || units <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid number of units to add is required'
      });
    }

    const stock = await Stocks.findByPk(id);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    if (stock.pharmId !== req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const newUnits = stock.numOfUnits + parseInt(units);
    await stock.update({ numOfUnits: newUnits });

    // Fetch updated stock with includes
    const updatedStock = await Stocks.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ]
    });

    res.json({
      success: true,
      message: `Added ${units} units to stock`,
      data: updatedStock
    });
  } catch (error) {
    console.error('Error adding to stock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove from stock (pharmacy only)
router.patch('/:id/remove', requireRole('pharmacy'), async (req, res) => {
  try {
    const { id } = req.params;
    const { units } = req.body;

    if (!units || units <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid number of units to remove is required'
      });
    }

    const stock = await Stocks.findByPk(id);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    if (stock.pharmId !== req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const newUnits = stock.numOfUnits - parseInt(units);
    if (newUnits < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove more units than available in stock'
      });
    }

    await stock.update({ numOfUnits: newUnits });

    // Fetch updated stock with includes
    const updatedStock = await Stocks.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ]
    });

    res.json({
      success: true,
      message: `Removed ${units} units from stock`,
      data: updatedStock
    });
  } catch (error) {
    console.error('Error removing from stock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete stock (pharmacy only)
router.delete('/:id', requireRole('pharmacy'), async (req, res) => {
  try {
    const { id } = req.params;

    const stock = await Stocks.findByPk(id);
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    if (stock.pharmId !== req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await stock.destroy();

    res.json({
      success: true,
      message: 'Stock deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
