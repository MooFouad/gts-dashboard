const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const {
  createVehicleValidator,
  updateVehicleValidator,
  deleteVehicleValidator
} = require('../validators/vehicleValidator');

// GET all vehicles with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query)
      .sort({ licenseExpiryDate: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean()
      .maxTimeMS(10000)
      .exec();

    const total = await Vehicle.countDocuments(query).maxTimeMS(5000);

    const formattedVehicles = vehicles.map(vehicle => ({
      ...vehicle,
      licenseExpiryDate: vehicle.licenseExpiryDate ?
        new Date(vehicle.licenseExpiryDate).toISOString().split('T')[0] : null,
      inspectionExpiryDate: vehicle.inspectionExpiryDate ?
        new Date(vehicle.inspectionExpiryDate).toISOString().split('T')[0] : null,
      istemarahIssueDate: vehicle.istemarahIssueDate ?
        new Date(vehicle.istemarahIssueDate).toISOString().split('T')[0] : null,
    }));

    res.json({
      success: true,
      data: formattedVehicles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('timed out')) {
      return next(new AppError('Database operation timed out. Please try again.', 503));
    }
    next(error);
  }
});

// GET count (MUST be before /:id to avoid route matching conflict)
router.get('/count/total', async (req, res, next) => {
  try {
    const count = await Vehicle.countDocuments();
    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
});

// GET single vehicle
router.get('/:id', async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
});

// CREATE vehicle
router.post('/', createVehicleValidator, validate, async (req, res, next) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE vehicle
router.put('/:id', updateVehicleValidator, validate, async (req, res, next) => {
  try {
    const existingVehicle = await Vehicle.findById(req.params.id);
    if (!existingVehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { ...req.body, _id: req.params.id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
});

// DELETE vehicle
router.delete('/:id', deleteVehicleValidator, validate, async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }
    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;