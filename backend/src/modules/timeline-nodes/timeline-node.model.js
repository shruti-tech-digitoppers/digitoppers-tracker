const mongoose = require('mongoose');

/**
 * Normalized Lean TimelineNode Model (timeline_nodes collection)
 *
 * Strictly contains only the requested keys:
 * - _id: MongoDB ObjectId (automatic)
 * - timelineNodeId: String (required, unique, alphanumeric string identifier)
 * - name: String (required)
 * - order: Number (required, default 1)
 * - type: String ('stage' | 'substage' | 'tasks' | 'task')
 * - parentId: MongoDB ObjectId reference to parent TimelineNodeStatic (_id)
 * - dueDate: Date
 * - completionDate: Date
 * - has_substages: Boolean (default false)
 * - createdAt & updatedAt: Timestamps
 *
 * NOTE: 'title', 'parent_id', 'dependentOn', and legacy 'id' have been removed.
 */
const staticTimelineNodeSchema = new mongoose.Schema({
  timelineNodeId: {
    type: String,
    required: [true, 'Timeline Node ID (timelineNodeId) is required'],
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Node Name is required'],
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    default: 1
  },
  type: {
    type: String,
    enum: ['stage', 'substage', 'tasks', 'task'],
    lowercase: true,
    trim: true,
    default: 'tasks',
    index: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimelineNodeStatic',
    default: null,
    index: true
  },
  has_substages: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'timeline_nodes',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-sync id -> timelineNodeId if legacy id is passed and normalize type
staticTimelineNodeSchema.pre('validate', function(next) {
  if (!this.timelineNodeId && this.id) {
    this.timelineNodeId = this.id;
  }
  if (this.type) {
    this.type = this.type.toLowerCase();
    if (this.type === 'task') {
      this.type = 'tasks';
    }
  }
  next();
});

// Virtual id for backward compatibility reading
staticTimelineNodeSchema.virtual('id').get(function() {
  return this.timelineNodeId;
});

/**
 * Instance Method: Check if this stage has substages
 */
staticTimelineNodeSchema.methods.hasSubstages = async function() {
  if (this.type !== 'stage') return false;
  if (this.has_substages) return true;
  const count = await this.constructor.countDocuments({
    parentId: this._id,
    type: 'substage'
  });
  return count > 0;
};

/**
 * Static Method: Check if a given stage has substages
 * @param {string|ObjectId} stageId
 * @returns {Promise<boolean>}
 */
staticTimelineNodeSchema.statics.hasSubstages = async function(stageId) {
  if (!stageId) return false;
  const query = mongoose.isValidObjectId(stageId)
    ? { $or: [{ _id: stageId }, { timelineNodeId: String(stageId) }] }
    : { timelineNodeId: stageId };
  const stage = await this.findOne(query);
  if (stage && stage.has_substages) return true;
  if (!stage) return false;

  const count = await this.countDocuments({
    parentId: stage._id,
    type: 'substage'
  });
  return count > 0;
};

/**
 * Static Method: Resolve parent ObjectId for a new task
 */
staticTimelineNodeSchema.statics.resolveParentIdForTask = async function({ stageId, substageId }) {
  if (!stageId && !substageId) {
    throw new Error('Either stageId or substageId is required to resolve parentId for a task.');
  }

  if (substageId) {
    const query = mongoose.isValidObjectId(substageId)
      ? { $or: [{ _id: substageId }, { timelineNodeId: String(substageId) }], type: 'substage' }
      : { timelineNodeId: substageId, type: 'substage' };
    const substage = await this.findOne(query);
    if (!substage) {
      throw new Error(`Substage '${substageId}' not found.`);
    }
    return substage._id;
  }

  const query = mongoose.isValidObjectId(stageId)
    ? { $or: [{ _id: stageId }, { timelineNodeId: String(stageId) }] }
    : { timelineNodeId: stageId };
  const stage = await this.findOne(query);
  if (!stage) {
    throw new Error(`Stage '${stageId}' not found.`);
  }

  const stageHasSub = await this.hasSubstages(stage._id);
  if (stageHasSub) {
    throw new Error(`Stage '${stageId}' has substages. Task must be linked to a substage ObjectId.`);
  }

  return stage._id;
};

// Composite indexes
staticTimelineNodeSchema.index({ parentId: 1, order: 1 });
staticTimelineNodeSchema.index({ type: 1, order: 1 });

module.exports = mongoose.models.TimelineNodeStatic || mongoose.model('TimelineNodeStatic', staticTimelineNodeSchema, 'timeline_nodes');
