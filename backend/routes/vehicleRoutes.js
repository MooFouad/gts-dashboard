const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { AppError } = require('../middleware/errorHandler');
const { blockGuestWrites } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createVehicleValidator,
  updateVehicleValidator,
  deleteVehicleValidator
} = require('../validators/vehicleValidator');
const guestSessionStore = require('../services/guestSessionStore');

// Block guest users from write operations (POST, PUT, DELETE)
router.use(blockGuestWrites);

// GET all vehicles
router.get('/', async (req, res, next) => {
  try {
    // Guest users - use session store (no database access)
    if (req.user && req.user.isGuest) {
      const vehicles = guestSessionStore.getVehicles(req.user._id);
      const formattedVehicles = vehicles.map(vehicle => ({
        ...vehicle,
        licenseExpiryDate: vehicle.licenseExpiryDate ?
          new Date(vehicle.licenseExpiryDate).toISOString().split('T')[0] : null,
        inspectionExpiryDate: vehicle.inspectionExpiryDate ?
          new Date(vehicle.inspectionExpiryDate).toISOString().split('T')[0] : null,
        istemarahIssueDate: vehicle.istemarahIssueDate ?
          new Date(vehicle.istemarahIssueDate).toISOString().split('T')[0] : null,
      }));

      return res.json({
        success: true,
        count: formattedVehicles.length,
        data: formattedVehicles,
        isDemo: true
      });
    }

    // Real user - fetch from database
    const vehicles = await Vehicle.find({})
      .lean()
      .maxTimeMS(5000)
      .exec();

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
      count: vehicles.length,
      data: formattedVehicles
    });
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('timed out')) {
      return next(new AppError('Database operation timed out. Please try again.', 503));
    }
    next(error);
  }
});

// GET single vehicle
router.get('/:id', async (req, res, next) => {
  try {
    // Guest users - use session store
    if (req.user && req.user.isGuest) {
      const vehicle = guestSessionStore.getVehicle(req.user._id, req.params.id);
      if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
      }
      return res.json({
        success: true,
        data: vehicle,
        isDemo: true
      });
    }

    // Real user - database
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
    // Guest users - add to session store only
    if (req.user && req.user.isGuest) {
      const vehicle = guestSessionStore.createVehicle(req.user._id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Vehicle created successfully (demo mode - not saved to database)',
        data: vehicle,
        isDemo: true
      });
    }

    // Real user - save to database
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
    // Guest users - update in session store only
    if (req.user && req.user.isGuest) {
      const vehicle = guestSessionStore.updateVehicle(req.user._id, req.params.id, req.body);
      if (!vehicle) {
        return next(new AppError('Vehicle not found', 404));
      }
      return res.json({
        success: true,
        message: 'Vehicle updated successfully (demo mode - not saved to database)',
        data: vehicle,
        isDemo: true
      });
    }

    // Real user - update in database
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
    // Guest users - delete from session store only
    if (req.user && req.user.isGuest) {
      const deleted = guestSessionStore.deleteVehicle(req.user._id, req.params.id);
      if (!deleted) {
        return next(new AppError('Vehicle not found', 404));
      }
      return res.json({
        success: true,
        message: 'Vehicle deleted successfully (demo mode - not removed from database)',
        data: { id: req.params.id },
        isDemo: true
      });
    }

    // Real user - delete from database
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

// GET count
router.get('/count/total', async (req, res, next) => {
  try {
    // Guest users - count from session
    if (req.user && req.user.isGuest) {
      const vehicles = guestSessionStore.getVehicles(req.user._id);
      return res.json({
        success: true,
        count: vehicles.length,
        isDemo: true
      });
    }

    // Real user - count from database
    const count = await Vehicle.countDocuments();
    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;