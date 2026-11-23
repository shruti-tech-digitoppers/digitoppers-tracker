const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  projectId: { type: String, required: false, index: true, trim: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: false, index: true },
  actorName: { type: String },
  actorEmail: { type: String },
  action: { type: String, required: true, index: true },
  description: { type: String },
  resourceType: { type: String, default: 'General', index: true },
  resourceId: { type: mongoose.Schema.Types.Mixed, required: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual compatibility for project
activitySchema.virtual('project')
  .get(function() { return this.projectId; })
  .set(function(val) { this.projectId = val; });

activitySchema.index({ projectId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ projectId: 1, actor: 1 });

module.exports = mongoose.model('Activity', activitySchema);
