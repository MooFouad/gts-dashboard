const mongoose = require('mongoose');

const socialInsuranceSchema = new mongoose.Schema({
  // Employee Name (اسم الموظف)
  name: {
    type: String,
    trim: true,
    default: ''
  },

  // National ID / Iqama Number (رقم الهوية / الإقامة)
  nin: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },

  // Division / Department (القسم)
  division: {
    type: String,
    trim: true,
    default: ''
  },

  // Start Date (تاريخ البداية)
  startDate: {
    type: Date
  },

  // End Date / Expiry Date (تاريخ الانتهاء)
  endDate: {
    type: Date
  },

  // Status indicator
  status: {
    type: String,
    enum: ['active', 'expired', 'expiring-soon'],
    default: 'active'
  },

  // Notes (optional)
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to calculate remaining days
socialInsuranceSchema.virtual('remainingDays').get(function() {
  if (!this.endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(this.endDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
});

// Add indexes for better performance (nin already has unique index from schema)
socialInsuranceSchema.index({ name: 1 });
socialInsuranceSchema.index({ division: 1 });
socialInsuranceSchema.index({ endDate: 1 });
socialInsuranceSchema.index({ status: 1 });

// Pre-save middleware to update status based on remaining days
socialInsuranceSchema.pre('save', function(next) {
  if (this.endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(this.endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      this.status = 'expired';
    } else if (diffDays <= 30) {
      this.status = 'expiring-soon';
    } else {
      this.status = 'active';
    }
  }

  next();
});

module.exports = mongoose.model('SocialInsurance', socialInsuranceSchema);
