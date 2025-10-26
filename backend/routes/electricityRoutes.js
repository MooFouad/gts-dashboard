const express = require('express');
const router = express.Router();
const Electricity = require('../models/Electricity');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const {
  createElectricityValidator,
  updateElectricityValidator,
  deleteElectricityValidator
} = require('../validators/electricityValidator');

// GET all electricity bills
router.get('/', async (req, res, next) => {
  try {
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