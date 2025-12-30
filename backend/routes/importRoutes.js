// backend/routes/importRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const Vehicle = require('../models/Vehicle');
const HomeRent = require('../models/HomeRent');
const Electricity = require('../models/Electricity');
const GOSI = require('../models/GOSI');
const gosiService = require('../services/gosiService');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'), false);
    }
  }
});

// Helper function to parse Excel date
const parseExcelDate = (value) => {
  if (!value) return null;
  
  // If it's already a date string
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  }
  
  // If it's an Excel serial number
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  
  return null;
};

// Helper function to clean and parse data
const cleanValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

// Import Home Rents from Excel
router.post('/home-rents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    console.log('Parsed Excel data:', jsonData);

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        // Map Excel columns to database fields (flexible mapping)
        const homeRentData = {
          name: cleanValue(row['Property Name'] || row['name'] || row['Name'] || `Property ${i + 1}`),
          location: cleanValue(row['Location'] || row['location'] || row['Address'] || ''),
          district: cleanValue(row['District'] || row['district'] || ''),
          project: cleanValue(row['Project'] || row['project'] || ''),
          contractNumber: cleanValue(row['Contract Number'] || row['contractNumber'] || row['رقم العقد'] || `CONTRACT-${Date.now()}-${i}`),
          contractStartingDate: parseExcelDate(row['Contract Start'] || row['contractStartingDate'] || row['Starting Date']) || new Date().toISOString().split('T')[0],
          contractEndingDate: parseExcelDate(row['Contract End'] || row['contractEndingDate'] || row['End Date']) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          contractStatus: cleanValue(row['Status'] || row['contractStatus'] || 'Active'),
          firstPaymentDate: parseExcelDate(row['First Payment'] || row['firstPaymentDate'] || row['Payment 1']) || null,
          secondPaymentDate: parseExcelDate(row['Second Payment'] || row['secondPaymentDate'] || row['Payment 2']) || null,
          thirdPaymentDate: parseExcelDate(row['Third Payment'] || row['thirdPaymentDate'] || row['Payment 3']) || null,
          fourthPaymentDate: parseExcelDate(row['Fourth Payment'] || row['fourthPaymentDate'] || row['Payment 4']) || null,
          rentAnnually: cleanValue(row['Annual Rent'] || row['rentAnnually'] || row['Rent'] || '0'),
          address: cleanValue(row['Address'] || row['address'] || row['Full Address'] || ''),
          electricityMeterNumber: cleanValue(row['Meter Number'] || row['electricityMeterNumber'] || ''),
          contactNo: cleanValue(row['Contact'] || row['contactNo'] || row['Phone'] || ''),
          gts: cleanValue(row['GTS'] || row['gts'] || ''),
          bms: cleanValue(row['BMS'] || row['bms'] || ''),
          spd: cleanValue(row['SPD'] || row['spd'] || ''),
          note: cleanValue(row['Note'] || row['note'] || row['Notes'] || ''),
          duration: cleanValue(row['Duration'] || row['duration'] || ''),
          saudiElectricCompany: cleanValue(row['Electric Company'] || row['saudiElectricCompany'] || ''),
          remarks: cleanValue(row['Remarks'] || row['remarks'] || ''),
          attachments: []
        };

        // Create new home rent record
        const homeRent = new HomeRent(homeRentData);
        await homeRent.save();
        results.success++;
        
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    res.status(200).json({
      message: 'Import completed',
      results
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Failed to import data',
      details: error.message 
    });
  }
});

