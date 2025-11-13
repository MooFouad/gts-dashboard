const express = require('express');
const router = express.Router();
const Insurance = require('../models/Insurance');
const { AppError } = require('../middleware/errorHandler');
const absherService = require('../services/absherService');

// Test Insurance API endpoint
router.get('/test-api', async (req, res, next) => {
  try {
    const { plateNumber, sequenceNumber } = req.query;

    if (!plateNumber && !sequenceNumber) {
      return next(new AppError('Please provide plateNumber or sequenceNumber', 400));
    }

    console.log('🧪 Testing Insurance API access...');
    console.log(`   Plate: ${plateNumber}`);
    console.log(`   Sequence: ${sequenceNumber}`);

    const insuranceData = await absherService.getVehicleInsuranceDetails(plateNumber, sequenceNumber);

    res.json({
      success: true,
      message: 'Insurance API is accessible!',
      data: insuranceData
    });

  } catch (error) {
    console.error('❌ Insurance API test failed:', error.message);

    let userMessage = error.message;
    let suggestions = [];

    if (error.response?.status === 401) {
      userMessage = 'Insurance API returned 401 Unauthorized';
      suggestions = [
        'Verify your Absher Business account has access to Vehicle Insurance Inquiry API',
        'Check if the Insurance Inquiry service is enabled in your Absher Business subscription',
        'Contact Absher Business support to enable the Insurance Inquiry API',
        'Verify your subscription key has access to this specific endpoint'
      ];
    }

    res.status(error.response?.status || 500).json({
      success: false,
      message: userMessage,
      error: error.response?.data || error.message,
      suggestions: suggestions
    });
  }
});

// GET count (MUST be before /:id to avoid route matching conflict)
router.get('/count/total', async (req, res, next) => {
  try {
    const count = await Insurance.countDocuments();
    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
});

// GET all insurance records
router.get('/', async (req, res, next) => {
  try {
    const insuranceRecords = await Insurance.find({})
      .lean()
      .maxTimeMS(5000)
      .exec();

    const formattedRecords = insuranceRecords.map(record => ({
      ...record,
      // Format all date fields
      policyStartDate: record.policyStartDate ?
        new Date(record.policyStartDate).toISOString().split('T')[0] : null,
      policyEndDate: record.policyEndDate ?
        new Date(record.policyEndDate).toISOString().split('T')[0] : null
    }));

    res.json({
      success: true,
      count: formattedRecords.length,
      data: formattedRecords
    });
  } catch (error) {
    next(error);
  }
});

// GET single insurance record by ID
router.get('/:id', async (req, res, next) => {
  try {
    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return next(new AppError('Insurance record not found', 404));
    }

    res.json({
      success: true,
      data: insurance
    });
  } catch (error) {
    next(error);
  }
});

// POST - Sync insurance data from Absher API (single vehicle)
router.post('/sync-from-api', async (req, res, next) => {
  try {
    const { plateNumber, sequenceNumber } = req.body;

    if (!plateNumber) {
      return next(new AppError('Plate number is required', 400));
    }

    console.log('🔄 Starting Insurance API sync for:', plateNumber);

    // Fetch insurance details from Absher API
    const insuranceData = await absherService.getVehicleInsuranceDetails(plateNumber, sequenceNumber);

    if (!insuranceData) {
      return next(new AppError('No data returned from Absher API', 500));
    }

    // Check if record already exists by plate number
    let existingRecord = await Insurance.findOne({ plateNumber: insuranceData.plateNumber });

    let record;
    if (existingRecord) {
      // Update existing record
      record = await Insurance.findByIdAndUpdate(
        existingRecord._id,
        {
          ...insuranceData,
          lastSyncDate: new Date(),
          dataSource: 'absher'
        },
        { new: true, runValidators: true }
      );
      console.log('✅ Updated existing insurance record:', plateNumber);
    } else {
      // Create new record
      record = await Insurance.create({
        ...insuranceData,
        lastSyncDate: new Date(),
        dataSource: 'absher'
      });
      console.log('✅ Created new insurance record:', plateNumber);
    }

    res.json({
      success: true,
      message: existingRecord ? 'Insurance record updated successfully' : 'Insurance record created successfully',
      data: record
    });

  } catch (error) {
    console.error('❌ Error syncing insurance data:', error);
    next(new AppError(`Failed to sync insurance data: ${error.message}`, 500));
  }
});

