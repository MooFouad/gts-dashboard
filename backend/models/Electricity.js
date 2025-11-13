const mongoose = require('mongoose');

const electricitySchema = new mongoose.Schema({
  no: {
    type: String
  },
  account: {
    type: String
  },
  name: {
    type: String
  },
  city: {
    type: String
  },
  address: {
    type: String
  },
  project: {
    type: String
  },
  division: {
    type: String
  },
  meterNumber: {
    type: String
  },
  date: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  currentReading: {
    type: Number,
    default: 0
  },
  previousReading: {
    type: Number,
    default: 0
  },
  consumption: {
    type: Number,
    default: 0
  },
  alertThreshold: {
    type: Number,
    default: 0
  },
  consumptionAlert: {
    type: Boolean,
    default: false
  },
  attachments: {
    type: Array
  }
}, {
  timestamps: true
});

// Indexes
electricitySchema.index({ account: 1 });
electricitySchema.index({ meterNumber: 1 });
electricitySchema.index({ no: 1 });

module.exports = mongoose.model('Electricity', electricitySchema);
