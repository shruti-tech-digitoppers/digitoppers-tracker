const mongoose = require('mongoose');
const { PROJECT_STATUSES } = require('../../core/constants');

const projectSchema = new mongoose.Schema({
  // Unified Identifier fields (Core Backend: projectId, Tracker: projectCode)
  projectCode: { type: String, uppercase: true, index: true },
  projectId: { type: String, index: true },

  // Unified Title fields (Core Backend: projectName, Tracker: title)
  title: { type: String, trim: true },
  projectName: { type: String, trim: true },

  // Core Backend metadata
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  numberOfSchools: { type: Number, default: 0 },
  numberOfLicenses: { type: Number, default: 0 },
  country: { type: mongoose.Schema.Types.ObjectId },
  isActive: { type: Boolean, default: true },

  // Tracker workflow fields
  description: { type: String, trim: true },
  client: { type: String, trim: true, default: 'DigiTopper Institutional Client' },
  status: { type: String, enum: Object.values(PROJECT_STATUSES), default: PROJECT_STATUSES.ACTIVE, index: true },
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: false, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: false },
  archived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Auto-sync between Core Backend fields and Tracker fields before validation
projectSchema.pre('validate', function (next) {
  if (this.projectId && !this.projectCode) {
    this.projectCode = this.projectId.toUpperCase();
  } else if (this.projectCode && !this.projectId) {
    this.projectId = this.projectCode;
  }

  if (this.projectName && !this.title) {
    this.title = this.projectName;
  } else if (this.title && !this.projectName) {
    this.projectName = this.title;
  }

  if (!this.client && this.projectName) {
    this.client = this.projectName;
  }

  next();
});

module.exports = mongoose.model('Project', projectSchema);