// POST - Bulk sync insurance data for ALL vehicles from Absher API
router.post('/bulk-sync-from-api', async (req, res, next) => {
  try {
    const Absher = require('../models/Absher');

    console.log('\n' + '🔄'.repeat(40));
    console.log('Starting BULK Insurance sync from Absher API...');
    console.log('🔄'.repeat(40));

    // Get all vehicles from Absher/Istemarah collection
    const allVehicles = await Absher.find({}).lean().maxTimeMS(10000).exec();
    console.log(`📋 Found ${allVehicles.length} vehicles in Absher database`);

    if (allVehicles.length === 0) {
      return res.json({
        success: true,
        message: 'No vehicles found to sync. Please sync Istemarah data first.',
        stats: {
          total: 0,
          success: 0,
          failed: 0,
          skipped: 0
        }
      });
    }

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each vehicle
    for (let i = 0; i < allVehicles.length; i++) {
      const vehicle = allVehicles[i];
      let plateNumber = vehicle.plateInfo || vehicle.plateNumber;
      const sequenceNumber = vehicle.sequenceNumber;

      if (!plateNumber) {
        console.log(`⏭️  [${i + 1}/${allVehicles.length}] Skipping vehicle (no plate number)`);
        skippedCount++;
        continue;
      }

      // If we have a sequence number, use it directly (more reliable)
      // Otherwise, convert plateInfo format "ألس_5876_3" to space-separated format "أ ل س 5876"
      if (!sequenceNumber && plateNumber.includes('_')) {
        const parts = plateNumber.split('_');
        const letters = parts[0] || '';
        const number = parts[1] || '';
        // Separate Arabic letters with spaces
        if (letters && /[\u0600-\u06FF]/.test(letters)) {
          const separated = letters.split('').join(' ');
          plateNumber = `${separated} ${number}`;
        }
      }

      try {
        if (sequenceNumber) {
          console.log(`🔍 [${i + 1}/${allVehicles.length}] Fetching insurance by sequence: ${sequenceNumber}`);
        } else {
          console.log(`🔍 [${i + 1}/${allVehicles.length}] Fetching insurance by plate: ${plateNumber}`);
        }

        // Fetch insurance details from Absher API
        // When using sequence number, plateNumber is ignored by the API but we pass it anyway
        const insuranceData = await absherService.getVehicleInsuranceDetails(plateNumber, sequenceNumber);

        if (insuranceData && insuranceData.insuranceCompanyName) {
          // Check if record already exists
          let existingRecord = await Insurance.findOne({ plateNumber: plateNumber });

          if (existingRecord) {
            // Update existing
            await Insurance.findByIdAndUpdate(
              existingRecord._id,
              {
                ...insuranceData,
                plateNumber: plateNumber,
                sequenceNumber: sequenceNumber,
                lastSyncDate: new Date(),
                dataSource: 'absher'
              },
              { new: true, runValidators: true }
            );
            console.log(`✅ [${i + 1}/${allVehicles.length}] Updated insurance for: ${plateNumber}`);
          } else {
            // Create new
            await Insurance.create({
              ...insuranceData,
              plateNumber: plateNumber,
              sequenceNumber: sequenceNumber,
              lastSyncDate: new Date(),
              dataSource: 'absher'
            });
            console.log(`✅ [${i + 1}/${allVehicles.length}] Created insurance for: ${plateNumber}`);
          }
          successCount++;
        } else {
          console.log(`⏭️  [${i + 1}/${allVehicles.length}] No insurance data found for: ${plateNumber}`);
          skippedCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        // Check for 500 errors with "No value present" (no data available)
        const isNoData = error.response?.status === 500 &&
                        (error.response?.data?.message?.en?.includes('No value present') ||
                         error.response?.data?.message?.ar?.includes('حدث خطأ'));

        if (isNoData) {
          console.log(`⏭️  [${i + 1}/${allVehicles.length}] No insurance data found for: ${plateNumber}`);
          skippedCount++;
          // Don't add to errors - this is normal for vehicles without insurance records
        } else {
          console.error(`❌ [${i + 1}/${allVehicles.length}] Error syncing ${plateNumber}:`, error.message);
          failedCount++;

          // Check for 401 errors (permission issues)
          if (error.response?.status === 401) {
            errors.push({
              plateNumber,
              error: '401 Unauthorized - API access denied',
              hint: 'Your Absher Business account may not have access to the Insurance Inquiry API'
            });

            // If we get 401 on first vehicle, stop the sync and return error
            if (i === 0) {
              console.error('\n❌ CRITICAL: 401 Unauthorized on first vehicle. Stopping sync.');
              console.error('   This indicates your account does not have access to the Insurance Inquiry API.');
              console.error('   Please enable this service in your Absher Business subscription.\n');

              return res.status(401).json({
                success: false,
                message: 'Insurance Inquiry API access denied',
                error: 'Your Absher Business account does not have permission to access the Vehicle Insurance Inquiry API',
                suggestions: [
                  'Log in to your Absher Business account at https://business.absher.sa',
                  'Verify that the "Vehicle Insurance Inquiry" service is enabled',
                  'Contact Absher Business support to activate this service',
                  'Check your subscription includes access to this API endpoint'
                ],
                stats: {
                  total: allVehicles.length,
                  success: 0,
                  failed: 1,
                  skipped: 0
                }
              });
            }
          } else {
            errors.push({ plateNumber, error: error.message });
          }
        }
      }
    }

    console.log('\n' + '✅'.repeat(40));
    console.log('Bulk Insurance Sync Complete!');
    console.log(`Total: ${allVehicles.length} | Success: ${successCount} | Failed: ${failedCount} | Skipped: ${skippedCount}`);
    console.log('✅'.repeat(40) + '\n');

    // Build response message
    let responseMessage;
    if (successCount > 0) {
      responseMessage = `Insurance sync completed successfully! ${successCount} vehicle(s) synced.`;
      if (skippedCount > 0) {
        responseMessage += ` ${skippedCount} vehicle(s) skipped (no insurance data available in system).`;
      }
    } else if (skippedCount === allVehicles.length) {
      responseMessage = 'No insurance data available for any vehicles. They may not have insurance records yet.';
    } else {
      const all401 = errors.every(e => e.error.includes('401'));
      responseMessage = all401 && failedCount === allVehicles.length
        ? 'All vehicles failed with 401 Unauthorized. Your account may not have access to the Insurance Inquiry API.'
        : 'Insurance sync completed with some failures.';
    }

    res.json({
      success: successCount > 0 || (skippedCount > 0 && failedCount === 0),
      message: responseMessage,
      stats: {
        total: allVehicles.length,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount
      },
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Only return first 5 errors
      note: skippedCount > 0 ? 'Some vehicles were skipped because they have no insurance records in the system' : undefined
    });

  } catch (error) {
    console.error('❌ Error in bulk insurance sync:', error);
    next(new AppError(`Failed to bulk sync insurance data: ${error.message}`, 500));
  }
});

// POST - Create new insurance record
router.post('/', async (req, res, next) => {
  try {
    const insurance = await Insurance.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Insurance record created successfully',
      data: insurance
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Insurance record with this plate number already exists', 400));
    }
    next(error);
  }
});

// PUT - Update insurance record
router.put('/:id', async (req, res, next) => {
  try {
    const insurance = await Insurance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!insurance) {
      return next(new AppError('Insurance record not found', 404));
    }

    res.json({
      success: true,
      message: 'Insurance record updated successfully',
      data: insurance
    });
  } catch (error) {
    next(error);
  }
});

// DELETE single insurance record
router.delete('/:id', async (req, res, next) => {
  try {
    const insurance = await Insurance.findByIdAndDelete(req.params.id);

    if (!insurance) {
      return next(new AppError('Insurance record not found', 404));
    }

    res.json({
      success: true,
      message: 'Insurance record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE multiple insurance records
router.post('/delete-multiple', async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Invalid or empty IDs array', 400));
    }

    const result = await Insurance.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} insurance record(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
