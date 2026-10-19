const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      // e.g. 'Nursery', 'LKG', 'UKG', '1', '2', ..., '10', '11 Science', '11 Commerce', '11 Arts', '12 Science', '12 Commerce', '12 Arts'
    },
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      // e.g. 'nursery', 'lkg', 'ukg', 'c1', 'c2', ..., 'c10', 'c11_science', 'c11_commerce', 'c11_arts', 'c12_science', 'c12_commerce', 'c12_arts'
    },
    grade: {
      type: String,
      required: true,
      trim: true,
      // e.g. '1', '2', ..., '10', '11', '12'
    },
    stream: {
      type: String,
      default: null,
      enum: ['Science', 'Commerce', 'Arts', null],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Foundational', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'],
      default: 'Primary',
    },
    color: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '🎓',
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

gradeSchema.index({ grade: 1, stream: 1 });

module.exports = mongoose.models.Grade || mongoose.model('Grade', gradeSchema, 'grades');
