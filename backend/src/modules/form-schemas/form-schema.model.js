const mongoose = require('mongoose');

/**
 * Field Definition Sub-Schema
 * Defines individual input elements inside a form schema
 */
const formFieldSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Field key is required'],
    trim: true
  },
  label: {
    type: String,
    required: [true, 'Field label is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Field type is required'],
    trim: true,
    default: 'text'
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    type: String,
    trim: true
  }],
  hint: {
    type: String,
    default: '',
    trim: true
  },
  placeholder: {
    type: String,
    default: '',
    trim: true
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

/**
 * Form Schema (form_schemas collection)
 *
 * Defines the form fields and input layout for stages, substages, and tasks.
 * Can be either a Master Blueprint (projectId = null or 'DEFAULT')
 * or a project-specific overridden form schema linked to Core Backend project.
 *
 * Fields:
 * - id: Custom identifier (e.g. 'FS_PROJECT_REVIEWER' or 'FS_PRJ-2026-001_PO_UPLOAD')
 * - nodeId: Reference to static timeline node id ('PROJECT_REVIEWER', 'PO_UPLOAD', etc.)
 * - node: Direct ObjectId ref to TimelineNodeStatic
 * - projectId: Core backend project code ('PRJ-2026-001', or 'DEFAULT' for master schema)
 * - project: Core backend MongoDB Project reference (_id)
 * - title: Human friendly form title
 * - description: Form instructions / overview
 * - fields: Array of field definitions (keys map to formData values)
 * - version: Schema version ('v1', 'v2', etc.)
 * - isActive: Boolean flag
 */
const formSchemaDef = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Custom ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  nodeId: {
    type: String,
    required: [true, 'Static Node ID (nodeId) is required'],
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
    default: 'DEFAULT',
    uppercase: true,
    trim: true,
    index: true
  },
  project: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    index: true
  },
  title: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  fields: {
    type: [formFieldSchema],
    default: []
  },
  version: {
    type: String,
    default: 'v1',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'form_schemas',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate custom id before validation
formSchemaDef.pre('validate', function(next) {
  if (!this.projectId) {
    this.projectId = 'DEFAULT';
  } else {
    this.projectId = String(this.projectId).toUpperCase().trim();
  }

  if (!this.id && this.nodeId) {
    const cleanProj = this.projectId ? this.projectId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'DEFAULT';
    const cleanNode = this.nodeId.replace(/[^a-zA-Z0-9_-]/g, '_');
    this.id = `FS_${cleanProj}_${cleanNode}`;
  } else if (!this.id) {
    this.id = `FS_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  next();
});

// Composite index: One schema per (projectId, nodeId)
formSchemaDef.index({ projectId: 1, nodeId: 1 }, { unique: true });

module.exports = mongoose.models.FormSchema || mongoose.model('FormSchema', formSchemaDef, 'form_schemas');
