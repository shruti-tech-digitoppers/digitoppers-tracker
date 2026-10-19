const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      enum: ['OPS', 'TECH', 'CONTENT', 'FIN', 'SALES', 'INSTALLATION', 'TRAINING', 'MARKETING', 'RESEARCH']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);
