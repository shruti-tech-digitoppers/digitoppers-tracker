const mongoose = require('mongoose');


const timelineDataSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: [true, 'Static node ID (nodeId) is required'],
    trim: true,
    index: true
  },
  node: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimelineNodeStatic',
    default: null,
    index: true
  },
  projectId: {
    type: String,
    required: [true, 'Project ID is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  project: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'BLOCKED', 'CANCELLED', 'PENDING'],
      message: '{VALUE} is not a valid status. Choose PENDING, NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD, or BLOCKED.'
    },
    default: 'NOT_STARTED',
    uppercase: true,
    trim: true,
    index: true
  },
  completionDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  formData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'timeline_data',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate custom ID if missing, normalize status, and handle completionDate
timelineDataSchema.pre('validate', function(next) {
  // Normalize status to uppercase
  if (this.status) {
    this.status = this.status.toUpperCase();
    if (this.status === 'BLOCKED' || this.status === 'CANCELLED') this.status = 'BLOCKED';
    if (this.status === 'COMPLETE') this.status = 'COMPLETED';
    if (this.status === 'INPROGRESS' || this.status === 'IN-PROGRESS') this.status = 'IN_PROGRESS';
    if (this.status === 'NOTSTARTED' || this.status === 'NOT-STARTED') this.status = 'NOT_STARTED';
    if (this.status === 'ONHOLD' || this.status === 'ON-HOLD' || this.status === 'ON HOLD') this.status = 'ON_HOLD';
    if (this.status === 'PENDING') this.status = 'PENDING';
  }

  // Handle completionDate automatically
  if (this.status === 'COMPLETED' && !this.completionDate) {
    this.completionDate = new Date();
  } else if (this.status !== 'COMPLETED' && this.isModified('status') && !this.completionDate) {
    this.completionDate = null;
  }

  next();
});

// Composite unique constraint: One timeline_data record per node per project
timelineDataSchema.index({ projectId: 1, nodeId: 1 }, { unique: true });
timelineDataSchema.index({ projectId: 1, status: 1 });
timelineDataSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.models.TimelineData || mongoose.model('TimelineData', timelineDataSchema, 'timeline_data');

