const mongoose = require('mongoose');
const { DESIGNATIONS } = require('../../core/constants');

const projectMemberSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  designation: { type: String, enum: Object.values(DESIGNATIONS), required: true, index: true },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

projectMemberSchema.index({ project: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model('ProjectMember', projectMemberSchema);
