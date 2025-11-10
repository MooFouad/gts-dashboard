const express = require('express');
const router = express.Router();
const HomeRent = require('../models/HomeRent');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const {
  createHomeRentValidator,
  updateHomeRentValidator,
  deleteHomeRentValidator
} = require('../validators/homeRentValidator');

// GET all home rents
router.get('/', async (req, res, next) => {
  try {
    const homeRents = await HomeRent.find({}).lean();
    res.json({
      success: true,
      count: homeRents.length,
      data: homeRents
    });
  } catch (error) {
    next(error);
  }
});

// GET count (MUST be before /:id to avoid route matching conflict)
router.get('/count/total', async (req, res, next) => {
  try {
    const count = await HomeRent.countDocuments();
    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
});

// GET single home rent
router.get('/:id', async (req, res, next) => {
  try {
    const rent = await HomeRent.findById(req.params.id);
    if (!rent) {
      return next(new AppError('Home rent not found', 404));
    }
    res.json({
      success: true,
      data: rent
    });
  } catch (error) {
    next(error);
  }
});

// CREATE home rent
router.post('/', createHomeRentValidator, validate, async (req, res, next) => {
  try {
    const homeRent = new HomeRent(req.body);
    await homeRent.save();
    res.status(201).json({
      success: true,
      message: 'Home rent created successfully',
      data: homeRent
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE home rent
router.put('/:id', updateHomeRentValidator, validate, async (req, res, next) => {
  try {
    const existingRent = await HomeRent.findById(req.params.id);
    if (!existingRent) {
      return next(new AppError('Home rent not found', 404));
    }

    const rent = await HomeRent.findByIdAndUpdate(
      req.params.id,
      { ...req.body, _id: req.params.id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Home rent updated successfully',
      data: rent
    });
  } catch (error) {
    next(error);
  }
});

// DELETE home rent
router.delete('/:id', deleteHomeRentValidator, validate, async (req, res, next) => {
  try {
    const result = await HomeRent.findByIdAndDelete(req.params.id);
    if (!result) {
      return next(new AppError('Home rent not found', 404));
    }
    res.json({
      success: true,
      message: 'Home rent deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;