const mongoose = require('mongoose');

/**
 * GOSI Model
 * Stores complete data from GOSI API (Engagement Deduction)
 */

const gosiSchema = new mongoose.Schema({
  // Employee National ID / Iqama (unique identifier)
  nin: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },

  // Employee Name
  name: {
    type: String,
    trim: true
  },

  // Employee Name in Arabic
  nameAr: {
    type: String,
    trim: true
  },

  // Contributor Type (Saudi/Non-Saudi)
  contributorType: {
    type: String,
    trim: true
  },

  // Establishment Registration Number
  establishmentRegNumber: {
    type: String,
    trim: true
  },

  // Establishment Name
  establishmentName: {
    type: String,
    trim: true
  },

  // Engagement Start Date
  engagementStartDate: {
    type: Date
  },

  // Engagement End Date
  engagementEndDate: {
    type: Date
  },

  // Engagement Status
  engagementStatus: {
    type: String,
    trim: true
  },

  // Occupation
  occupation: {
    type: String,
    trim: true
  },

  // Occupation Code
  occupationCode: {
    type: String,
    trim: true
  },

  // Wage
  wage: {
    type: Number
  },

  // Currency
  currency: {
    type: String,
    default: 'SAR'
  },

  // Social Insurance Products (Array)
  products: [{
    productCode: String,
    productName: String,
    productNameAr: String,
    employerContribution: Number,
    employeeContribution: Number,
    totalContribution: Number,
    deductionRate: Number,
    subscribedDate: Date,
    coverage: String
  }],

  // Total Employer Contribution
  totalEmployerContribution: {
    type: Number,
    default: 0
  },

  // Total Employee Contribution
  totalEmployeeContribution: {
    type: Number,
    default: 0
  },

  // Total Contribution
  totalContribution: {
    type: Number,
    default: 0
  },

  // Full GOSI API Response (for reference)
  fullApiResponse: {
    type: mongoose.Schema.Types.Mixed
  },

  // Last Sync Date
  lastSyncDate: {
    type: Date,
    default: Date.now
  },

  // Status (derived from engagement status)
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active'
  },

  // Notes
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: Days until engagement ends
gosiSchema.virtual('daysUntilEnd').get(function() {
  if (!this.engagementEndDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(this.engagementEndDate);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
});

// Indexes for performance
gosiSchema.index({ nin: 1 });
gosiSchema.index({ engagementStartDate: 1 });
gosiSchema.index({ engagementEndDate: 1 });
gosiSchema.index({ status: 1 });
gosiSchema.index({ establishmentRegNumber: 1 });

// Pre-save middleware to calculate totals and update status
gosiSchema.pre('save', function(next) {
  // Calculate totals from products
  if (this.products && this.products.length > 0) {
    this.totalEmployerContribution = this.products.reduce((sum, p) => sum + (p.employerContribution || 0), 0);
    this.totalEmployeeContribution = this.products.reduce((sum, p) => sum + (p.employeeContribution || 0), 0);
    this.totalContribution = this.totalEmployerContribution + this.totalEmployeeContribution;
  }

  // Update status based on engagement dates
  const today = new Date();

  if (this.engagementEndDate && this.engagementEndDate < today) {
    this.status = 'terminated';
  } else if (this.engagementStartDate && this.engagementStartDate <= today) {
    this.status = 'active';
  } else {
    this.status = 'inactive';
  }

  next();
});

module.exports = mongoose.model('GOSI', gosiSchema);
