const express = require('express');
const router = express.Router();
const Electricity = require('../models/Electricity');
const { AppError } = require('../middleware/errorHandler');
const { blockGuestWrites } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createElectricityValidator,
  updateElectricityValidator,
  deleteElectricityValidator
} = require('../validators/electricityValidator');
const guestSessionStore = require('../services/guestSessionStore');

// Block guest users from write operations (POST, PUT, DELETE)
router.use(blockGuestWrites);

// GET all electricity bills
router.get('/', async (req, res, next) => {
  try {
    // Guest users - use session store (no database access)
    if (req.user && req.user.isGuest) {
      const bills = guestSessionStore.getElectricity(req.user._id);
      return res.json({
        success: true,
        count: bills.length,
        data: bills,
        isDemo: true
      });
    }

    // Real user - fetch from database
    const bills = await Electricity.find({}).sort({ createdAt: 1 });
    res.json({
      success: true,
      count: bills.length,
      data: bills
    });
  } catch (error) {
    next(error);
  }
});

// GET single electricity bill
router.get('/:id', async (req, res, next) => {
  try {
    // Guest users - use session store
    if (req.user && req.user.isGuest) {
      const bill = guestSessionStore.getElectricityBill(req.user._id, req.params.id);
      if (!bill) {
        return next(new AppError('Electricity bill not found', 404));
      }
      return res.json({
        success: true,
        data: bill,
        isDemo: true
      });
    }

    // Real user - database
    const bill = await Electricity.findById(req.params.id);
    if (!bill) {
      return next(new AppError('Electricity bill not found', 404));
    }
    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    next(error);
  }
});

// CREATE electricity bill
router.post('/', createElectricityValidator, validate, async (req, res, next) => {
  try {
    // Auto-calculate consumption if not provided
    if (!req.body.consumption && req.body.currentReading && req.body.previousReading) {
      req.body.consumption = req.body.currentReading - req.body.previousReading;
    }

    // Check consumption alert
    if (req.body.alertThreshold && req.body.consumption > req.body.alertThreshold) {
      req.body.consumptionAlert = true;
    }

    // Guest users - add to session store only
    if (req.user && req.user.isGuest) {
      const bill = guestSessionStore.createElectricityBill(req.user._id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Electricity bill created successfully (demo mode - not saved to database)',
        data: bill,
        isDemo: true
      });
    }

    // Real user - save to database
    const bill = new Electricity(req.body);
    await bill.save();
    res.status(201).json({
      success: true,
      message: 'Electricity bill created successfully',
      data: bill
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE electricity bill
router.put('/:id', updateElectricityValidator, validate, async (req, res, next) => {
  try {
    // Auto-calculate consumption if readings are updated
    if (req.body.currentReading && req.body.previousReading) {
      req.body.consumption = req.body.currentReading - req.body.previousReading;
    }

    // Check consumption alert
    if (req.body.alertThreshold && req.body.consumption > req.body.alertThreshold) {
      req.body.consumptionAlert = true;
    } else {
      req.body.consumptionAlert = false;
    }

    // Guest users - update in session store only
    if (req.user && req.user.isGuest) {
      const bill = guestSessionStore.updateElectricityBill(req.user._id, req.params.id, req.body);
      if (!bill) {
        return next(new AppError('Electricity bill not found', 404));
      }
      return res.json({
        success: true,
        message: 'Electricity bill updated successfully (demo mode - not saved to database)',
        data: bill,
        isDemo: true
      });
    }

    // Real user - update in database
    const bill = await Electricity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bill) {
      return next(new AppError('Electricity bill not found', 404));
    }

    res.json({
      success: true,
      message: 'Electricity bill updated successfully',
      data: bill
    });
  } catch (error) {
    next(error);
  }
});

// DELETE electricity bill
router.delete('/:id', deleteElectricityValidator, validate, async (req, res, next) => {
  try {
    // Guest users - delete from session store only
    if (req.user && req.user.isGuest) {
      const deleted = guestSessionStore.deleteElectricityBill(req.user._id, req.params.id);
      if (!deleted) {
        return next(new AppError('Electricity bill not found', 404));
      }
      return res.json({
        success: true,
        message: 'Electricity bill deleted successfully (demo mode - not removed from database)',
        data: { id: req.params.id },
        isDemo: true
      });
    }

    // Real user - delete from database
    const bill = await Electricity.findByIdAndDelete(req.params.id);
    if (!bill) {
      return next(new AppError('Electricity bill not found', 404));
    }
    res.json({
      success: true,
      message: 'Electricity bill deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
});

// GET count
router.get('/count/total', async (req, res, next) => {
  try {
    // Guest users - count from session
    if (req.user && req.user.isGuest) {
      const bills = guestSessionStore.getElectricity(req.user._id);
      return res.json({
        success: true,
        count: bills.length,
        isDemo: true
      });
    }

    // Real user - count from database
    const count = await Electricity.countDocuments();
    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;