const mongoose = require('mongoose');

const absherSchema = new mongoose.Schema({
  // ============================================
  // ORIGINAL API FIELDS FROM ISTEMARAH RENEWAL
  // ============================================

  // Sequence Number (رقم التسلسل)
  sequenceNumber: {
    type: Number,
    trim: true
  },

  // Plate Info (معلومات اللوحة)
  plateInfo: {
    type: String,
    trim: true
  },

  // Plate Type (نوع اللوحة)
  plateType: {
    type: mongoose.Schema.Types.Mixed // Object with code, nameAr, nameEn
  },

  // Plate Type Code (رمز نوع اللوحة)
  plateTypeCode: {
    type: Number
  },

  // Maker (الصانع)
  maker: {
    type: String,
    trim: true
  },

  // Model (الطراز)
  model: {
    type: String,
    trim: true
  },

  // Model Year (سنة الصنع)
  modelYear: {
    type: Number
  },

  // Major Color (اللون الرئيسي)
  majorColor: {
    type: String,
    trim: true
  },

  // Created Date (تاريخ الإنشاء)
  createdDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },

  // Renewal Expiry Date (تاريخ انتهاء التجديد)
  renewalExpiryDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },

  // Actual Driver ID Number (رقم هوية السائق الفعلي)
  actualDriverIdNumber: {
    type: String,
    trim: true
  },

  // Actual Driver Name (اسم السائق الفعلي)
  actualDriverName: {
    type: String,
    trim: true
  },

  // Owner ID Number (رقم هوية المالك)
  ownerIdNumber: {
    type: String,
    trim: true
  },

  // Owner Name (اسم المالك)
  ownerName: {
    type: String,
    trim: true
  },

  // Trace ID (معرف التتبع)
  traceId: {
    type: String,
    trim: true
  },

  // Operator ID Number (رقم هوية المشغل)
  operatorIdNumber: {
    type: Number
  },

  // Branch Name (اسم الفرع)
  branchName: {
    type: mongoose.Schema.Types.Mixed // Object with ar and en
  },

  // ============================================
  // LEGACY FIELDS FOR COMPATIBILITY
  // ============================================

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
    required: false,
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

  // Plate Number (رقم اللوحة)
  plateNumber: {
    type: String,
    trim: true
  },

  // Owner ID (old field)
  ownerId: {
    type: String,
    trim: true
  },

  // Vehicle Type
  vehicleType: {
    type: String,
    trim: true
  },

  // Notes
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
