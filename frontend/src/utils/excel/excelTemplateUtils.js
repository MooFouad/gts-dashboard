import * as XLSX from 'xlsx';

/**
 * Generate Excel template for Home Rents
 */
export const generateHomeRentTemplate = () => {
  const templateData = [
    {
      'Contract Number': 'Example: M202407671-1-0',
      'Starting Date': '2024-07-02',
      'End Date': '2025-07-01',
      'Notice': '60 days',
      'Payment Terms': '2024-07-02',
      'Payment Type': '2024-10-02',
      'Payments Status': '2025-01-02',
      'Amount': '2025-04-02',
      'Actual Rent': '8000',
      'Address': 'Riyadh - 7071',
      'Contract Person': 'Mr. Iyad Alshihab',
      'GTS Contact': 'Mobile +966550859388',
      'Mobile': '',
      'Saudi Electric Company': '',
      'Comment': '',
      'Project': '',
      'BMS': '',
      'SPD': ''
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Contract Number
    { wch: 15 }, // Starting Date
    { wch: 15 }, // End Date
    { wch: 12 }, // Notice
    { wch: 15 }, // Payment Terms
    { wch: 15 }, // Payment Type
    { wch: 15 }, // Payments Status
    { wch: 15 }, // Amount
    { wch: 12 }, // Actual Rent
    { wch: 30 }, // Address
    { wch: 20 }, // Contract Person
    { wch: 25 }, // GTS Contact
    { wch: 20 }, // Mobile
    { wch: 25 }, // Saudi Electric Company
    { wch: 30 }, // Comment
    { wch: 15 }, // Project
    { wch: 10 }, // BMS
    { wch: 10 }  // SPD
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Home Rents Template');
  XLSX.writeFile(wb, 'HomeRents_Template.xlsx');
};

/**
 * Generate Excel template for Vehicles
 */
export const generateVehicleTemplate = () => {
  const templateData = [
    {
      'Plate Number': 'ABC1234',
      'Registration Type': 'Private',
      'Brand': 'Toyota',
      'Model': 'Camry',
      'Year of Manufacture': 2023,
      'Serial Number': 'SEQ001',
      'Chassis Number': 'CHASSIS123456',
      'Basic Color': 'White',
      'License Expiry Date': '2025-12-31',
      'Inspection Expiry Date': '2025-06-30',
      'Actual User ID Number': '1234567890',
      'Actual User Name': 'John Doe',
      'Inspection Status': 'Valid',
      'Insurance Status': 'Valid'
    },
    {
      'Plate Number': 'XYZ5678',
      'Registration Type': 'Commercial',
      'Brand': 'Honda',
      'Model': 'Accord',
      'Year of Manufacture': 2024,
      'Serial Number': 'SEQ002',
      'Chassis Number': 'CHASSIS789012',
      'Basic Color': 'Black',
      'License Expiry Date': '2026-01-15',
      'Inspection Expiry Date': '2025-07-20',
      'Actual User ID Number': '0987654321',
      'Actual User Name': 'Jane Smith',
      'Inspection Status': 'Valid',
      'Insurance Status': 'Valid'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 15 }, // Plate Number
    { wch: 18 }, // Registration Type
    { wch: 15 }, // Brand
    { wch: 15 }, // Model
    { wch: 18 }, // Year of Manufacture
    { wch: 15 }, // Serial Number
    { wch: 20 }, // Chassis Number
    { wch: 15 }, // Basic Color
    { wch: 20 }, // License Expiry Date
    { wch: 22 }, // Inspection Expiry Date
    { wch: 22 }, // Actual User ID Number
    { wch: 20 }, // Actual User Name
    { wch: 18 }, // Inspection Status
    { wch: 18 }  // Insurance Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Vehicles Template');
  XLSX.writeFile(wb, 'Vehicles_Template.xlsx');
};

/**
 * Generate Excel template for Electricity
 */
export const generateElectricityTemplate = () => {
  const templateData = [
    {
      'No.': '1',
      'Account': 'ACC-001',
      'Name': 'GTS Company',
      'City': 'Riyadh',
      'Address': 'Main Street, Building 5',
      'Project': 'Project A',
      'Division': 'Division 1',
      'Meter Number': 'MTR-2024-001',
      'Date': '2025-01-01'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateData);

  ws['!cols'] = [
    { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 25 },
    { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Electricity Template');
  XLSX.writeFile(wb, 'Electricity_Template.xlsx');
};