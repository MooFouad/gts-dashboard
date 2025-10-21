const express = require('express');
const router = express.Router();
const HomeRent = require('../models/HomeRent');
const { AppError } = require('../middleware/errorHandler');
const { blockGuestWrites } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createHomeRentValidator,
  updateHomeRentValidator,
  deleteHomeRentValidator
} = require('../validators/homeRentValidator');
const guestSessionStore = require('../services/guestSessionStore');

// Block guest users from write operations (POST, PUT, DELETE)
router.use(blockGuestWrites);

// GET all home rents
router.get('/', async (req, res, next) => {
  try {
    // Guest users - use session store (no database access)
    if (req.user && req.user.isGuest) {
      const homeRents = guestSessionStore.getHomeRents(req.user._id);
      return res.json({
        success: true,
        count: homeRents.length,
        data: homeRents,
        isDemo: true
      });
    }

    // Real user - fetch from database
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

// GET single home rent
router.get('/:id', async (req, res, next) => {
  try {
    // Guest users - use session store
    if (req.user && req.user.isGuest) {
      const rent = guestSessionStore.getHomeRent(req.user._id, req.params.id);
      if (!rent) {
        return next(new AppError('Home rent not found', 404));
      }
      return res.json({
        success: true,
        data: rent,
        isDemo: true
      });
    }

    // Real user - database
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
    // Guest users - add to session store only
    if (req.user && req.user.isGuest) {
      const homeRent = guestSessionStore.createHomeRent(req.user._id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Home rent created successfully (demo mode - not saved to database)',
        data: homeRent,
        isDemo: true
      });
    }

    // Real user - save to database
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
    // Guest users - update in session store only
    if (req.user && req.user.isGuest) {
      const rent = guestSessionStore.updateHomeRent(req.user._id, req.params.id, req.body);
      if (!rent) {
        return next(new AppError('Home rent not found', 404));
      }
      return res.json({
        success: true,
        message: 'Home rent updated successfully (demo mode - not saved to database)',
        data: rent,
        isDemo: true
      });
    }

    // Real user - update in database
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
    // Guest users - delete from session store only
    if (req.user && req.user.isGuest) {
      const deleted = guestSessionStore.deleteHomeRent(req.user._id, req.params.id);
      if (!deleted) {
        return next(new AppError('Home rent not found', 404));
      }
      return res.json({
        success: true,
        message: 'Home rent deleted successfully (demo mode - not removed from database)',
        data: { id: req.params.id },
        isDemo: true
      });
    }

    // Real user - delete from database
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