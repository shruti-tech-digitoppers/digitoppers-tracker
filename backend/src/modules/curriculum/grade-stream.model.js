const mongoose = require('mongoose');

const gradeStreamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['Arts and Humanities', 'Commerce', 'Science'],
    },
    id: {
      type: String,
      required: true,
      enum: ['arts', 'commerce', 'science'],
    },
    icon: {
      type: String,
    },
    index: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.GradeStream || mongoose.model('GradeStream', gradeStreamSchema);
