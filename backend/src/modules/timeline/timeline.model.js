const mongoose = require('mongoose');
const { NODE_STATUSES } = require('../../core/constants');

const timelineSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true, index: true },
  templateVersion: { type: String, default: 'v1' },
  status: { type: String, enum: Object.values(NODE_STATUSES), default: NODE_STATUSES.IN_PROGRESS }
}, { timestamps: true });

module.exports = mongoose.model('Timeline', timelineSchema);
