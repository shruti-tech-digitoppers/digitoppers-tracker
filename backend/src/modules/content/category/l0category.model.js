const mongoose = require('mongoose');
require('../language/language.model');

const l0CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    language: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Language',
    },
    icon: {
      type: String,
      default: '',
    },
    section: {
      type: String,
      required: true,
      enum: ['academic', 'non-academic'],
    },
    blg: [
      {
        type: String, // combination of board, language, grade in format "board_%D%_language_%D%_grade" (grade can be grade_stream)
      },
    ],
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    layout: {
      type: String,
      required: true,
      default: 'subject',
      enum: ['activity', 'book', 'simulation', 'cat_syllabus', 'testprep'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

l0CategorySchema.index({ language: 1, id: 1 });

// Explicit collection 'l0categories' as requested
const L0Category = mongoose.models.L0Category || mongoose.model('L0Category', l0CategorySchema, 'l0categories');

module.exports = L0Category;

