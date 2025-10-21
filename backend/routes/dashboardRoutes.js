const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const HomeRent = require('../models/HomeRent');
const Electricity = require('../models/Electricity');

// GET dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Vehicle stats
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ vehicleStatus: 'Active' });
    const expiredVehicles = await Vehicle.countDocuments({
      $or: [
        { licenseExpiryDate: { $lt: today } },
        { inspectionExpiryDate: { $lt: today } }
      ]
    });

    // Home rent stats
    const totalHomeRents = await HomeRent.countDocuments();
    const activeHomeRents = await HomeRent.countDocuments({ contractStatus: 'Active' });
    const expiredContracts = await HomeRent.countDocuments({
      contractEndingDate: { $lt: today }
    });

    // Electricity stats
    const totalElectricityBills = await Electricity.countDocuments();
    const pendingBills = await Electricity.countDocuments({ paymentStatus: 'Pending' });
    const overdueBills = await Electricity.countDocuments({ paymentStatus: 'Overdue' });
    const paidBills = await Electricity.countDocuments({ paymentStatus: 'Paid' });

    res.json({
      vehicles: {
        total: totalVehicles,
        active: activeVehicles,
        expired: expiredVehicles,
        warning: totalVehicles - activeVehicles - expiredVehicles
      },
      homeRents: {
        total: totalHomeRents,
        active: activeHomeRents,
        expired: expiredContracts,
        warning: totalHomeRents - activeHomeRents - expiredContracts
      },
      electricity: {
        total: totalElectricityBills,
        pending: pendingBills,
        overdue: overdueBills,
        paid: paidBills
      },
      summary: {
        totalItems: totalVehicles + totalHomeRents + totalElectricityBills,
        activeItems: activeVehicles + activeHomeRents,
        needsAttention: expiredVehicles + expiredContracts + overdueBills
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET counts for all items
router.get('/counts', async (req, res) => {
  try {
    const vehicleCount = await Vehicle.countDocuments();
    const homeRentCount = await HomeRent.countDocuments();
    const electricityCount = await Electricity.countDocuments();

    res.json({
      vehicles: vehicleCount,
      homeRents: homeRentCount,
      electricity: electricityCount,
      total: vehicleCount + homeRentCount + electricityCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router