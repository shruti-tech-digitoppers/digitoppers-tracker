const mongoose = require('mongoose');

const projectRequestSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false,
    index: true
  },
  requestId: {
    type: String,
    required: [true, 'Request ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Project Name is required'],
    trim: true
  },
  projectName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  country: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  expectedProjectValue: {
    type: Number,
    min: [0, 'Project valuation cannot be negative'],
    default: 0
  },
  requestedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Requester employee is required']
  },
  requestedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Approver (Requested To) is required']
  },
  projectManager: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Assigned Project Manager is required']
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  reviewNotes: {
    type: String,
    trim: true,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee'
  },
  reviewedAt: {
    type: Date
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  dashboardProjectId: {
    type: String,
    trim: true,
    uppercase: true,
    index: true
  },
  isManualDashboardCreated: {
    type: Boolean,
    default: true
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

// Backward-compatibility alias: description maps to remarks
projectRequestSchema.virtual('description').get(function () {
  return this.remarks;
}).set(function (v) {
  this.remarks = v;
});

const requestCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
}, { timestamps: true });

const ProjectRequest = mongoose.models.ProjectRequest || mongoose.model('ProjectRequest', projectRequestSchema, 'projectrequests');
const ProjectRequestCounter = mongoose.models.ProjectRequestCounter || mongoose.model('ProjectRequestCounter', requestCounterSchema, 'projectrequestcounters');

ProjectRequest.ProjectRequest = ProjectRequest;
ProjectRequest.ProjectRequestCounter = ProjectRequestCounter;

module.exports = ProjectRequest;