// Import Vehicles from Excel
router.post('/vehicles', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        const vehicleData = {
          // 1. Plate Number
          plateNumber: cleanValue(row['Plate Number'] || row['plateNumber'] || row['رقم اللوحة'] || `PLATE-${i + 1}`),

          // 2. Registration Type
          registrationType: cleanValue(row['Registration Type'] || row['registrationType'] || row['نوع التسجيل'] || ''),

          // 3. Brand
          vehicleMaker: cleanValue(row['Brand'] || row['Maker'] || row['vehicleMaker'] || row['العلامة التجارية'] || row['الشركة المصنعة'] || 'Unknown'),

          // 4. Model
          vehicleModel: cleanValue(row['Model'] || row['vehicleModel'] || row['الموديل'] || 'Unknown'),

          // 5. Year of Manufacture
          modelYear: parseInt(row['Year of Manufacture'] || row['Year'] || row['modelYear'] || row['سنة التصنيع'] || row['سنة الصنع'] || new Date().getFullYear()),

          // 6. Serial Number
          sequenceNumber: cleanValue(row['Serial Number'] || row['Sequence'] || row['sequenceNumber'] || row['الرقم التسلسلي'] || ''),

          // 7. Chassis Number
          chassisNumber: cleanValue(row['Chassis Number'] || row['Chassis'] || row['chassisNumber'] || row['رقم الشاسيه'] || `CHASSIS-${i + 1}`),

          // 8. Basic Color
          basicColor: cleanValue(row['Basic Color'] || row['basicColor'] || row['Color'] || row['اللون الأساسي'] || ''),

          // 9. License Expiry Date
          licenseExpiryDate: parseExcelDate(row['License Expiry Date'] || row['License Expiry'] || row['licenseExpiryDate'] || row['تاريخ انتهاء الرخصة']) || new Date().toISOString().split('T')[0],

          // 10. Inspection Expiry Date
          inspectionExpiryDate: parseExcelDate(row['Inspection Expiry Date'] || row['Inspection Expiry'] || row['inspectionExpiryDate'] || row['تاريخ انتهاء الفحص']) || new Date().toISOString().split('T')[0],

          // 11. Actual User ID Number
          actualDriverId: cleanValue(row['Actual User ID Number'] || row['Actual User ID'] || row['Driver ID'] || row['actualDriverId'] || row['رقم هوية المستخدم الفعلي'] || ''),

          // 12. Actual User Name
          actualDriverName: cleanValue(row['Actual User Name'] || row['Driver Name'] || row['actualDriverName'] || row['اسم المستخدم الفعلي'] || ''),

          // 13. Inspection Status
          inspectionStatus: cleanValue(row['Inspection Status'] || row['inspectionStatus'] || row['حالة الفحص'] || 'Valid'),

          // 14. Insurance Status
          insuranceStatus: cleanValue(row['Insurance Status'] || row['Insurance'] || row['insuranceStatus'] || row['حالة التأمين'] || 'Valid'),

          attachments: []
        };

        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();
        results.success++;
        
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.failed++;
        results.errors.push({ row: i + 1, error: error.message });
      }
    }

    res.status(200).json({ message: 'Import completed', results });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data', details: error.message });
  }
});

// Import Electricity from Excel
router.post('/electricity', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      try {
        const current = parseFloat(row['Current Reading'] || row['currentReading'] || 0);
        const previous = parseFloat(row['Previous Reading'] || row['previousReading'] || 0);
        
        const electricityData = {
          departmentNumber: cleanValue(row['Department'] || row['departmentNumber'] || `DEPT-${i + 1}`),
          meterNumber: cleanValue(row['Meter Number'] || row['meterNumber'] || `METER-${i + 1}`),
          location: cleanValue(row['Location'] || row['location'] || ''),
          lastReadingDate: parseExcelDate(row['Reading Date'] || row['lastReadingDate']) || new Date().toISOString().split('T')[0],
          currentReading: current,
          previousReading: previous,
          consumption: current - previous,
          billAmount: parseFloat(row['Amount'] || row['billAmount'] || 0),
          billDate: parseExcelDate(row['Bill Date'] || row['billDate']) || new Date().toISOString().split('T')[0],
          dueDate: parseExcelDate(row['Due Date'] || row['dueDate']) || new Date().toISOString().split('T')[0],
          paymentDate: parseExcelDate(row['Payment Date'] || row['paymentDate']) || null,
          paymentStatus: cleanValue(row['Status'] || row['paymentStatus'] || 'Pending'),
          propertyType: cleanValue(row['Property Type'] || row['propertyType'] || 'Commercial'),
          subscriberName: cleanValue(row['Subscriber'] || row['subscriberName'] || 'Unknown'),
          subscriberNumber: cleanValue(row['Subscriber Number'] || row['subscriberNumber'] || ''),
          notes: cleanValue(row['Notes'] || row['notes'] || ''),
          attachments: [],
          alertThreshold: parseFloat(row['Threshold'] || row['alertThreshold']) || null,
          lastMonthConsumption: parseFloat(row['Last Month'] || row['lastMonthConsumption']) || null
        };

        const electricity = new Electricity(electricityData);
        await electricity.save();
        results.success++;
        
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.failed++;
        results.errors.push({ row: i + 1, error: error.message });
      }
    }

    res.status(200).json({ message: 'Import completed', results });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import data', details: error.message });
  }
});

