const express = require('express');
const router = express.Router();
const gosiService = require('../services/gosiService');
const GOSI = require('../models/GOSI');

/**
 * GOSI API Routes
 * Endpoints for fetching and managing GOSI employee data
 *
 * IMPORTANT: Specific routes MUST come before parameterized routes like /:id
 */

/**
 * GET /api/gosi/test-connection/check
 * Test GOSI API connection
 */
router.get('/test-connection/check', async (req, res, next) => {
  try {
    console.log('🧪 Testing GOSI API connection...');

    const result = await gosiService.testConnection();

    res.json({
      success: result.success,
      message: result.message,
      testData: result.testData,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error testing GOSI connection:', error);
    next(error);
  }
});

/**
 * GET /api/gosi/establishment/info
 * Get establishment information
 */
router.get('/establishment/info', async (req, res, next) => {
  try {
    const result = await gosiService.getEstablishmentInfo();

    res.json({
      success: result.success,
      data: result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting establishment info:', error);
    next(error);
  }
});

/**
 * GET /api/gosi/count/total
 * Get total count of GOSI records
 * IMPORTANT: Must come before /:id route to avoid route matching conflict
 */
router.get('/count/total', async (req, res, next) => {
  try {
    const count = await GOSI.countDocuments();
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error counting GOSI records:', error);
    next(error);
  }
});

/**
 * POST /api/gosi/sync/:nin
 * Fetch employee data from GOSI API and save to database
 */
router.post('/sync/:nin', async (req, res, next) => {
  try {
    const { nin } = req.params;

    console.log(`📥 Syncing GOSI data for NIN: ${nin}`);

    // Fetch from GOSI API
    const result = await gosiService.getContributorData(nin);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || 'Employee not found in GOSI',
        code: result.code
      });
    }

    // Map GOSI API response to our model
    const apiData = result.data;

    // Map coverage array to products array with proper structure
    const products = (apiData.engagements?.coverage || []).map(coverage => ({
      productName: coverage.name?.english || '',
      productNameAr: coverage.name?.arabic || '',
      employerContribution: coverage.employerDeductionRate || 0,
      employeeContribution: coverage.employeeDeductionRate || 0,
      totalContribution: (coverage.employerDeductionRate || 0) + (coverage.employeeDeductionRate || 0),
      deductionRate: (coverage.employerDeductionRate || 0) + (coverage.employeeDeductionRate || 0)
    }));

    // Calculate totals from products (deduction rates in percentages)
    const totalEmployerContribution = products.reduce((sum, p) => sum + (p.employerContribution || 0), 0);
    const totalEmployeeContribution = products.reduce((sum, p) => sum + (p.employeeContribution || 0), 0);
    const totalContribution = totalEmployerContribution + totalEmployeeContribution;

    const gosiRecord = {
      nin: nin,
      name: apiData.fullName?.english || '',
      nameAr: apiData.fullName?.arabic || '',
      contributorType: apiData.engagements?.type || '',
      establishmentRegNumber: apiData.engagements?.registrationNumber || process.env.GOSI_REGISTRATION_NUMBER || '',
      establishmentName: apiData.establishmentName || '',
      engagementStartDate: apiData.engagements?.startDate ? new Date(apiData.engagements.startDate) : null,
      engagementEndDate: apiData.engagements?.endDate ? new Date(apiData.engagements.endDate) : null,
      engagementStatus: apiData.engagements?.status || apiData.status || '',
      occupation: apiData.occupation || '',
      occupationCode: apiData.occupationCode || '',
      wage: apiData.wage || 0,
      currency: apiData.currency || 'SAR',

      // Products (social insurance coverage)
      products: products,

      // Totals (calculated from products)
      totalEmployerContribution,
      totalEmployeeContribution,
      totalContribution,

      // Store full API response for reference
      fullApiResponse: apiData,
      lastSyncDate: new Date()
    };

    // Update existing or create new
    const savedRecord = await GOSI.findOneAndUpdate(
      { nin: nin },
      gosiRecord,
      { upsert: true, new: true, runValidators: true }
    );

    console.log(`✅ GOSI data synced successfully for NIN: ${nin}`);

    res.json({
      success: true,
      message: 'Employee data synced from GOSI successfully',
      data: savedRecord
    });
  } catch (error) {
    console.error('Error syncing GOSI data:', error);
    next(error);
  }
});

/**
 * POST /api/gosi/sync-multiple
 * Sync multiple employees from GOSI
 * Body: { ninList: ['1234567890', '0987654321'] }
 */
router.post('/sync-multiple', async (req, res, next) => {
  try {
    const { ninList } = req.body;

    if (!ninList || !Array.isArray(ninList)) {
      return res.status(400).json({
        success: false,
        message: 'ninList array is required'
      });
    }

    console.log(`📥 Syncing ${ninList.length} employees from GOSI...`);

    const results = await gosiService.syncMultipleEmployees(ninList);

    // Update database for successful fetches
    const updated = [];
    for (const item of results.success) {
      try {
        const apiData = item.data;

        // Map coverage array to products array with proper structure
        const products = (apiData.engagements?.coverage || []).map(coverage => ({
          productName: coverage.name?.english || '',
          productNameAr: coverage.name?.arabic || '',
          employerContribution: coverage.employerDeductionRate || 0,
          employeeContribution: coverage.employeeDeductionRate || 0,
          totalContribution: (coverage.employerDeductionRate || 0) + (coverage.employeeDeductionRate || 0),
          deductionRate: (coverage.employerDeductionRate || 0) + (coverage.employeeDeductionRate || 0)
        }));

        // Calculate totals from products (deduction rates in percentages)
        const totalEmployerContribution = products.reduce((sum, p) => sum + (p.employerContribution || 0), 0);
        const totalEmployeeContribution = products.reduce((sum, p) => sum + (p.employeeContribution || 0), 0);
        const totalContribution = totalEmployerContribution + totalEmployeeContribution;

        const gosiRecord = {
          nin: item.nin,
          name: apiData.fullName?.english || '',
          nameAr: apiData.fullName?.arabic || '',
          contributorType: apiData.engagements?.type || '',
          establishmentRegNumber: apiData.engagements?.registrationNumber || process.env.GOSI_REGISTRATION_NUMBER || '',
          establishmentName: apiData.establishmentName || '',
          engagementStartDate: apiData.engagements?.startDate ? new Date(apiData.engagements.startDate) : null,
          engagementEndDate: apiData.engagements?.endDate ? new Date(apiData.engagements.endDate) : null,
          engagementStatus: apiData.engagements?.status || apiData.status || '',
          occupation: apiData.occupation || '',
          occupationCode: apiData.occupationCode || '',
          wage: apiData.wage || 0,
          currency: apiData.currency || 'SAR',
          products: products,
          totalEmployerContribution,
          totalEmployeeContribution,
          totalContribution,
          fullApiResponse: apiData,
          lastSyncDate: new Date()
        };

        const savedRecord = await GOSI.findOneAndUpdate(
          { nin: item.nin },
          gosiRecord,
          { upsert: true, new: true, runValidators: true }
        );

        updated.push(savedRecord);
      } catch (error) {
        console.error(`Error updating database for NIN ${item.nin}:`, error);
        results.failed.push({
          nin: item.nin,
          error: 'Database update failed',
          code: 'DB_ERROR'
        });
      }
    }

    console.log(`✅ GOSI sync completed: ${updated.length} updated, ${results.failed.length} failed`);

    res.json({
      success: true,
      message: `Synced ${updated.length} of ${results.total} employees`,
      results: {
        total: results.total,
        synced: updated.length,
        failed: results.failed.length,
        syncedEmployees: updated,
        failedEmployees: results.failed
      }
    });
  } catch (error) {
    console.error('Error syncing multiple GOSI employees:', error);
    next(error);
  }
});

/**
 * POST /api/gosi/bulk-delete
 * Delete multiple GOSI records
 */
router.post('/bulk-delete', async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'ids array is required'
      });
    }

    const result = await GOSI.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} GOSI records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting GOSI records:', error);
    next(error);
  }
});

