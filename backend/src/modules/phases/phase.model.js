const mongoose = require('mongoose');
const { NODE_STATUSES } = require('../../core/constants');

const phaseSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false,
    index: true
  },
  projectId: {
    type: String,
    required: [true, 'Project ID is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  phaseKey: {
    type: String,
    required: [true, 'Phase Key is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Phase Title is required'],
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(NODE_STATUSES),
    default: NODE_STATUSES.PENDING,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
    index: true
  },
  dependencies: [{
    type: String
  }],
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

phaseSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'phase'
});

phaseSchema.index({ projectId: 1, phaseKey: 1 }, { unique: true });
phaseSchema.index({ project: 1, order: 1 });

module.exports = mongoose.models.Phase || mongoose.model('Phase', phaseSchema, 'phases');
