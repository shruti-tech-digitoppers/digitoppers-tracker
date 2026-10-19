const mongoose = require('mongoose');

const hardwareSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // e.g. 'IFP', 'OPS', 'TABLET'
    },
    label: {
      type: String,
      required: true,
      trim: true, // e.g. 'IFP', 'Interactive Flat Panel'
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    icon: {
      type: String,
      default: '🖥️',
    },
    unit: {
      type: String,
      default: 'Units',
      trim: true,
    },
    solutions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Solution',
      },
    ],
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    departmentCode: {
      type: String,
      enum: ['OPS', 'TECH', 'CONTENT', 'FIN', 'SALES', 'INSTALLATION', 'TRAINING', null],
      default: 'OPS',
      index: true,
    },
    index: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        if (!ret.name) ret.name = ret.label;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        if (!ret.name) ret.name = ret.label;
        return ret;
      },
    },
  }
);

// Synchronize name & label before save
hardwareSchema.pre('save', function (next) {
  if (this.label && !this.name) this.name = this.label;
  if (this.name && !this.label) this.label = this.name;
  next();
});

module.exports = mongoose.models.Hardware || mongoose.model('Hardware', hardwareSchema);
