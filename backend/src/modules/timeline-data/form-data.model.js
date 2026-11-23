const mongoose = require('mongoose');

/**
 * Normalized Lean FormData Model (form_data collection)
 *
 * Strictly contains only the requested keys:
 * - _id: MongoDB ObjectId (automatic)
 * - formDataId: String (required, unique, e.g. "FD_1_REQUIREMENTS_SIGN_OFF")
 * - formSchemaId: MongoDB ObjectId reference to FormSchema (_id)
 * - project: MongoDB ObjectId reference to Project (_id from Core Backend)
 * - status: String ('DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS')
 * - submittedBy: MongoDB ObjectId reference to Employee (_id)
 * - data: Key-value pairs where key comes from FormSchema and value is exact submitted data
 * - createdAt & updatedAt: Timestamps (automatic)
 *
 * NOTE: Key name is 'project' (MongoDB ObjectId). 'timelineDataId', 'timelineNodeId', and 'nodeId' have been removed.
 */
const formDataSchema = new mongoose.Schema({
  formDataId: {
    type: String,
    required: [true, 'Form Data ID (formDataId) is required'],
    unique: true,
    trim: true,
    index: true
  },
  formSchemaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FormSchema',
    required: [true, 'FormSchema ObjectId reference (formSchemaId) is required'],
    index: true
  },
  projectId: {
    type: String,
    required: [true, 'Project ID reference (projectId) is required'],
    trim: true,
    index: true
  },
  timelineData: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimelineData',
    default: null
  },
  nodeKey: {
    type: String,
    trim: true,
    index: true,
    default: null
  },
  nodeId: {
    type: String,
    trim: true,
    index: true,
    default: null
  },
  status: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS'],
    default: 'SUBMITTED',
    uppercase: true,
    trim: true,
    index: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Mapping: School Onboarding schools → Core Backend Dashboard school IDs (e.g. SCH-DEL-01)
  // Populated during School & License Creation verification step
  dashboardSchoolsId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true,
  collection: 'form_data',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual compatibility for project
formDataSchema.virtual('project')
  .get(function() {
    return this.projectId;
  })
  .set(function(val) {
    this.projectId = val;
  });

// Auto-sync project <-> projectId, timelineData <-> timelineDataId, & data <-> formData
formDataSchema.pre('validate', function(next) {
  if (!this.projectId && this.project) {
    this.projectId = String(this.project).trim();
  }
  if (this.projectId) {
    this.projectId = String(this.projectId).trim();
  }
  if (!this.timelineData && this.timelineDataId) {
    this.timelineData = this.timelineDataId;
  }
  if (!this.data && this.formData) {
    this.data = this.formData;
  }
  if (!this.formData && this.data) {
    this.formData = this.data;
  }
  next();
});

// Virtual compatibility for timelineDataId
formDataSchema.virtual('timelineDataId')
  .get(function() {
    return this.timelineData;
  })
  .set(function(val) {
    this.timelineData = val;
  });

formDataSchema.index({ projectId: 1, formSchemaId: 1 }, { unique: true });
formDataSchema.index({ timelineData: 1 });

// Virtual compatibility for formData
formDataSchema.virtual('formData')
  .get(function() {
    return this.data;
  })
  .set(function(val) {
    this.data = val;
  });

module.exports = mongoose.models.FormData || mongoose.model('FormData', formDataSchema, 'form_data');
