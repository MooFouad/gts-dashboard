const express = require('express');
const router = express.Router();
const SocialInsurance = require('../models/SocialInsurance');
const { AppError } = require('../middleware/errorHandler');

// GET count (MUST come before /:id route)
router.get('/count/total', async (req, res, next) => {
  try {
    const count = await SocialInsurance.countDocuments();
    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
});

// GET all social insurance records
router.get('/', async (req, res, next) => {
  try {
    const records = await SocialInsurance.find({})
      .sort({ endDate: 1 }) // Sort by end date (soonest to expire first)
      .lean()
      .maxTimeMS(5000)
      .exec();

    // Format dates and add remainingDays to each record
    const formattedRecords = records.map(record => {
      // Calculate remaining days
      let remainingDays = null;
      if (record.endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(record.endDate);
        end.setHours(0, 0, 0, 0);
        const diffTime = end - today;
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        ...record,
        startDate: record.startDate ? new Date(record.startDate).toISOString().split('T')[0] : null,
        endDate: record.endDate ? new Date(record.endDate).toISOString().split('T')[0] : null,
        remainingDays: remainingDays
      };
    });

    res.json({
      success: true,
      count: records.length,
      data: formattedRecords
    });
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('timed out')) {
      return next(new AppError('Database operation timed out. Please try again.', 503));
    }
    next(error);
  }
});

// GET single social insurance record
router.get('/:id', async (req, res, next) => {
  try {
    const record = await SocialInsurance.findById(req.params.id);
    if (!record) {
      return next(new AppError('Social insurance record not found', 404));
    }
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
});

// CREATE social insurance record
router.post('/', async (req, res, next) => {
  try {
    const record = new SocialInsurance(req.body);
    await record.save();
    res.status(201).json({
      success: true,
      message: 'Social insurance record created successfully',
      data: record
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Duplicate ID - record already exists', 400));
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join(', '), 400));
    }
    next(error);
  }
});

// UPDATE social insurance record
router.put('/:id', async (req, res, next) => {
  try {
    const existingRecord = await SocialInsurance.findById(req.params.id);
    if (!existingRecord) {
      return next(new AppError('Social insurance record not found', 404));
    }

    const record = await SocialInsurance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, _id: req.params.id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Social insurance record updated successfully',
      data: record
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Duplicate ID - another record with this ID exists', 400));
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join(', '), 400));
    }
    next(error);
  }
});

// DELETE social insurance record
router.delete('/:id', async (req, res, next) => {
  try {
    const record = await SocialInsurance.findByIdAndDelete(req.params.id);
    if (!record) {
      return next(new AppError('Social insurance record not found', 404));
    }
    res.json({
      success: true,
      message: 'Social insurance record deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
});

// BULK DELETE social insurance records
router.post('/bulk-delete', async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Array of IDs is required', 400));
    }

    const result = await SocialInsurance.deleteMany({
      _id: { $in: ids }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} record(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
