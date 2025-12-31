const express = require('express');
const router = express.Router();
const MVPI = require('../models/MVPI');
const { AppError } = require('../middleware/errorHandler');
const absherService = require('../services/absherService');

// Test MVPI API endpoint
router.get('/test-api', async (req, res, next) => {
  try {
    const { plateNumber, sequenceNumber } = req.query;

    if (!plateNumber && !sequenceNumber) {
      return next(new AppError('Please provide plateNumber or sequenceNumber', 400));
    }

    console.log('🧪 Testing MVPI API access...');
    console.log(`   Plate: ${plateNumber}`);
    console.log(`   Sequence: ${sequenceNumber}`);

    const mvpiData = await absherService.getMVPIDetails(plateNumber, sequenceNumber);

    res.json({
      success: true,
      message: 'MVPI API is accessible!',
      data: mvpiData
    });

  } catch (error) {
    console.error('❌ MVPI API test failed:', error.message);

    let userMessage = error.message;
    let suggestions = [];

    if (error.response?.status === 401) {
      userMessage = 'MVPI API returned 401 Unauthorized';
      suggestions = [
        'Verify your Absher Business account has access to MVPI (Motor Vehicle Periodic Inspection) API',
        'Check if the MVPI Inquiry service is enabled in your Absher Business subscription',
        'Contact Absher Business support to enable the MVPI Inquiry API',
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
    const count = await MVPI.countDocuments();
    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
});

// GET all MVPI records with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 25, search } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { sequenceNumber: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } }
      ];
    }

    const mvpiRecords = await MVPI.find(query)
      .sort({ inspectionExpiryDate: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean()
      .maxTimeMS(10000)
      .exec();

    const total = await MVPI.countDocuments(query).maxTimeMS(5000);

    const formattedRecords = mvpiRecords.map(record => ({
      ...record,
      // Format all date fields
      inspectionDate: record.inspectionDate ?
        new Date(record.inspectionDate).toISOString().split('T')[0] : null,
      inspectionExpiryDate: record.inspectionExpiryDate ?
        new Date(record.inspectionExpiryDate).toISOString().split('T')[0] : null
    }));

    res.json({
      success: true,
      data: formattedRecords,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET single MVPI record by ID
router.get('/:id', async (req, res, next) => {
  try {
    const mvpi = await MVPI.findById(req.params.id);

    if (!mvpi) {
      return next(new AppError('MVPI record not found', 404));
    }

    res.json({
      success: true,
      data: mvpi
    });
  } catch (error) {
    next(error);
  }
});

// POST - Sync MVPI data from Absher API (single vehicle)
router.post('/sync-from-api', async (req, res, next) => {
  try {
    const { plateNumber, sequenceNumber } = req.body;

    if (!plateNumber) {
      return next(new AppError('Plate number is required', 400));
    }

    console.log('🔄 Starting MVPI API sync for:', plateNumber);

    // Fetch MVPI details from Absher API
    const mvpiResponse = await absherService.getMVPIDetails(plateNumber, sequenceNumber);

    if (!mvpiResponse) {
      return next(new AppError('No data returned from Absher API', 500));
    }

    // Parse MVPI response data
    // The API returns raw data, so we need to extract the relevant fields
    const mvpiData = {
      plateNumber: plateNumber,
      sequenceNumber: sequenceNumber || null,
      inspectionReportNumber: mvpiResponse.reportNumber || mvpiResponse.inspectionReportNumber || null,
      inspectionCenterName: mvpiResponse.centerName || mvpiResponse.inspectionCenterName || null,
      inspectionDate: mvpiResponse.inspectionDate || mvpiResponse.date || null,
      inspectionExpiryDate: mvpiResponse.expiryDate || mvpiResponse.inspectionExpiryDate || null,
      inspectionResult: mvpiResponse.result || mvpiResponse.inspectionResult || null,
      inspectionStatus: mvpiResponse.status || mvpiResponse.inspectionStatus || null,
      maker: mvpiResponse.maker || mvpiResponse.vehicleMaker || null,
      model: mvpiResponse.model || mvpiResponse.vehicleModel || null,
      modelYear: mvpiResponse.modelYear || mvpiResponse.year || null,
      color: mvpiResponse.color || mvpiResponse.vehicleColor || null,
      odometerReading: mvpiResponse.odometerReading || mvpiResponse.mileage || null,
      inspectorName: mvpiResponse.inspectorName || mvpiResponse.inspector || null,
      inspectionFee: mvpiResponse.fee || mvpiResponse.inspectionFee || null,
      notes: mvpiResponse.notes || mvpiResponse.remarks || null
    };

    // Check if record already exists by plate number
    let existingRecord = await MVPI.findOne({ plateNumber: plateNumber });

    let record;
    if (existingRecord) {
      // Update existing record
      record = await MVPI.findByIdAndUpdate(
        existingRecord._id,
        {
          ...mvpiData,
          lastSyncDate: new Date(),
          dataSource: 'absher'
        },
        { new: true, runValidators: true }
      );
      console.log('✅ Updated existing MVPI record:', plateNumber);
    } else {
      // Create new record
      record = await MVPI.create({
        ...mvpiData,
        lastSyncDate: new Date(),
        dataSource: 'absher'
      });
      console.log('✅ Created new MVPI record:', plateNumber);
    }

    res.json({
      success: true,
      message: existingRecord ? 'MVPI record updated successfully' : 'MVPI record created successfully',
      data: record
    });

  } catch (error) {
    console.error('❌ Error syncing MVPI data:', error);
    next(new AppError(`Failed to sync MVPI data: ${error.message}`, 500));
  }
});

// POST - Bulk sync MVPI data for ALL vehicles from Absher API
router.post('/bulk-sync-from-api', async (req, res, next) => {
  try {
    const Absher = require('../models/Absher');

    console.log('\n' + '🔄'.repeat(40));
    console.log('Starting BULK MVPI sync from Absher API...');
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
          console.log(`🔍 [${i + 1}/${allVehicles.length}] Fetching MVPI by sequence: ${sequenceNumber}`);
        } else {
          console.log(`🔍 [${i + 1}/${allVehicles.length}] Fetching MVPI by plate: ${plateNumber}`);
        }

        // Fetch MVPI details from Absher API
        // When using sequence number, plateNumber is ignored by the API but we pass it anyway
        const mvpiResponse = await absherService.getMVPIDetails(plateNumber, sequenceNumber);

        if (mvpiResponse) {
          // Parse MVPI response data
          const mvpiData = {
            plateNumber: plateNumber,
            sequenceNumber: sequenceNumber || null,
            inspectionReportNumber: mvpiResponse.reportNumber || mvpiResponse.inspectionReportNumber || null,
            inspectionCenterName: mvpiResponse.centerName || mvpiResponse.inspectionCenterName || null,
            inspectionDate: mvpiResponse.inspectionDate || mvpiResponse.date || null,
            inspectionExpiryDate: mvpiResponse.expiryDate || mvpiResponse.inspectionExpiryDate || null,
            inspectionResult: mvpiResponse.result || mvpiResponse.inspectionResult || null,
            inspectionStatus: mvpiResponse.status || mvpiResponse.inspectionStatus || null,
            maker: mvpiResponse.maker || mvpiResponse.vehicleMaker || null,
            model: mvpiResponse.model || mvpiResponse.vehicleModel || null,
            modelYear: mvpiResponse.modelYear || mvpiResponse.year || null,
            color: mvpiResponse.color || mvpiResponse.vehicleColor || null,
            odometerReading: mvpiResponse.odometerReading || mvpiResponse.mileage || null,
            inspectorName: mvpiResponse.inspectorName || mvpiResponse.inspector || null,
            inspectionFee: mvpiResponse.fee || mvpiResponse.inspectionFee || null,
            notes: mvpiResponse.notes || mvpiResponse.remarks || null
          };

          // Check if record already exists
          let existingRecord = await MVPI.findOne({ plateNumber: plateNumber });

          if (existingRecord) {
            // Update existing
            await MVPI.findByIdAndUpdate(
              existingRecord._id,
              {
                ...mvpiData,
                lastSyncDate: new Date(),
                dataSource: 'absher'
              },
              { new: true, runValidators: true }
            );
            console.log(`✅ [${i + 1}/${allVehicles.length}] Updated MVPI for: ${plateNumber}`);
          } else {
            // Create new
            await MVPI.create({
              ...mvpiData,
              lastSyncDate: new Date(),
              dataSource: 'absher'
            });
            console.log(`✅ [${i + 1}/${allVehicles.length}] Created MVPI for: ${plateNumber}`);
          }
          successCount++;
        } else {
          console.log(`⏭️  [${i + 1}/${allVehicles.length}] No MVPI data found for: ${plateNumber}`);
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
          console.log(`⏭️  [${i + 1}/${allVehicles.length}] No MVPI data found for: ${plateNumber}`);
          skippedCount++;
          // Don't add to errors - this is normal for vehicles without inspection records
        } else {
          console.error(`❌ [${i + 1}/${allVehicles.length}] Error syncing ${plateNumber}:`, error.message);
          failedCount++;

          // Check for 401 errors (permission issues)
          if (error.response?.status === 401) {
            errors.push({
              plateNumber,
              error: '401 Unauthorized - API access denied',
              hint: 'Your Absher Business account may not have access to the MVPI Inquiry API'
            });

            // If we get 401 on first vehicle, stop the sync and return error
            if (i === 0) {
              console.error('\n❌ CRITICAL: 401 Unauthorized on first vehicle. Stopping sync.');
              console.error('   This indicates your account does not have access to the MVPI Inquiry API.');
              console.error('   Please enable this service in your Absher Business subscription.\n');

              return res.status(401).json({
                success: false,
                message: 'MVPI Inquiry API access denied',
                error: 'Your Absher Business account does not have permission to access the MVPI (Vehicle Inspection) Inquiry API',
                suggestions: [
                  'Log in to your Absher Business account at https://business.absher.sa',
                  'Verify that the "MVPI Inquiry" or "Vehicle Inspection Inquiry" service is enabled',
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
    console.log('Bulk MVPI Sync Complete!');
    console.log(`Total: ${allVehicles.length} | Success: ${successCount} | Failed: ${failedCount} | Skipped: ${skippedCount}`);
    console.log('✅'.repeat(40) + '\n');

    // Build response message
    let responseMessage;
    if (successCount > 0) {
      responseMessage = `MVPI sync completed successfully! ${successCount} vehicle(s) synced.`;
      if (skippedCount > 0) {
        responseMessage += ` ${skippedCount} vehicle(s) skipped (no inspection data available in system).`;
      }
    } else if (skippedCount === allVehicles.length) {
      responseMessage = 'No MVPI data available for any vehicles. They may not have inspection records yet.';
    } else {
      const all401 = errors.every(e => e.error.includes('401'));
      responseMessage = all401 && failedCount === allVehicles.length
        ? 'All vehicles failed with 401 Unauthorized. Your account may not have access to the MVPI Inquiry API.'
        : 'MVPI sync completed with some failures.';
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
      note: skippedCount > 0 ? 'Some vehicles were skipped because they have no inspection records in the MVPI system' : undefined
    });

  } catch (error) {
    console.error('❌ Error in bulk MVPI sync:', error);
    next(new AppError(`Failed to bulk sync MVPI data: ${error.message}`, 500));
  }
});

// POST - Create new MVPI record
router.post('/', async (req, res, next) => {
  try {
    const mvpi = await MVPI.create(req.body);

    res.status(201).json({
      success: true,
      message: 'MVPI record created successfully',
      data: mvpi
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('MVPI record with this plate number already exists', 400));
    }
    next(error);
  }
});

// PUT - Update MVPI record
router.put('/:id', async (req, res, next) => {
  try {
    const mvpi = await MVPI.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!mvpi) {
      return next(new AppError('MVPI record not found', 404));
    }

    res.json({
      success: true,
      message: 'MVPI record updated successfully',
      data: mvpi
    });
  } catch (error) {
    next(error);
  }
});

// DELETE single MVPI record
router.delete('/:id', async (req, res, next) => {
  try {
    const mvpi = await MVPI.findByIdAndDelete(req.params.id);

    if (!mvpi) {
      return next(new AppError('MVPI record not found', 404));
    }

    res.json({
      success: true,
      message: 'MVPI record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE multiple MVPI records
router.post('/delete-multiple', async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Invalid or empty IDs array', 400));
    }

    const result = await MVPI.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} MVPI record(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
