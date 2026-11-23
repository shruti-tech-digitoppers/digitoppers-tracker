const mongoose = require('mongoose');

/**
 * Normalized TimelineData Model (timeline_data collection)
 *
 * Tracks project node execution status & progress:
 * - _id: MongoDB ObjectId
 * - projectId: Core Backend Project Reference
 * - project: Core backend Project MongoDB _id or object
 * - timelineNodeId: MongoDB ObjectId reference to TimelineNodeStatic (_id)
 * - nodeId: Node string key ('PO_UPLOAD', etc.)
 * - assignedTo: MongoDB ObjectId reference to Employee
 * - status: Enum (NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD, BLOCKED, etc.)
 * - dueDate: Date
 * - completionDate: Date
 * - remarks: String
 *
 * NOTE: formData has been separated into the 'form_data' collection!
 */
const timelineDataSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: [true, 'Project ID reference (projectId) is required'],
    trim: true,
    index: true
  },
  timelineNodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimelineNodeStatic',
    required: [true, 'TimelineNode ObjectId reference (timelineNodeId) is required'],
    index: true
  },
  node: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimelineNodeStatic',
    default: null,
    index: true
  },
  nodeId: {
    type: String,
    trim: true,
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
  }
}, {
  timestamps: true,
  collection: 'timeline_data',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for backward-compatibility if old code accesses .project
timelineDataSchema.virtual('project')
  .get(function() { return this.projectId; })
  .set(function(v) { this.projectId = v; });

// Auto-sync node and timelineNodeId, normalize status, and handle completionDate
timelineDataSchema.pre('validate', function(next) {
  if (this.projectId) {
    this.projectId = String(this.projectId).trim();
  }
  if (!this.timelineNodeId && this.node) {
    this.timelineNodeId = this.node;
  }
  if (!this.node && this.timelineNodeId) {
    this.node = this.timelineNodeId;
  }

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

// Unique constraint: One timeline_data record per node per project
timelineDataSchema.index({ projectId: 1, timelineNodeId: 1 }, { unique: true });
timelineDataSchema.index({ projectId: 1, nodeId: 1 });
timelineDataSchema.index({ projectId: 1, status: 1 });
timelineDataSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.models.TimelineData || mongoose.model('TimelineData', timelineDataSchema, 'timeline_data');
