const express = require('express');
const { Commands, Medicines, Pharmacy, Fournisseur } = require('../database/models');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all commands with filters
router.get('/', requireAuth, async (req, res) => {
  try {
    const { state, pharmId, fournisseurId } = req.query;
    const where = {};

    // Add filters
    if (state) where.state = state;
    if (pharmId) where.pharmId = pharmId;
    if (fournisseurId) where.fournisseurId = fournisseurId;

    // Role-based filtering
    if (req.user.role === 'pharmacy') {
      where.pharmId = req.user.id;
    } else if (req.user.role === 'fournisseur') {
      where.fournisseurId = req.user.id;
    }

    const commands = await Commands.findAll({
      where,
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } },
        { model: Fournisseur, as: 'fournisseur', attributes: { exclude: ['password'] } }
      ],
      order: [['startDate', 'DESC']]
    });

    res.json({
      success: true,
      data: commands
    });
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending commands (for fournisseurs)
router.get('/pending', requireAuth,requireRole('fournisseur'), async (req, res) => {
  try {
    const commands = await Commands.findAll({
      where: { state: 'awaiting' },
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ],
      order: [['startDate', 'DESC']]
    });

    res.json({
      success: true,
      data: commands
    });
  } catch (error) {
    console.error('Error fetching pending commands:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get command by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const command = await Commands.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } },
        { model: Fournisseur, as: 'fournisseur', attributes: { exclude: ['password'] } }
      ]
    });

    if (!command) {
      return res.status(404).json({
        success: false,
        message: 'Command not found'
      });
    }

    // Check access rights
    if (req.user.role === 'pharmacy' && command.pharmId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'fournisseur' && command.fournisseurId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: command
    });
  } catch (error) {
    console.error('Error fetching command:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new command (pharmacy only)
router.post('/',requireAuth, requireRole('pharmacy'), async (req, res) => {
  try {
    const { medId, numOfUnits } = req.body;

    if (!medId || !numOfUnits) {
      return res.status(400).json({
        success: false,
        message: 'Medicine ID and number of units are required'
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

    const command = await Commands.create({
      medId,
      pharmId: req.user.id,
      numOfUnits,
      startDate: new Date(),
      state: 'awaiting',
      fournisseurId: null
    });

    // Fetch the created command with includes
    const createdCommand = await Commands.findByPk(command.id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Command created successfully',
      data: createdCommand
    });
  } catch (error) {
    console.error('Error creating command:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Accept command (fournisseur only)
router.patch('/:id/accept', requireAuth,requireRole('fournisseur'), async (req, res) => {
  try {
    const { id } = req.params;

    const command = await Commands.findByPk(id);
    if (!command) {
      return res.status(404).json({
        success: false,
        message: 'Command not found'
      });
    }

    if (command.state !== 'awaiting') {
      return res.status(400).json({
        success: false,
        message: 'Command is not in awaiting state'
      });
    }

    await command.update({
      fournisseurId: req.user.id,
      state: 'on_delivery'
    });

    // Fetch updated command with includes
    const updatedCommand = await Commands.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } },
        { model: Fournisseur, as: 'fournisseur', attributes: { exclude: ['password'] } }
      ]
    });

    res.json({
      success: true,
      message: 'Command accepted successfully',
      data: updatedCommand
    });
  } catch (error) {
    console.error('Error accepting command:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark command as delivered (fournisseur only)
router.patch('/:id/deliver', requireRole('fournisseur'), async (req, res) => {
  try {
    const { id } = req.params;

    const command = await Commands.findByPk(id);
    if (!command) {
      return res.status(404).json({
        success: false,
        message: 'Command not found'
      });
    }

    if (command.fournisseurId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (command.state !== 'on_delivery') {
      return res.status(400).json({
        success: false,
        message: 'Command is not in delivery state'
      });
    }

    await command.update({
      state: 'delivered'
    });

    // Fetch updated command with includes
    const updatedCommand = await Commands.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } },
        { model: Fournisseur, as: 'fournisseur', attributes: { exclude: ['password'] } }
      ]
    });

    res.json({
      success: true,
      message: 'Command marked as delivered successfully',
      data: updatedCommand
    });
  } catch (error) {
    console.error('Error delivering command:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update command (pharmacy only, limited updates)
router.put('/:id', requireRole('pharmacy'), async (req, res) => {
  try {
    const { id } = req.params;
    const { numOfUnits } = req.body;

    const command = await Commands.findByPk(id);
    if (!command) {
      return res.status(404).json({
        success: false,
        message: 'Command not found'
      });
    }

    if (command.pharmId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (command.state !== 'awaiting') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update command that is not in awaiting state'
      });
    }

    const updateData = {};
    if (numOfUnits) updateData.numOfUnits = numOfUnits;

    await command.update(updateData);

    // Fetch updated command with includes
    const updatedCommand = await Commands.findByPk(id, {
      include: [
        { model: Medicines, as: 'medicine' },
        { model: Pharmacy, as: 'pharmacy', attributes: { exclude: ['password'] } }
      ]
    });

    res.json({
      success: true,
      message: 'Command updated successfully',
      data: updatedCommand
    });
  } catch (error) {
    console.error('Error updating command:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete command (pharmacy only, only if awaiting)
router.delete('/:id', requireRole('pharmacy'), async (req, res) => {
  try {
    const { id } = req.params;

    const command = await Commands.findByPk(id);
    if (!command) {
      return res.status(404).json({
        success: false,
        message: 'Command not found'
      });
    }

    if (command.pharmId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (command.state !== 'awaiting') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete command that is not in awaiting state'
      });
    }

    await command.destroy();

    res.json({
      success: true,
      message: 'Command deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting command:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
