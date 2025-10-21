// Mock data for guest/demo users
// This data is shown to guests instead of real database data

const mockVehicles = [
  {
    _id: 'mock-vehicle-1',
    plateNumber: 'ABC-123',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licenseExpiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    inspectionExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    insuranceExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-2',
    plateNumber: 'XYZ-789',
    make: 'Honda',
    model: 'Accord',
    year: 2021,
    licenseExpiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago (expired)
    inspectionExpiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
    insuranceExpiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-3',
    plateNumber: 'DEF-456',
    make: 'Mercedes-Benz',
    model: 'E-Class',
    year: 2023,
    licenseExpiryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
    inspectionExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    insuranceExpiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days from now
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date()
  }
];

const mockHomeRents = [
  {
    _id: 'mock-rent-1',
    propertyAddress: '123 King Street, Riyadh',
    landlordName: 'Ahmed Al-Saud',
    landlordPhone: '+966-50-123-4567',
    monthlyRent: 5000,
    contractStartDate: new Date('2024-01-01').toISOString(),
    contractEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
    paymentDay: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-rent-2',
    propertyAddress: '456 Prince Mohammed Bin Abdulaziz, Jeddah',
    landlordName: 'Fatima Hassan',
    landlordPhone: '+966-55-987-6543',
    monthlyRent: 7500,
    contractStartDate: new Date('2023-06-01').toISOString(),
    contractEndDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days from now
    paymentDay: 5,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date()
  }
];

const mockElectricity = [
  {
    _id: 'mock-elec-1',
    propertyAddress: '123 King Street, Riyadh',
    accountNumber: 'ELEC-2024-001',
    meterNumber: 'MTR-12345',
    billDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    billAmount: 450,
    isPaid: false,
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-elec-2',
    propertyAddress: '456 Prince Mohammed Bin Abdulaziz, Jeddah',
    accountNumber: 'ELEC-2024-002',
    meterNumber: 'MTR-67890',
    billDueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    billAmount: 680,
    isPaid: false,
    createdAt: new Date('2024-09-05'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-elec-3',
    propertyAddress: '789 Tahlia Street, Riyadh',
    accountNumber: 'ELEC-2024-003',
    meterNumber: 'MTR-11223',
    billDueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago (overdue)
    billAmount: 520,
    isPaid: false,
    createdAt: new Date('2024-08-25'),
    updatedAt: new Date()
  }
];

module.exports = {
  mockVehicles,
  mockHomeRents,
  mockElectricity
};
