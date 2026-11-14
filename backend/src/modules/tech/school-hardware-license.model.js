const mongoose = require('mongoose');

const schoolHardwareLicenseSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Project ID is required'],
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: [true, 'School ID is required'],
      index: true,
    },
    schoolName: {
      type: String,
      trim: true,
      default: '',
    },
    hardwareId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    hardwareKey: {
      type: String,
      required: [true, 'Hardware key is required'],
      trim: true,
    },
    hardwareName: {
      type: String,
      required: [true, 'Hardware name is required'],
      trim: true,
    },
    unitIndex: {
      type: Number,
      required: true,
      default: 1,
    },
    specId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    specName: {
      type: String,
      default: '',
      trim: true,
    },
    specKey: {
      type: String,
      default: '',
      trim: true,
    },
    licenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'License',
      default: null,
      index: true,
    },
    licenseKey: {
      type: String,
      required: [true, 'License key is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ALLOCATED', 'ACTIVE', 'REGISTERED', 'REVOKED', 'EXPIRED'],
      default: 'ALLOCATED',
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
      default: null,
      trim: true,
    },
    allocatedAt: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

schoolHardwareLicenseSchema.index({ projectId: 1, schoolId: 1 });
schoolHardwareLicenseSchema.index({ schoolId: 1, hardwareKey: 1, unitIndex: 1 }, { unique: true });

const SchoolHardwareLicense =
  mongoose.models.SchoolHardwareLicense ||
  mongoose.model('SchoolHardwareLicense', schoolHardwareLicenseSchema, 'school_hardware_licenses');

module.exports = SchoolHardwareLicense;

