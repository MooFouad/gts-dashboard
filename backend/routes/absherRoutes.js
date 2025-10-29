const express = require('express');
const router = express.Router();
const Absher = require('../models/Absher');
const { AppError } = require('../middleware/errorHandler');
const absherService = require('../services/absherService');

// GET all absher records
router.get('/', async (req, res, next) => {
  try {
    const absherRecords = await Absher.find({})
      .lean()
      .maxTimeMS(5000)
      .exec();

    const formattedRecords = absherRecords.map(record => ({
      ...record,
      issueDate: record.issueDate ?
        new Date(record.issueDate).toISOString().split('T')[0] : null,
      expiryDate: record.expiryDate ?
        new Date(record.expiryDate).toISOString().split('T')[0] : null,
      inspectionExpiryDate: record.inspectionExpiryDate ?
        new Date(record.inspectionExpiryDate).toISOString().split('T')[0] : null,
      licenseExpiryDate: record.licenseExpiryDate ?
        new Date(record.licenseExpiryDate).toISOString().split('T')[0] : null,
    }));

    res.json({
      success: true,
      count: absherRecords.length,
      data: formattedRecords
    });
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('timed out')) {
      return next(new AppError('Database operation timed out. Please try again.', 503));
    }
    next(error);
  }
});

// GET single absher record
router.get('/:id', async (req, res, next) => {
  try {
    const record = await Absher.findById(req.params.id);
    if (!record) {
      return next(new AppError('Absher record not found', 404));
    }
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
});

// CREATE absher record
router.post('/', async (req, res, next) => {
  try {
    const record = new Absher(req.body);
    await record.save();
    res.status(201).json({
      success: true,
      message: 'Absher record created successfully',
      data: record
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Duplicate reference number', 400));
    }
    next(error);
  }
});

// UPDATE absher record
router.put('/:id', async (req, res, next) => {
  try {
    const existingRecord = await Absher.findById(req.params.id);
    if (!existingRecord) {
      return next(new AppError('Absher record not found', 404));
    }

    const record = await Absher.findByIdAndUpdate(
      req.params.id,
      { ...req.body, _id: req.params.id },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Absher record updated successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
});

// DELETE absher record
router.delete('/:id', async (req, res, next) => {
  try {
    const record = await Absher.findByIdAndDelete(req.params.id);
    if (!record) {
      return next(new AppError('Absher record not found', 404));
    }
    res.json({
      success: true,
      message: 'Absher record deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
});

// GET count
router.get('/count/total', async (req, res, next) => {
  try {
    const count = await Absher.countDocuments();
    res.json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
});

// BULK SYNC ALL vehicles from Absher API (Government Data)
router.post('/bulk-sync-from-api', async (req, res, next) => {
  try {
    console.log('🔄 Starting bulk sync from Absher API...');

    // Import Vehicle model
    const Vehicle = require('../models/Vehicle');

    // Fetch all vehicles
    const vehicles = await Vehicle.find({}).lean();
    console.log(`📊 Found ${vehicles.length} vehicles to sync from API`);

    if (vehicles.length === 0) {
      return res.json({
        success: true,
        message: 'No vehicles found to sync',
        data: {
          synced: 0,
          updated: 0,
          created: 0,
          skipped: 0,
          failed: 0,
          errors: []
        }
      });
    }

    let synced = 0;
    let updated = 0;
    let created = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];
    const results = [];

    // Process each vehicle
    for (const vehicle of vehicles) {
      try {
        // Skip if no plate number
        if (!vehicle.plateNumber) {
          console.log(`⏭️  Skipping vehicle without plate number: ${vehicle._id}`);
          skipped++;
          continue;
        }

        console.log(`\n🔍 Fetching data for: ${vehicle.plateNumber}`);

        // Fetch insurance details from Absher API
        let insuranceData = null;
        try {
          insuranceData = await absherService.getVehicleInsuranceDetails(
            vehicle.plateNumber,
            vehicle.sequenceNumber
          );
          console.log(`✅ Got insurance data for ${vehicle.plateNumber}`);
        } catch (error) {
          console.log(`⚠️  Could not fetch insurance for ${vehicle.plateNumber}: ${error.message}`);
        }

        // Fetch MVPI details from Absher API
        let mvpiData = null;
        try {
          mvpiData = await absherService.getMVPIDetails(
            vehicle.plateNumber,
            vehicle.sequenceNumber
          );
          console.log(`✅ Got MVPI data for ${vehicle.plateNumber}`);
        } catch (error) {
          console.log(`⚠️  Could not fetch MVPI for ${vehicle.plateNumber}: ${error.message}`);
        }

        // Skip if no data fetched from API
        if (!insuranceData && !mvpiData) {
          console.log(`❌ No data available from API for ${vehicle.plateNumber}`);
          failed++;
          errors.push({
            plateNumber: vehicle.plateNumber,
            error: 'No data returned from Absher API'
          });
          continue;
        }

        // Check if Absher record already exists
        let absherRecord = await Absher.findOne({ plateNumber: vehicle.plateNumber });

        // Prepare Absher data from API response
        const absherData = {
          plateNumber: vehicle.plateNumber,
          name: vehicle.actualDriverName || vehicle.plateNumber,
          referenceNumber: vehicle.sequenceNumber || vehicle.plateNumber,

          // From Insurance API
          expiryDate: insuranceData?.insuranceExpiryDate || null,
          ownerName: vehicle.actualDriverName || '',
          ownerId: vehicle.actualDriverId || '',

          // From MVPI API
          inspectionExpiryDate: mvpiData?.mvpiExpiryDate || null,

          // Keep vehicle's license expiry if available
          licenseExpiryDate: vehicle.licenseExpiryDate || null,

          notes: `Synced from Absher API - ${vehicle.vehicleMaker || ''} ${vehicle.vehicleModel || ''} ${vehicle.modelYear || ''}`.trim(),
          dataSource: 'absher',
          lastSyncDate: new Date()
        };

        if (absherRecord) {
          // Update existing record
          absherRecord = await Absher.findByIdAndUpdate(
            absherRecord._id,
            absherData,
            { new: true, runValidators: true }
          );
          console.log(`✅ Updated: ${vehicle.plateNumber}`);
          updated++;
        } else {
          // Create new record
          absherRecord = new Absher(absherData);
          await absherRecord.save();
          console.log(`✅ Created: ${vehicle.plateNumber}`);
          created++;
        }

        synced++;
        results.push({
          plateNumber: vehicle.plateNumber,
          status: 'success',
          hasInsurance: !!insuranceData,
          hasMVPI: !!mvpiData
        });

        // Add small delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

      } catch (error) {
        console.error(`❌ Error syncing vehicle ${vehicle.plateNumber}:`, error.message);
        failed++;
        errors.push({
          plateNumber: vehicle.plateNumber,
          error: error.message
        });
      }
    }

    console.log(`\n✅ Bulk API sync complete:`);
    console.log(`   Total vehicles: ${vehicles.length}`);
    console.log(`   Successfully synced: ${synced}`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Errors: ${errors.length}`);

    res.json({
      success: true,
      message: `Successfully synced ${synced} vehicles from Absher API`,
      data: {
        total: vehicles.length,
        synced,
        updated,
        created,
        skipped,
        failed,
        errors,
        results
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk API sync:', error);
    next(new AppError(`Bulk API sync failed: ${error.message}`, 500));
  }
});

// SYNC ALL vehicles from Vehicles collection to Absher
router.post('/sync-all-from-vehicles', async (req, res, next) => {
  try {
    console.log('🔄 Starting bulk sync from Vehicles collection to Absher...');

    // Import Vehicle model
    const Vehicle = require('../models/Vehicle');

    // Fetch all vehicles
    const vehicles = await Vehicle.find({}).lean();
    console.log(`📊 Found ${vehicles.length} vehicles to sync`);

    if (vehicles.length === 0) {
      return res.json({
        success: true,
        message: 'No vehicles found to sync',
        data: {
          synced: 0,
          updated: 0,
          created: 0,
          skipped: 0,
          errors: []
        }
      });
    }

    let synced = 0;
    let updated = 0;
    let created = 0;
    let skipped = 0;
    const errors = [];

    // Process each vehicle
    for (const vehicle of vehicles) {
      try {
        // Skip if no plate number
        if (!vehicle.plateNumber) {
          console.log(`⏭️  Skipping vehicle without plate number: ${vehicle._id}`);
          skipped++;
          continue;
        }

        // Check if Absher record already exists
        let absherRecord = await Absher.findOne({ plateNumber: vehicle.plateNumber });

        const absherData = {
          plateNumber: vehicle.plateNumber,
          name: vehicle.actualDriverName || vehicle.plateNumber,
          referenceNumber: vehicle.sequenceNumber || vehicle.plateNumber,
          issueDate: vehicle.registrationDate || null,
          expiryDate: vehicle.insuranceExpiryDate || null,
          inspectionExpiryDate: vehicle.inspectionExpiryDate || null,
          licenseExpiryDate: vehicle.licenseExpiryDate || null,
          ownerName: vehicle.actualDriverName || '',
          ownerId: vehicle.actualDriverId || '',
          notes: `Synced from Vehicles - ${vehicle.vehicleMaker} ${vehicle.vehicleModel} ${vehicle.modelYear || ''}`,
          dataSource: 'vehicles',
          lastSyncDate: new Date()
        };

        if (absherRecord) {
          // Update existing record
          absherRecord = await Absher.findByIdAndUpdate(
            absherRecord._id,
            absherData,
            { new: true, runValidators: true }
          );
          console.log(`✅ Updated: ${vehicle.plateNumber}`);
          updated++;
        } else {
          // Create new record
          absherRecord = new Absher(absherData);
          await absherRecord.save();
          console.log(`✅ Created: ${vehicle.plateNumber}`);
          created++;
        }

        synced++;

      } catch (error) {
        console.error(`❌ Error syncing vehicle ${vehicle.plateNumber}:`, error.message);
        errors.push({
          plateNumber: vehicle.plateNumber,
          error: error.message
        });
      }
    }

    console.log(`\n✅ Bulk sync complete:`);
    console.log(`   Total processed: ${synced}/${vehicles.length}`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors.length}`);

    res.json({
      success: true,
      message: `Successfully synced ${synced} vehicles to Absher`,
      data: {
        total: vehicles.length,
        synced,
        updated,
        created,
        skipped,
        errors
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk sync:', error);
    next(new AppError(`Bulk sync failed: ${error.message}`, 500));
  }
});

// SYNC vehicle insurance details from Absher API
router.post('/sync', async (req, res, next) => {
  try {
    const { plateNumber, sequenceNumber, referenceNumber, name } = req.body;

    if (!plateNumber) {
      return next(new AppError('Plate number is required', 400));
    }

    console.log('🔄 Starting Absher API sync for:', plateNumber);

    // Fetch insurance details from Absher API
    const insuranceData = await absherService.getVehicleInsuranceDetails(plateNumber, sequenceNumber);

    if (!insuranceData) {
      return next(new AppError('No data returned from Absher API', 500));
    }

    // Check if record already exists by plate number
    let existingRecord = await Absher.findOne({ plateNumber: insuranceData.plateNumber });

    let record;
    if (existingRecord) {
      // Update existing record
      record = await Absher.findByIdAndUpdate(
        existingRecord._id,
        {
          plateNumber: insuranceData.plateNumber,
          name: name || existingRecord.name,
          referenceNumber: referenceNumber || sequenceNumber || existingRecord.referenceNumber,
          inspectionExpiryDate: insuranceData.inspectionExpiryDate || existingRecord.inspectionExpiryDate,
          licenseExpiryDate: insuranceData.licenseExpiryDate || existingRecord.licenseExpiryDate,
          expiryDate: insuranceData.insuranceExpiryDate || existingRecord.expiryDate,
          dataSource: 'absher',
          lastSyncDate: new Date()
        },
        { new: true, runValidators: true }
      );

      console.log('✅ Updated existing Absher record:', record._id);
    } else {
      // Create new record
      record = new Absher({
        plateNumber: insuranceData.plateNumber,
        name: name || plateNumber,
        referenceNumber: referenceNumber || sequenceNumber || plateNumber,
        expiryDate: insuranceData.insuranceExpiryDate,
        inspectionExpiryDate: insuranceData.inspectionExpiryDate,
        licenseExpiryDate: insuranceData.licenseExpiryDate,
        dataSource: 'absher',
        lastSyncDate: new Date()
      });

      await record.save();
      console.log('✅ Created new Absher record:', record._id);
    }

    res.json({
      success: true,
      message: 'Successfully synced with Absher API',
      data: {
        record: record,
        apiResponse: insuranceData
      }
    });

  } catch (error) {
    console.error('❌ Error syncing with Absher API:', error);

    if (error.message.includes('TAMM configuration')) {
      return next(new AppError('Absher API is not configured. Please check your .env settings.', 500));
    }

    if (error.message.includes('Failed to authenticate')) {
      return next(new AppError('Failed to authenticate with Absher API. Please check your credentials.', 500));
    }

    next(new AppError(`Absher API sync failed: ${error.message}`, 500));
  }
});

// GET vehicle insurance details from Absher API
router.post('/insurance-inquiry', async (req, res, next) => {
  try {
    const { plateNumber, sequenceNumber } = req.body;

    if (!plateNumber && !sequenceNumber) {
      return next(new AppError('Plate number or sequence number is required', 400));
    }

    console.log('🔍 Fetching insurance details from Absher API');

    const insuranceData = await absherService.getVehicleInsuranceDetails(plateNumber, sequenceNumber);

    res.json({
      success: true,
      message: 'Successfully fetched insurance details',
      data: insuranceData
    });

  } catch (error) {
    console.error('❌ Error fetching insurance details:', error);
    next(new AppError(`Failed to fetch insurance details: ${error.message}`, 500));
  }
});

// GET vehicle MVPI details from Absher API
router.post('/mvpi-inquiry', async (req, res, next) => {
  try {
    const { plateNumber, sequenceNumber } = req.body;

    if (!plateNumber && !sequenceNumber) {
      return next(new AppError('Plate number or sequence number is required', 400));
    }

    console.log('🔍 Fetching MVPI details from Absher API');

    const mvpiData = await absherService.getMVPIDetails(plateNumber, sequenceNumber);

    res.json({
      success: true,
      message: 'Successfully fetched MVPI details',
      data: mvpiData
    });

  } catch (error) {
    console.error('❌ Error fetching MVPI details:', error);
    next(new AppError(`Failed to fetch MVPI details: ${error.message}`, 500));
  }
});

// STEP 1: Verify vehicle for Istemarah renewal
router.post('/istemarah/verify', async (req, res, next) => {
  try {
    const { plateNumber } = req.body;

    if (!plateNumber) {
      return next(new AppError('Plate number is required', 400));
    }

    console.log('🔍 Verifying vehicle for Istemarah renewal');

    const verifyResult = await absherService.verifyIstemarahRenewal(plateNumber);

    res.json({
      success: true,
      message: 'Vehicle verified successfully',
      data: verifyResult
    });

  } catch (error) {
    console.error('❌ Error verifying vehicle:', error);
    next(new AppError(`Failed to verify vehicle: ${error.message}`, 500));
  }
});

// STEP 2: Submit Istemarah renewal
router.post('/istemarah/submit', async (req, res, next) => {
  try {
    const { conversationId, ownerMobileNumber, integratorUserId } = req.body;

    if (!conversationId || !ownerMobileNumber) {
      return next(new AppError('Conversation ID and mobile number are required', 400));
    }

    console.log('🔄 Submitting Istemarah renewal');

    const submitResult = await absherService.submitIstemarahRenewal(
      conversationId,
      ownerMobileNumber,
      integratorUserId
    );

    res.json({
      success: true,
      message: 'Istemarah renewal submitted successfully',
      data: submitResult
    });

  } catch (error) {
    console.error('❌ Error submitting renewal:', error);
    next(new AppError(`Failed to submit renewal: ${error.message}`, 500));
  }
});

// STEP 3: Search renewed Istemarah records
router.post('/istemarah/search', async (req, res, next) => {
  try {
    const { plateInfo, integratorUserId, page = 0, size = 10 } = req.body;

    if (!plateInfo || !integratorUserId) {
      return next(new AppError('Plate info and integrator user ID are required', 400));
    }

    console.log('🔍 Searching renewed Istemarah records');

    const searchResult = await absherService.searchRenewedIstemarah(
      plateInfo,
      integratorUserId,
      page,
      size
    );

    res.json({
      success: true,
      message: 'Search completed successfully',
      data: searchResult
    });

  } catch (error) {
    console.error('❌ Error searching renewed records:', error);
    next(new AppError(`Failed to search renewed records: ${error.message}`, 500));
  }
});

// Complete Istemarah renewal workflow (all 3 steps)
router.post('/istemarah/renew-complete', async (req, res, next) => {
  try {
    const { plateNumber, ownerMobileNumber, integratorUserId } = req.body;

    if (!plateNumber || !ownerMobileNumber) {
      return next(new AppError('Plate number and mobile number are required', 400));
    }

    console.log('🔄 Starting complete Istemarah renewal workflow');

    const result = await absherService.completeIstemarahRenewal(
      plateNumber,
      ownerMobileNumber,
      integratorUserId
    );

    res.json({
      success: true,
      message: 'Istemarah renewal completed successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error completing renewal workflow:', error);
    next(new AppError(`Failed to complete renewal: ${error.message}`, 500));
  }
});

module.exports = router;
