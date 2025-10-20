const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const AbsherConfig = require('../models/AbsherConfig');
const absherService = require('../services/absherService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Absher Routes
 * All configuration is read from environment variables for security
 * Only sync endpoints are exposed
 */

/**
 * POST /api/absher/sync
 * Sync all vehicles from Absher API
 */
router.post('/sync', async (req, res, next) => {
  try {
    console.log('\n🔄 Starting Absher sync...');

    // Get all vehicles that have plate number and sequence number
    const vehicles = await Vehicle.find({
      plateNumber: { $exists: true, $ne: '' },
      sequenceNumber: { $exists: true, $ne: '' }
    });

    if (vehicles.length === 0) {
      return res.json({
        success: true,
        message: 'No vehicles found to sync',
        data: { total: 0, successful: 0, failed: 0 }
      });
    }

    console.log(`📋 Found ${vehicles.length} vehicles to sync`);

    // Sync all vehicles
    const results = {
      total: vehicles.length,
      successful: 0,
      failed: 0,
      errors: [],
      updated: []
    };

    for (const vehicle of vehicles) {
      try {
        console.log(`\n🔍 Syncing: ${vehicle.plateNumber} (${vehicle.sequenceNumber})`);

        const absherData = await absherService.getVehicleInsuranceDetails(
          vehicle.plateNumber,
          vehicle.sequenceNumber
        );

        // Update vehicle with Absher data
        Object.assign(vehicle, absherData);
        await vehicle.save();

        results.successful++;
        results.updated.push({
          plateNumber: vehicle.plateNumber,
          sequenceNumber: vehicle.sequenceNumber
        });

        console.log(`✅ Successfully synced: ${vehicle.plateNumber}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to sync vehicle ${vehicle.plateNumber}:`, error.message);
        results.failed++;
        results.errors.push({
          plateNumber: vehicle.plateNumber,
          sequenceNumber: vehicle.sequenceNumber,
          error: error.message
        });
      }
    }

    console.log(`\n✅ Sync complete: ${results.successful}/${results.total} successful`);

    // Return success even if some vehicles failed
    // The client can check the results.failed count
    res.json({
      success: results.failed < results.total, // Success if at least one vehicle synced
      message: results.successful > 0
        ? `Sync complete: ${results.successful}/${results.total} vehicles updated`
        : `Sync failed: All ${results.total} vehicles failed to sync. Check network connection and Absher API credentials.`,
      data: results
    });
  } catch (error) {
    console.error('❌ Error in sync:', error);

    // Send proper error response instead of passing to error handler
    res.status(500).json({
      success: false,
      message: error.message || 'Sync failed',
      error: {
        message: error.message,
        code: error.code,
        details: error.response?.data || null
      }
    });
  }
});

/**
 * POST /api/absher/sync/vehicle/:id
 * Sync a single vehicle from Absher API
 */
router.post('/sync/vehicle/:id', async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (!vehicle.plateNumber || !vehicle.sequenceNumber) {
      return next(new AppError('Vehicle must have plate number and sequence number to sync', 400));
    }

    console.log(`🔄 Syncing vehicle: ${vehicle.plateNumber}`);

    const absherData = await absherService.getVehicleInsuranceDetails(
      vehicle.plateNumber,
      vehicle.sequenceNumber
    );

    // Update vehicle with Absher data
    Object.assign(vehicle, absherData);
    await vehicle.save();

    console.log(`✅ Vehicle synced successfully: ${vehicle.plateNumber}`);

    res.json({
      success: true,
      message: 'Vehicle synced successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('❌ Error syncing vehicle:', error);
    next(error);
  }
});

/**
 * POST /api/absher/test-connection
 * Test connection to Absher API
 */
router.post('/test-connection', async (req, res, next) => {
  try {
    console.log('🧪 Testing Absher API connection...');

    const result = await absherService.testConnection();

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    next(error);
  }
});

/**
 * POST /api/absher/istemarah/request-renewal
 * Request Istemarah (Vehicle Registration) Renewal
 */
router.post('/istemarah/request-renewal', async (req, res, next) => {
  try {
    const { plateNumber, sequenceNumber, additionalData } = req.body;

    if (!plateNumber || !sequenceNumber) {
      return next(new AppError('Plate number and sequence number are required', 400));
    }

    console.log(`🔄 Requesting Istemarah renewal for: ${plateNumber} (${sequenceNumber})`);

    const renewalData = await absherService.requestIstemarahRenewal(
      plateNumber,
      sequenceNumber,
      additionalData
    );

    res.json({
      success: true,
      message: 'Istemarah renewal request submitted successfully',
      data: renewalData
    });
  } catch (error) {
    console.error('❌ Error requesting Istemarah renewal:', error);
    next(error);
  }
});

/**
 * POST /api/absher/istemarah/renewal-details
 * Get Istemarah Renewal Details
 */
router.post('/istemarah/renewal-details', async (req, res, next) => {
  try {
    const { plateNumber, sequenceNumber } = req.body;

    if (!plateNumber || !sequenceNumber) {
      return next(new AppError('Plate number and sequence number are required', 400));
    }

    console.log(`🔍 Fetching Istemarah renewal details for: ${plateNumber} (${sequenceNumber})`);

    const details = await absherService.getIstemarahRenewalDetails(
      plateNumber,
      sequenceNumber
    );

    res.json({
      success: true,
      message: 'Istemarah renewal details retrieved successfully',
      data: details
    });
  } catch (error) {
    console.error('❌ Error fetching Istemarah renewal details:', error);
    next(error);
  }
});

/**
 * POST /api/absher/istemarah/renew-vehicle/:id
 * Request Istemarah renewal for a specific vehicle by ID
 */
router.post('/istemarah/renew-vehicle/:id', async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    if (!vehicle.plateNumber || !vehicle.sequenceNumber) {
      return next(new AppError('Vehicle must have plate number and sequence number', 400));
    }

    console.log(`🔄 Requesting Istemarah renewal for vehicle: ${vehicle.plateNumber}`);

    const renewalData = await absherService.requestIstemarahRenewal(
      vehicle.plateNumber,
      vehicle.sequenceNumber,
      req.body.additionalData || {}
    );

    // Update vehicle with renewal data
    vehicle.renewalRequestId = renewalData.renewalRequestId;
    vehicle.renewalStatus = renewalData.renewalStatus;
    vehicle.renewalFees = renewalData.renewalFees;
    vehicle.lastRenewalRequestDate = new Date();
    await vehicle.save();

    console.log(`✅ Istemarah renewal requested for vehicle: ${vehicle.plateNumber}`);

    res.json({
      success: true,
      message: 'Istemarah renewal request submitted successfully',
      data: {
        vehicle: vehicle,
        renewal: renewalData
      }
    });
  } catch (error) {
    console.error('❌ Error requesting Istemarah renewal:', error);
    next(error);
  }
});

