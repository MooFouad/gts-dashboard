const mongoose = require('mongoose');

const absherSchema = new mongoose.Schema({
  // ID/Reference Number (رقم المرجع / رقم الاستمارة)
  referenceNumber: {
    type: String,
    required: true,
    trim: true
  },

  // Name (اسم المركبة / اسم المالك)
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Issue Date (تاريخ الإصدار)
  issueDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },

  // Registration Expiry Date (تاريخ انتهاء الاستمارة)
  expiryDate: {
    type: Date,
    required: false, // Changed to false to allow syncing from vehicles without dates
    set: v => v ? new Date(v) : null
  },

  // Inspection Expiry Date (تاريخ انتهاء الفحص الدوري)
  inspectionExpiryDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },

  // License Expiry Date (تاريخ انتهاء رخصة القيادة)
  licenseExpiryDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },

  // Additional optional fields
  plateNumber: {
    type: String,
    trim: true
  },

  ownerName: {
    type: String,
    trim: true
  },

  ownerId: {
    type: String,
    trim: true
  },

  vehicleType: {
    type: String,
    trim: true
  },

  notes: {
    type: String,
    trim: true
  },

  // Status tracking
  status: {
    type: String,
    enum: ['valid', 'warning', 'expired'],
    default: 'valid'
  },

  // Data source tracking
  dataSource: {
    type: String,
    enum: ['manual', 'absher', 'vehicles', 'import'],
    default: 'manual'
  },

  lastSyncDate: {
    type: Date
  },

  // System fields
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Add indexes for better performance
absherSchema.index({ referenceNumber: 1 });
absherSchema.index({ expiryDate: 1 });
absherSchema.index({ inspectionExpiryDate: 1 });
absherSchema.index({ licenseExpiryDate: 1 });
absherSchema.index({ status: 1 });
absherSchema.index({ dataSource: 1 });

// Add query timeout
absherSchema.pre('find', function() {
  this.maxTimeMS(5000);
});

// Pre-save middleware to validate dates and update status
absherSchema.pre('save', function(next) {
  // Validate and clean up dates
  if (this.issueDate && isNaN(this.issueDate.getTime())) {
    this.issueDate = null;
  }
  if (this.expiryDate && isNaN(this.expiryDate.getTime())) {
    this.expiryDate = null;
  }
  if (this.inspectionExpiryDate && isNaN(this.inspectionExpiryDate.getTime())) {
    this.inspectionExpiryDate = null;
  }
  if (this.licenseExpiryDate && isNaN(this.licenseExpiryDate.getTime())) {
    this.licenseExpiryDate = null;
  }

  // Auto-update status based on expiry dates
  const now = new Date();
  const warningThreshold = new Date(now);
  warningThreshold.setDate(warningThreshold.getDate() + 30); // 30 days warning

  const dates = [
    this.expiryDate,
    this.inspectionExpiryDate,
    this.licenseExpiryDate
  ].filter(date => date && !isNaN(date.getTime()));

  if (dates.length === 0) {
    this.status = 'valid';
  } else {
    const earliestExpiry = new Date(Math.min(...dates));

    if (earliestExpiry < now) {
      this.status = 'expired';
    } else if (earliestExpiry < warningThreshold) {
      this.status = 'warning';
    } else {
      this.status = 'valid';
    }
  }

  next();
});

module.exports = mongoose.model('Absher', absherSchema);
