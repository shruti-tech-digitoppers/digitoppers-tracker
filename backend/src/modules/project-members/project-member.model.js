const mongoose = require('mongoose');
const { DESIGNATIONS } = require('../../core/constants');

const projectMemberSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true, 
    index: true 
  },
  designation: { 
    type: String, 
    enum: Object.values(DESIGNATIONS), 
    required: true, 
    index: true 
  },
  projectRole: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  assignedAt: { 
    type: Date, 
    default: Date.now 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual compatibility for project
projectMemberSchema.virtual('project')
  .get(function() { return this.projectId; })
  .set(function(val) { this.projectId = val; });

// Ensure unique employee assignment per project
projectMemberSchema.index({ projectId: 1, employee: 1 }, { unique: true });

module.exports = mongoose.models.ProjectMember || mongoose.model('ProjectMember', projectMemberSchema, 'project_members');
