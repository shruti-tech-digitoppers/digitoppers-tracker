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
  organization: {
    type: String,
    trim: true,
    default: 'Direct Organization'
  },
  client: {
    type: String,
    trim: true,
    default: 'Direct Organization'
  },
  description: {
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
  confirmedProjectId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  projectId: {
    type: String,
    trim: true,
    uppercase: true,
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
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.organization = ret.organization || ret.client || 'Direct Organization';
      ret.client = ret.organization;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.organization = ret.organization || ret.client || 'Direct Organization';
      ret.client = ret.organization;
      return ret;
    }
  }
});

projectRequestSchema.pre('save', function (next) {
  if (this.organization && !this.client) this.client = this.organization;
  if (this.client && !this.organization) this.organization = this.client;
  next();
});

module.exports = mongoose.model('ProjectRequest', projectRequestSchema);
