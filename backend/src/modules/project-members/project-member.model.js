const mongoose = require('mongoose');
const { DESIGNATIONS } = require('../../core/constants');

const projectMemberSchema = new mongoose.Schema({
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true, 
    index: true 
  },
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true, 
    index: true 
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department', 
    default: null, 
    index: true 
  },
  departmentCode: { 
    type: String, 
    enum: ['OPS', 'TECH', 'CONTENT', 'FIN', 'SALES', 'INSTALLATION', 'TRAINING', null], 
    uppercase: true, 
    default: null, 
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
  isDepartmentLead: { 
    type: Boolean, 
    default: false, 
    index: true 
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
projectMemberSchema.index({ project: 1, employee: 1 }, { unique: true });

module.exports = mongoose.models.ProjectMember || mongoose.model('ProjectMember', projectMemberSchema, 'projectmembers');
