const mongoose = require('mongoose');
const { PROJECT_STATUSES } = require('../../core/constants');

const projectSchema = new mongoose.Schema({
  projectCode: { type: String, required: true, unique: true, uppercase: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  client: { type: String, required: true, trim: true },
  status: { type: String, enum: Object.values(PROJECT_STATUSES), default: PROJECT_STATUSES.ACTIVE, index: true },
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  archived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