/**
 * GET /api/gosi
 * Get all GOSI records with pagination and filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 25, status, search } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { nin: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { nameAr: { $regex: search, $options: 'i' } },
        { occupation: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter based on engagement dates
    if (status && status !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (status === 'terminated') {
        // Records with end date in the past
        query.engagementEndDate = { $lt: today };
      } else if (status === 'active') {
        // Records with start date <= today and (no end date OR end date >= today)
        query.engagementStartDate = { $lte: today };
        query.$or = [
          { engagementEndDate: { $gte: today } },
          { engagementEndDate: null }
        ];
      } else if (status === 'inactive') {
        // Records with start date in the future
        query.engagementStartDate = { $gt: today };
      }
    }

    const records = await GOSI.find(query)
      .sort({ engagementStartDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .maxTimeMS(10000)
      .lean()
      .exec();

    const total = await GOSI.countDocuments(query).maxTimeMS(5000);

    res.json({
      success: true,
      data: records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching GOSI records:', error);
    next(error);
  }
});

/**
 * GET /api/gosi/:id
 * Get single GOSI record by ID
 * IMPORTANT: This route must come AFTER all specific routes
 */
router.get('/:id', async (req, res, next) => {
  try {
    const record = await GOSI.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'GOSI record not found'
      });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching GOSI record:', error);
    next(error);
  }
});

/**
 * POST /api/gosi
 * Create manual GOSI record
 */
router.post('/', async (req, res, next) => {
  try {
    const record = new GOSI(req.body);
    await record.save();

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error creating GOSI record:', error);
    next(error);
  }
});

/**
 * PUT /api/gosi/:id
 * Update GOSI record
 */
router.put('/:id', async (req, res, next) => {
  try {
    const record = await GOSI.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'GOSI record not found'
      });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error('Error updating GOSI record:', error);
    next(error);
  }
});

/**
 * DELETE /api/gosi/:id
 * Delete single GOSI record
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const record = await GOSI.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'GOSI record not found'
      });
    }

    res.json({
      success: true,
      message: 'GOSI record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting GOSI record:', error);
    next(error);
  }
});

module.exports = router;
