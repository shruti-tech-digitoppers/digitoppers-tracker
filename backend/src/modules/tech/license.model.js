const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema(
  {
    licenseKey: {
      type: String,
      required: [true, 'License key is required'],
      unique: true,
      trim: true, // format: lic{partOfSchId}1, lic{partOfSchId}2 or LIC-xxxx
    },
    status: {
      type: String,
      enum: ['active', 'registered', 'renewed', 'expired', 'ACTIVE', 'REGISTERED', 'RENEWED', 'EXPIRED'],
      default: 'active',
      index: true,
    },
    isRegistered: {
      type: Boolean,
      default: false,
      index: true,
    },
    registeredAt: {
      type: Date,
      default: null,
    },
    registeredTo: {
      type: String,
      default: null, // Device identifier
      trim: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      default: null,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically provides createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Composite index for fast querying by project and school
licenseSchema.index({ projectId: 1, schoolId: 1 });
licenseSchema.index({ licenseKey: 1, status: 1 });

const License = mongoose.models.License || mongoose.model('License', licenseSchema);

module.exports = License;
module.exports.License = License;
module.exports.licenseSchema = licenseSchema;
module.exports.default = License;
