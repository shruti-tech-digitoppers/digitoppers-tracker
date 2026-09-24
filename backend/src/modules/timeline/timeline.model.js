const mongoose = require('mongoose');
const { NODE_STATUSES } = require('../../core/constants');

const timelineSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
  projectId: { type: String, index: true },
  projectName: { type: String },
  organization: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  numberOfSchools: { type: Number, default: 0 },
  numberOfLicenses: { type: Number, default: 0 },
  country: { type: mongoose.Schema.Types.Mixed },
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  coreBackendData: { type: mongoose.Schema.Types.Mixed, default: {} },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  templateVersion: { type: String, default: 'v1' },
  status: { type: String, enum: Object.values(NODE_STATUSES), default: NODE_STATUSES.IN_PROGRESS }
}, { timestamps: true });

module.exports = mongoose.model('Timeline', timelineSchema);

