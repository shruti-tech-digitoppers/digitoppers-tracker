const mongoose = require('mongoose');
const { NODE_TYPES, NODE_STATUSES } = require('../../core/constants');

const timelineNodeSchema = new mongoose.Schema({
  timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline', required: true, index: true },
  parentNode: { type: mongoose.Schema.Types.ObjectId, ref: 'TimelineNode', default: null, index: true },
  type: { type: String, enum: Object.values(NODE_TYPES), required: true },
  key: { type: String, required: true, uppercase: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
  status: { type: String, enum: Object.values(NODE_STATUSES), default: NODE_STATUSES.PENDING, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null, index: true },
  formSchema: { type: mongoose.Schema.Types.Mixed, default: null },
  formData: { type: mongoose.Schema.Types.Mixed, default: {} },
  dependencies: [{ type: String }], // keys of nodes required to complete first
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

timelineNodeSchema.index({ timeline: 1, parentNode: 1 });
timelineNodeSchema.index({ timeline: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('TimelineNode', timelineNodeSchema);
