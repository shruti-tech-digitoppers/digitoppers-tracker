const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  action: { type: String, required: true },
  resourceType: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false } });

activitySchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
