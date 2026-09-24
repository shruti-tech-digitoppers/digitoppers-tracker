const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: false, index: true },
  actorName: { type: String },
  actorEmail: { type: String },
  action: { type: String, required: true, index: true },
  description: { type: String },
  resourceType: { type: String, default: 'General', index: true },
  resourceId: { type: mongoose.Schema.Types.Mixed, required: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });

activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

