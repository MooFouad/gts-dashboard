const mongoose = require('mongoose');

const mvpiSchema = new mongoose.Schema({
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
  // MVPI (MOTOR VEHICLE PERIODIC INSPECTION) DETAILS
  // ============================================

  // Inspection Report Number (رقم تقرير الفحص)
  inspectionReportNumber: {
    type: String,
    trim: true
  },

  // Inspection Center Name (اسم مركز الفحص)
  inspectionCenterName: {
    type: String,
    trim: true
  },

  // Inspection Date (تاريخ الفحص)
  inspectionDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },

  // Inspection Expiry Date (تاريخ انتهاء الفحص)
  inspectionExpiryDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },

  // Inspection Result (نتيجة الفحص)
  inspectionResult: {
    type: String,
    trim: true
  },

  // Inspection Status (حالة الفحص)
  inspectionStatus: {
    type: String,
    trim: true
  },

  // Vehicle Maker (الصانع)
  maker: {
    type: String,
    trim: true
  },

  // Vehicle Model (الطراز)
  model: {
    type: String,
    trim: true
  },

  // Model Year (سنة الصنع)
  modelYear: {
    type: Number
  },

  // Vehicle Color (اللون)
  color: {
    type: String,
    trim: true
  },

  // Odometer Reading (قراءة عداد المسافات)
  odometerReading: {
    type: Number
  },

  // Inspector Name (اسم الفاحص)
  inspectorName: {
    type: String,
    trim: true
  },

  // Inspection Fee (رسوم الفحص)
  inspectionFee: {
    type: Number
  },

  // Notes/Remarks (ملاحظات)
  notes: {
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
mvpiSchema.index({ plateNumber: 1 });
mvpiSchema.index({ inspectionReportNumber: 1 });
mvpiSchema.index({ inspectionExpiryDate: 1 });
mvpiSchema.index({ status: 1 });
mvpiSchema.index({ dataSource: 1 });

// Add query timeout
mvpiSchema.pre('find', function() {
  this.maxTimeMS(5000);
});

// Pre-save middleware to validate dates and update status
mvpiSchema.pre('save', function(next) {
  // Validate and clean up dates
  if (this.inspectionDate && isNaN(this.inspectionDate.getTime())) {
    this.inspectionDate = null;
  }
  if (this.inspectionExpiryDate && isNaN(this.inspectionExpiryDate.getTime())) {
    this.inspectionExpiryDate = null;
  }

  // Auto-update status based on inspection expiry date
  const now = new Date();
  const warningThreshold = new Date(now);
  warningThreshold.setDate(warningThreshold.getDate() + 30); // 30 days warning

  if (this.inspectionExpiryDate && !isNaN(this.inspectionExpiryDate.getTime())) {
    if (this.inspectionExpiryDate < now) {
      this.status = 'expired';
    } else if (this.inspectionExpiryDate < warningThreshold) {
      this.status = 'warning';
    } else {
      this.status = 'valid';
    }
  } else {
    this.status = 'valid';
  }

  next();
});

module.exports = mongoose.model('MVPI', mvpiSchema);