// Import GOSI Employee Iqama Numbers and Bulk Sync
router.post('/gosi', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📥 GOSI Import: Reading Excel file...');

    // Read the Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    console.log(`📋 Found ${jsonData.length} rows in Excel file`);

    // Extract Iqama/NIN numbers from Excel
    // Support multiple column names: NIN, Iqama, National ID, etc.
    const ninList = [];
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Try different column names
      const nin = cleanValue(
        row['NIN'] ||
        row['nin'] ||
        row['Iqama'] ||
        row['iqama'] ||
        row['National ID'] ||
        row['nationalId'] ||
        row['رقم الهوية'] ||
        row['رقم الإقامة'] ||
        row['ID'] ||
        row['id']
      );

      if (nin && nin.length >= 10) {
        ninList.push(nin);
      } else {
        console.log(`⚠️ Row ${i + 1}: Invalid or missing NIN/Iqama number`);
      }
    }

    if (ninList.length === 0) {
      return res.status(400).json({
        error: 'No valid Iqama/NIN numbers found in Excel file',
        hint: 'Make sure your Excel has a column named: NIN, Iqama, National ID, or ID'
      });
    }

    console.log(`✅ Extracted ${ninList.length} valid Iqama numbers`);

    // Bulk sync from GOSI API
    console.log('🔄 Starting bulk sync from GOSI API...');
    const results = {
      total: ninList.length,
      success: [],
      failed: [],
      saved: 0
    };

    for (const nin of ninList) {
      try {
        console.log(`📥 Fetching data for NIN: ${nin}`);

        // Fetch from GOSI API
        const apiResult = await gosiService.getContributorData(nin);

        if (!apiResult.success) {
          results.failed.push({
            nin,
            error: apiResult.error || 'Failed to fetch from GOSI',
            code: apiResult.code
          });
          continue;
        }

        // Map GOSI API response to our model
        const apiData = apiResult.data;

        // Map coverage array to products
        const products = (apiData.engagements?.coverage || []).map(coverage => ({
          productName: coverage.name?.english || '',
          productNameAr: coverage.name?.arabic || '',
          employerContribution: coverage.employerDeductionRate || 0,
          employeeContribution: coverage.employeeDeductionRate || 0,
          totalContribution: (coverage.employerDeductionRate || 0) + (coverage.employeeDeductionRate || 0),
          deductionRate: (coverage.employerDeductionRate || 0) + (coverage.employeeDeductionRate || 0)
        }));

        // Calculate totals
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
          products: products,
          totalEmployerContribution,
          totalEmployeeContribution,
          totalContribution,
          fullApiResponse: apiData,
          lastSyncDate: new Date()
        };

        // Save to database
        const savedRecord = await GOSI.findOneAndUpdate(
          { nin: nin },
          gosiRecord,
          { upsert: true, new: true, runValidators: true }
        );

        results.success.push({
          nin,
          name: gosiRecord.name
        });
        results.saved++;

        console.log(`✅ Saved: ${nin} - ${gosiRecord.name}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Error processing NIN ${nin}:`, error.message);
        results.failed.push({
          nin,
          error: error.message,
          code: 'EXCEPTION'
        });
      }
    }

    console.log(`✅ GOSI Import completed: ${results.saved} saved, ${results.failed.length} failed`);

    res.status(200).json({
      message: 'GOSI import completed',
      results: {
        total: results.total,
        saved: results.saved,
        failed: results.failed.length,
        successList: results.success,
        failedList: results.failed
      }
    });

  } catch (error) {
    console.error('❌ GOSI Import error:', error);
    res.status(500).json({
      error: 'Failed to import GOSI data',
      details: error.message
    });
  }
});

module.exports = router;