// In-memory session store for guest users
// Allows guests to perform CRUD operations without touching the database

const { mockVehicles, mockHomeRents, mockElectricity } = require('../data/guestMockData');

class GuestSessionStore {
  constructor() {
    // Store guest sessions: { userId: { vehicles: [], homeRents: [], electricity: [] } }
    this.sessions = new Map();

    // Clean up old sessions every hour
    setInterval(() => this.cleanupOldSessions(), 60 * 60 * 1000);
  }

  // Initialize a new guest session with mock data
  // In production: empty arrays (0 items)
  // In development: full mock data (15 items each)
  initSession(userId) {
    if (!this.sessions.has(userId)) {
      const isProduction = process.env.NODE_ENV === 'production';

      this.sessions.set(userId, {
        vehicles: isProduction ? [] : JSON.parse(JSON.stringify(mockVehicles)),
        homeRents: isProduction ? [] : JSON.parse(JSON.stringify(mockHomeRents)),
        electricity: isProduction ? [] : JSON.parse(JSON.stringify(mockElectricity)),
        createdAt: new Date()
      });

      if (isProduction) {
        console.log(`✨ Created new guest session (PRODUCTION - empty data): ${userId}`);
      } else {
        console.log(`✨ Created new guest session (DEVELOPMENT - with mock data): ${userId}`);
      }
    }
    return this.sessions.get(userId);
  }

  // Get guest session (create if doesn't exist)
  getSession(userId) {
    return this.initSession(userId);
  }

  // Clear a specific session
  clearSession(userId) {
    this.sessions.delete(userId);
    console.log(`🗑️ Cleared guest session: ${userId}`);
  }

  // Clean up sessions older than 24 hours
  cleanupOldSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.createdAt > maxAge) {
        this.sessions.delete(userId);
        console.log(`🧹 Cleaned up expired guest session: ${userId}`);
      }
    }
  }

  // ==================== VEHICLES ====================

  getVehicles(userId) {
    const session = this.getSession(userId);
    return session.vehicles;
  }

  getVehicle(userId, vehicleId) {
    const session = this.getSession(userId);
    return session.vehicles.find(v => v._id === vehicleId);
  }

  createVehicle(userId, vehicleData) {
    const session = this.getSession(userId);
    const newVehicle = {
      _id: `guest-vehicle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...vehicleData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    session.vehicles.push(newVehicle);
    return newVehicle;
  }

  updateVehicle(userId, vehicleId, updates) {
    const session = this.getSession(userId);
    const index = session.vehicles.findIndex(v => v._id === vehicleId);
    if (index === -1) return null;

    session.vehicles[index] = {
      ...session.vehicles[index],
      ...updates,
      _id: vehicleId, // Preserve ID
      updatedAt: new Date()
    };
    return session.vehicles[index];
  }

  deleteVehicle(userId, vehicleId) {
    const session = this.getSession(userId);
    const index = session.vehicles.findIndex(v => v._id === vehicleId);
    if (index === -1) return false;

    session.vehicles.splice(index, 1);
    return true;
  }

  // ==================== HOME RENTS ====================

  getHomeRents(userId) {
    const session = this.getSession(userId);
    return session.homeRents;
  }

  getHomeRent(userId, rentId) {
    const session = this.getSession(userId);
    return session.homeRents.find(r => r._id === rentId);
  }

  createHomeRent(userId, rentData) {
    const session = this.getSession(userId);
    const newRent = {
      _id: `guest-rent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...rentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    session.homeRents.push(newRent);
    return newRent;
  }

  updateHomeRent(userId, rentId, updates) {
    const session = this.getSession(userId);
    const index = session.homeRents.findIndex(r => r._id === rentId);
    if (index === -1) return null;

    session.homeRents[index] = {
      ...session.homeRents[index],
      ...updates,
      _id: rentId,
      updatedAt: new Date()
    };
    return session.homeRents[index];
  }

  deleteHomeRent(userId, rentId) {
    const session = this.getSession(userId);
    const index = session.homeRents.findIndex(r => r._id === rentId);
    if (index === -1) return false;

    session.homeRents.splice(index, 1);
    return true;
  }

  // ==================== ELECTRICITY ====================

  getElectricity(userId) {
    const session = this.getSession(userId);
    return session.electricity;
  }

  getElectricityBill(userId, billId) {
    const session = this.getSession(userId);
    return session.electricity.find(e => e._id === billId);
  }

  createElectricityBill(userId, billData) {
    const session = this.getSession(userId);
    const newBill = {
      _id: `guest-elec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...billData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    session.electricity.push(newBill);
    return newBill;
  }

  updateElectricityBill(userId, billId, updates) {
    const session = this.getSession(userId);
    const index = session.electricity.findIndex(e => e._id === billId);
    if (index === -1) return null;

    session.electricity[index] = {
      ...session.electricity[index],
      ...updates,
      _id: billId,
      updatedAt: new Date()
    };
    return session.electricity[index];
  }

  deleteElectricityBill(userId, billId) {
    const session = this.getSession(userId);
    const index = session.electricity.findIndex(e => e._id === billId);
    if (index === -1) return false;

    session.electricity.splice(index, 1);
    return true;
  }
}

// Singleton instance
const guestSessionStore = new GuestSessionStore();

module.exports = guestSessionStore;
