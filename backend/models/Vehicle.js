const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  plateNumber: { type: String },
  registrationType: { type: String },
  vehicleMaker: { type: String },
  vehicleModel: { type: String },
  modelYear: { type: Number },
  sequenceNumber: { type: String },
  chassisNumber: { type: String },
  basicColor: { type: String },
  licenseExpiryDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },
  inspectionExpiryDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },
  actualDriverId: { type: String },
  actualDriverName: { type: String },
  inspectionStatus: { type: String },
  insuranceStatus: { type: String },
  insuranceCompany: { type: String },
  insurancePolicyNumber: { type: String },
  insuranceExpiryDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },
  renewalRequestId: { type: String },
  renewalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: null
  },
  renewalFees: { type: Number },
  renewalExpiryDate: {
    type: Date,
    set: v => v ? new Date(v) : null
  },
  lastRenewalRequestDate: { type: Date },
  dataSource: {
    type: String,
    enum: ['manual', 'absher', 'import'],
    default: 'manual'
  },
  lastSyncDate: { type: Date },
  attachments: [{ type: Object }],
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Add indexes for better performance
vehicleSchema.index({ plateNumber: 1 });
vehicleSchema.index({ licenseExpiryDate: 1 });
vehicleSchema.index({ inspectionExpiryDate: 1 });
vehicleSchema.index({ insuranceExpiryDate: 1 });
vehicleSchema.index({ renewalExpiryDate: 1 });
vehicleSchema.index({ renewalStatus: 1 });
vehicleSchema.index({ dataSource: 1 });

// Add query timeout
vehicleSchema.pre('find', function() {
  this.maxTimeMS(5000);
});

// Add pre-save middleware to ensure dates are valid
vehicleSchema.pre('save', function(next) {
  if (this.licenseExpiryDate && isNaN(this.licenseExpiryDate.getTime())) {
    this.licenseExpiryDate = null;
  }
  if (this.inspectionExpiryDate && isNaN(this.inspectionExpiryDate.getTime())) {
    this.inspectionExpiryDate = null;
  }
  if (this.insuranceExpiryDate && isNaN(this.insuranceExpiryDate.getTime())) {
    this.insuranceExpiryDate = null;
  }
  if (this.renewalExpiryDate && isNaN(this.renewalExpiryDate.getTime())) {
    this.renewalExpiryDate = null;
  }
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);