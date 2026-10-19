const mongoose = require('mongoose');

/**
 * SchoolHardwareLicense Schema
 * Relation / Junction model mapping:
 * Project + School (FK) + Hardware (Key/FK) + External License (FK/Key)
 * 
 * Allows the external `License` model to remain completely undisturbed,
 * while managing school-wise and hardware-wise license allocations in Tech Stream.
 */
const schoolHardwareLicenseSchema = new mongoose.Schema(
  {
    // ── Foreign Keys: Project & School ───────────────────────────
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
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

    // ── Hardware Linkage ─────────────────────────────────────────
    hardwareId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hardware',
      default: null,
    },
    hardwareKey: {
      type: String,
      required: [true, 'Hardware key is required'],
      trim: true, // e.g. 'IFP', 'OPS', 'TABLET', 'SMART_TV'
    },
    hardwareName: {
      type: String,
      required: [true, 'Hardware name is required'],
      trim: true, // e.g. 'Interactive Flat Panel 75"'
    },
    unitIndex: {
      type: Number,
      required: true,
      default: 1, // Unit 1, Unit 2, Unit 3 of that hardware for this school
    },

    // ── Specification Linkage (Foreign Key to HardwareSpec) ─────
    specId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HardwareSpec',
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

    // ── License Reference (Undisturbed External License) ─────────
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

    // ── Allocation & Registration State ──────────────────────────
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
      default: null, // Device identifier (MAC / Android ID / Device Serial #)
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Composite indexes for rapid lookups and preventing duplicate allocation of the same unit
schoolHardwareLicenseSchema.index({ projectId: 1, schoolId: 1 });
schoolHardwareLicenseSchema.index({ schoolId: 1, hardwareKey: 1, unitIndex: 1 }, { unique: true });

const SchoolHardwareLicense =
  mongoose.models.SchoolHardwareLicense ||
  mongoose.model('SchoolHardwareLicense', schoolHardwareLicenseSchema);

module.exports = SchoolHardwareLicense;
