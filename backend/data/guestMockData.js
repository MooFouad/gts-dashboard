// Mock data for guest/demo users
// This data is shown to guests instead of real database data
// 10 items for each type

const mockVehicles = [
  {
    _id: 'mock-vehicle-1',
    plateNumber: 'ABC-123',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licenseExpiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    inspectionExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    inspectionExpiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-3',
    plateNumber: 'DEF-456',
    make: 'Mercedes-Benz',
    model: 'E-Class',
    year: 2023,
    licenseExpiryDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    inspectionExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-4',
    plateNumber: 'GHI-321',
    make: 'BMW',
    model: '5 Series',
    year: 2022,
    licenseExpiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    inspectionExpiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-5',
    plateNumber: 'JKL-654',
    make: 'Nissan',
    model: 'Altima',
    year: 2020,
    licenseExpiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    inspectionExpiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-6',
    plateNumber: 'MNO-987',
    make: 'Hyundai',
    model: 'Sonata',
    year: 2021,
    licenseExpiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    inspectionExpiryDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-7',
    plateNumber: 'PQR-147',
    make: 'Lexus',
    model: 'ES 350',
    year: 2023,
    licenseExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    inspectionExpiryDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-8',
    plateNumber: 'STU-258',
    make: 'Chevrolet',
    model: 'Malibu',
    year: 2020,
    licenseExpiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Expired
    inspectionExpiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-9',
    plateNumber: 'VWX-369',
    make: 'Audi',
    model: 'A4',
    year: 2022,
    licenseExpiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    inspectionExpiryDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-vehicle-10',
    plateNumber: 'YZA-741',
    make: 'Mazda',
    model: 'Mazda6',
    year: 2021,
    licenseExpiryDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    inspectionExpiryDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
    insuranceExpiryDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date('2024-01-25'),
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
    contractEndDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days
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
    contractEndDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    paymentDay: 5,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-rent-3',
    propertyAddress: '789 Tahlia Street, Riyadh',
    landlordName: 'Omar Abdullah',
    landlordPhone: '+966-50-456-7890',
    monthlyRent: 6000,
    contractStartDate: new Date('2024-02-01').toISOString(),
    contractEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    paymentDay: 10,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-rent-4',
    propertyAddress: '321 Al Olaya, Riyadh',
    landlordName: 'Sara Mohammed',
    landlordPhone: '+966-55-234-5678',
    monthlyRent: 8000,
    contractStartDate: new Date('2023-12-01').toISOString(),
    contractEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // Expiring soon
    paymentDay: 15,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-rent-5',
    propertyAddress: '654 Corniche Road, Dammam',
    landlordName: 'Khalid Ibrahim',
    landlordPhone: '+966-50-789-0123',
    monthlyRent: 5500,
    contractStartDate: new Date('2024-03-01').toISOString(),
    contractEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    paymentDay: 1,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-rent-6',
    propertyAddress: '147 King Fahd Road, Riyadh',
    landlordName: 'Layla Ahmed',
    landlordPhone: '+966-55-345-6789',
    monthlyRent: 7000,
    contractStartDate: new Date('2023-09-01').toISOString(),
    contractEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Expired
    paymentDay: 20,
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-rent-7',
    propertyAddress: '258 Al Khobar, Eastern Province',
    landlordName: 'Hassan Ali',
    landlordPhone: '+966-50-567-8901',
    monthlyRent: 6500,
    contractStartDate: new Date('2024-01-15').toISOString(),
    contractEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    paymentDay: 5,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-rent-8',
    propertyAddress: '369 Al Malqa, Riyadh',
    landlordName: 'Nora Khalid',
    landlordPhone: '+966-55-678-9012',
    monthlyRent: 5200,
    contractStartDate: new Date('2023-11-01').toISOString(),
    contractEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    paymentDay: 10,
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-rent-9',
    propertyAddress: '741 Al Yasmin, Riyadh',
    landlordName: 'Abdullah Fahad',
    landlordPhone: '+966-50-890-1234',
    monthlyRent: 9000,
    contractStartDate: new Date('2024-02-15').toISOString(),
    contractEndDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
    paymentDay: 1,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-rent-10',
    propertyAddress: '852 Al Muruj, Riyadh',
    landlordName: 'Maha Salem',
    landlordPhone: '+966-55-901-2345',
    monthlyRent: 6800,
    contractStartDate: new Date('2023-10-01').toISOString(),
    contractEndDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
    paymentDay: 25,
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date()
  }
];

const mockElectricity = [
  {
    _id: 'mock-elec-1',
    propertyAddress: '123 King Street, Riyadh',
    accountNumber: 'ELEC-2024-001',
    meterNumber: 'MTR-12345',
    billDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
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
    billDueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
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
    billDueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Overdue
    billAmount: 520,
    isPaid: false,
    createdAt: new Date('2024-08-25'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-elec-4',
    propertyAddress: '321 Al Olaya, Riyadh',
    accountNumber: 'ELEC-2024-004',
    meterNumber: 'MTR-44556',
    billDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    billAmount: 390,
    isPaid: false,
    createdAt: new Date('2024-09-10'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-elec-5',
    propertyAddress: '654 Corniche Road, Dammam',
    accountNumber: 'ELEC-2024-005',
    meterNumber: 'MTR-77889',
    billDueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // Overdue
    billAmount: 755,
    isPaid: false,
    createdAt: new Date('2024-08-20'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-elec-6',
    propertyAddress: '147 King Fahd Road, Riyadh',
    accountNumber: 'ELEC-2024-006',
    meterNumber: 'MTR-99001',
    billDueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    billAmount: 425,
    isPaid: true, // Paid
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-elec-7',
    propertyAddress: '258 Al Khobar, Eastern Province',
    accountNumber: 'ELEC-2024-007',
    meterNumber: 'MTR-22334',
    billDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    billAmount: 590,
    isPaid: false,
    createdAt: new Date('2024-09-08'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-elec-8',
    propertyAddress: '369 Al Malqa, Riyadh',
    accountNumber: 'ELEC-2024-008',
    meterNumber: 'MTR-55667',
    billDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    billAmount: 410,
    isPaid: false,
    createdAt: new Date('2024-09-12'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-elec-9',
    propertyAddress: '741 Al Yasmin, Riyadh',
    accountNumber: 'ELEC-2024-009',
    meterNumber: 'MTR-88990',
    billDueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // Very overdue
    billAmount: 820,
    isPaid: false,
    createdAt: new Date('2024-08-10'),
    updatedAt: new Date()
  },
  {
    _id: 'mock-elec-10',
    propertyAddress: '852 Al Muruj, Riyadh',
    accountNumber: 'ELEC-2024-010',
    meterNumber: 'MTR-11223',
    billDueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    billAmount: 495,
    isPaid: true, // Paid
    createdAt: new Date('2024-09-03'),
    updatedAt: new Date()
  }
];

module.exports = {
  mockVehicles,
  mockHomeRents,
  mockElectricity
};
