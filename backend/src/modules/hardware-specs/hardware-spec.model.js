const mongoose = require('mongoose');

/**
 * HardwareSpec Schema
 * Stores granular specifications for a hardware model,
 * referencing Hardware as a Foreign Key (hardwareId).
 */
const hardwareSpecSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Specification name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Specification code is required'],
      trim: true,
      uppercase: true,
    },
    // ── Foreign Key to Hardware ──
    hardwareId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hardware',
      required: [true, 'Hardware foreign key (hardwareId) is required'],
      index: true,
    },
    hardwareKey: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    index: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for fast queries by hardwareId and code
hardwareSpecSchema.index({ hardwareId: 1, code: 1 });
hardwareSpecSchema.index({ hardwareKey: 1, isActive: 1 });

const HardwareSpec =
  mongoose.models.HardwareSpec || mongoose.model('HardwareSpec', hardwareSpecSchema);

module.exports = HardwareSpec;