/**
 * GET /api/absher/config
 * Get Absher configuration
 */
router.get('/config', async (req, res, next) => {
  try {
    const config = await AbsherConfig.findOne({ status: 'active' });

    if (!config) {
      // Return default configuration from environment variables
      return res.json({
        success: true,
        data: {
          clientId: process.env.TAMM_CLIENT_ID || '3fd125a2',
          authorizationServer: process.env.TAMM_AUTH_URL?.replace('/auth/realms/Tamm-QA/protocol/openid-connect/token', '') || 'https://idp.apps.devocp4.elm.sa',
          realmName: process.env.TAMM_REALM_NAME || 'Tamm-QA',
          status: 'active'
        }
      });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Get config error:', error);
    next(error);
  }
});

/**
 * GET /api/absher/config/full
 * Get full Absher configuration (including sensitive data - masked)
 */
router.get('/config/full', async (req, res, next) => {
  try {
    const config = await AbsherConfig.findOne({ status: 'active' });

    if (!config) {
      return res.json({
        success: true,
        data: null
      });
    }

    // Mask the client secret for security
    const configData = config.toObject();
    if (configData.clientSecret) {
      configData.clientSecret = '••••••••' + configData.clientSecret.slice(-4);
    }

    res.json({
      success: true,
      data: configData
    });
  } catch (error) {
    console.error('Get full config error:', error);
    next(error);
  }
});

/**
 * POST /api/absher/config
 * Save Absher configuration
 */
router.post('/config', async (req, res, next) => {
  try {
    const { clientId, clientSecret, authorizationServer, realmName, linkId, status, notes } = req.body;

    // Check if configuration already exists
    let config = await AbsherConfig.findOne({ status: 'active' });

    const configData = {
      clientId: clientId || '3fd125a2',
      clientSecret: clientSecret || process.env.TAMM_CLIENT_SECRET,
      authorizationServer: authorizationServer || 'https://idp.apps.devocp4.elm.sa',
      realmName: realmName || 'Tamm-QA',
      linkId: linkId || clientId,
      status: status || 'active',
      notes: notes || '',
      lastUpdated: new Date()
    };

    if (config) {
      // Update existing configuration
      config = await AbsherConfig.findByIdAndUpdate(
        config._id,
        configData,
        { new: true }
      );
    } else {
      // Create new configuration
      config = await AbsherConfig.create(configData);
    }

    console.log('✅ Absher configuration saved successfully');

    // Reload the service configuration
    await absherService.reloadConfig();
    console.log('✅ Absher service configuration reloaded');

    res.json({
      success: true,
      message: 'Configuration saved successfully',
      data: config
    });
  } catch (error) {
    console.error('Save config error:', error);
    next(error);
  }
});

/**
 * PUT /api/absher/config/:id
 * Update Absher configuration
 */
router.put('/config/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const config = await AbsherConfig.findByIdAndUpdate(
      id,
      { ...updates, lastUpdated: new Date() },
      { new: true }
    );

    if (!config) {
      return next(new AppError('Configuration not found', 404));
    }

    console.log('✅ Absher configuration updated successfully');

    // Reload the service configuration
    await absherService.reloadConfig();
    console.log('✅ Absher service configuration reloaded');

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Update config error:', error);
    next(error);
  }
});

module.exports = router;
