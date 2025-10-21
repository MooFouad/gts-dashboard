const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const HomeRent = require('../models/HomeRent');
const Electricity = require('../models/Electricity');
const guestSessionStore = require('../services/guestSessionStore');

// GET dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Guest users - calculate stats from session store
    if (req.user && req.user.isGuest) {
      const vehicles = guestSessionStore.getVehicles(req.user._id);
      const homeRents = guestSessionStore.getHomeRents(req.user._id);
      const electricity = guestSessionStore.getElectricity(req.user._id);

      // Calculate vehicle stats
      const totalVehicles = vehicles.length;
      const expiredVehicles = vehicles.filter(v =>
        (v.licenseExpiryDate && v.licenseExpiryDate < today) ||
        (v.inspectionExpiryDate && v.inspectionExpiryDate < today)
      ).length;
      const activeVehicles = totalVehicles - expiredVehicles;

      // Calculate home rent stats
      const totalHomeRents = homeRents.length;
      const expiredContracts = homeRents.filter(r =>
        r.contractEndDate && r.contractEndDate < today
      ).length;
      const activeHomeRents = totalHomeRents - expiredContracts;

      // Calculate electricity stats
      const totalElectricityBills = electricity.length;
      const paidBills = electricity.filter(e => e.isPaid === true).length;
      const overdueBills = electricity.filter(e => !e.isPaid && e.billDueDate < today).length;
      const pendingBills = totalElectricityBills - paidBills - overdueBills;

      return res.json({
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
        },
        isDemo: true
      });
    }

    // Real user - query database
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
    // Guest users - count from session store
    if (req.user && req.user.isGuest) {
      const vehicles = guestSessionStore.getVehicles(req.user._id);
      const homeRents = guestSessionStore.getHomeRents(req.user._id);
      const electricity = guestSessionStore.getElectricity(req.user._id);

      return res.json({
        vehicles: vehicles.length,
        homeRents: homeRents.length,
        electricity: electricity.length,
        total: vehicles.length + homeRents.length + electricity.length,
        isDemo: true
      });
    }

    // Real user - count from database
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

module.exports = router;