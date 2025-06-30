const express = require('express');
const { DemandUsers, Medicines, Users } = require('../database/models');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all demands with filters
router.get('/', requireAuth, async (req, res) => {
  try {
    const { userId } = req.query;
    const where = {};

    // Add filters
    if (userId) where.userId = userId;

    // Role-based filtering
    if (req.session.user.role === 'user') {
      where.userId = req.session.user.id;
    }

    const demands = await DemandUsers.findAll({
      where,
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Users, as: 'user', attributes: { exclude: ['password'] } }
      ],
      order: [['date', 'DESC']]
    });

    res.json({
      success: true,
      data: demands
    });
  } catch (error) {
    console.error('Error fetching demands:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get demand by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const demand = await DemandUsers.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Users, as: 'user', attributes: { exclude: ['password'] } }
      ]
    });

    if (!demand) {
      return res.status(404).json({
        success: false,
        message: 'Demand not found'
      });
    }

    // Check access rights
    if (req.session.user.role === 'user' && demand.userId !== req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: demand
    });
  } catch (error) {
    console.error('Error fetching demand:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new demand (user only)
router.post('/', requireRole('user'), async (req, res) => {
  try {
    const { medId } = req.body;

    if (!medId) {
      return res.status(400).json({
        success: false,
        message: 'Medicine ID is required'
      });
    }

    // Verify medicine exists
    const medicine = await Medicines.findByPk(medId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const demand = await DemandUsers.create({
      medId,
      userId: req.session.user.id,
      date: new Date()
    });

    // Fetch the created demand with includes
    const createdDemand = await DemandUsers.findByPk(demand.id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Users, as: 'user', attributes: { exclude: ['password'] } }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Demand created successfully',
      data: createdDemand
    });
  } catch (error) {
    console.error('Error creating demand:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update demand (user only, limited updates)
router.put('/:id', requireRole('user'), async (req, res) => {
  try {
    const { id } = req.params;
    const { medId } = req.body;

    const demand = await DemandUsers.findByPk(id);
    if (!demand) {
      return res.status(404).json({
        success: false,
        message: 'Demand not found'
      });
    }

    if (demand.userId !== req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updateData = {};
    if (medId) {
      // Verify medicine exists
      const medicine = await Medicines.findByPk(medId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: 'Medicine not found'
        });
      }
      updateData.medId = medId;
    }

    await demand.update(updateData);

    // Fetch updated demand with includes
    const updatedDemand = await DemandUsers.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Users, as: 'user', attributes: { exclude: ['password'] } }
      ]
    });

    res.json({
      success: true,
      message: 'Demand updated successfully',
      data: updatedDemand
    });
  } catch (error) {
    console.error('Error updating demand:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete demand (user only)
router.delete('/:id', requireRole('user'), async (req, res) => {
  try {
    const { id } = req.params;

    const demand = await DemandUsers.findByPk(id);
    if (!demand) {
      return res.status(404).json({
        success: false,
        message: 'Demand not found'
      });
    }

    if (demand.userId !== req.session.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await demand.destroy();

    res.json({
      success: true,
      message: 'Demand deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting demand:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
