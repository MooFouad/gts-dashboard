const mongoose = require('mongoose');

const insuranceSchema = new mongoose.Schema({
  // ============================================
  // VEHICLE IDENTIFICATION
  // ============================================

  // Plate Number (رقم اللوحة)
  plateNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // Sequence Number (رقم التسلسل)
  sequenceNumber: {
    type: Number,
    trim: true
  },

  // ============================================
  // INSURANCE DETAILS FROM TAMM API
  // ============================================

  // Insurance Company Name (اسم شركة التأمين)
  insuranceCompanyName: {
    type: String,
    trim: true
  },

  // Main Policy Number (رقم وثيقة التأمين الرئيسية)
  mainPolicyNumber: {
    type: String,
    trim: true
  },

  // Policy Status (حالة الوثيقة)
  policyStatus: {
    type: String,
    trim: true
  },

  // Policy Start Date (تاريخ بداية الوثيقة)
  policyStartDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },

  // Policy End Date (تاريخ انتهاء الوثيقة)
  policyEndDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },

  // Insurance Type (نوع التأمين)
  insuranceType: {
    type: String,
    trim: true
  },

  // Coverage Amount (مبلغ التغطية)
  coverageAmount: {
    type: Number
  },

  // Policy Holder Name (اسم حامل الوثيقة)
  policyHolderName: {
    type: String,
    trim: true
  },

  // Policy Holder ID (رقم هوية حامل الوثيقة)
  policyHolderIdNumber: {
    type: String,
    trim: true
  },

  // ============================================
  // STATUS TRACKING
  // ============================================

  // Status based on expiry date
  status: {
    type: String,
    enum: ['valid', 'warning', 'expired'],
    default: 'valid'
  },

  // Data source tracking
  dataSource: {
    type: String,
    enum: ['manual', 'absher', 'import'],
    default: 'absher'
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
insuranceSchema.index({ plateNumber: 1 });
insuranceSchema.index({ mainPolicyNumber: 1 });
insuranceSchema.index({ policyEndDate: 1 });
insuranceSchema.index({ status: 1 });
insuranceSchema.index({ dataSource: 1 });

// Add query timeout
insuranceSchema.pre('find', function() {
  this.maxTimeMS(5000);
});

// Pre-save middleware to validate dates and update status
insuranceSchema.pre('save', function(next) {
  // Validate and clean up dates
  if (this.policyStartDate && isNaN(this.policyStartDate.getTime())) {
    this.policyStartDate = null;
  }
  if (this.policyEndDate && isNaN(this.policyEndDate.getTime())) {
    this.policyEndDate = null;
  }

  // Auto-update status based on policy end date
  const now = new Date();
  const warningThreshold = new Date(now);
  warningThreshold.setDate(warningThreshold.getDate() + 30); // 30 days warning

  if (this.policyEndDate && !isNaN(this.policyEndDate.getTime())) {
    if (this.policyEndDate < now) {
      this.status = 'expired';
    } else if (this.policyEndDate < warningThreshold) {
      this.status = 'warning';
    } else {
      this.status = 'valid';
    }
  } else {
    this.status = 'valid';
  }

  next();
});

module.exports = mongoose.model('Insurance', insuranceSchema);
