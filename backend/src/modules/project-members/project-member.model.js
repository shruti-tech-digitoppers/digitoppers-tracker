const mongoose = require('mongoose');
const { DESIGNATIONS } = require('../../core/constants');

const projectMemberSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.Mixed,
    index: true
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
}, { timestamps: true });

// Ensure unique employee assignment per project
projectMemberSchema.index({ projectId: 1, employee: 1 });
projectMemberSchema.index({ project: 1, employee: 1 }, { unique: true });

module.exports = mongoose.models.ProjectMember || mongoose.model('ProjectMember', projectMemberSchema, 'projectmembers');
