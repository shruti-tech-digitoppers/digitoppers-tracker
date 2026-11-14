const mongoose = require('mongoose');

const staticTimelineNodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Node ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Node Name is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Node Title level is required (stage, substage, tasks)'],
    enum: {
      values: ['stage', 'substage', 'tasks', 'task'],
      message: '{VALUE} is not a valid node title level. Choose stage, substage, or tasks.'
    },
    lowercase: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['stage', 'substage', 'tasks', 'task'],
    lowercase: true,
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    default: 1
  },
  parent_id: {
    type: String,
    default: null,
    trim: true,
    index: true
  },
  has_substages: {
    type: Boolean,
    default: false
  },
    dependentOn: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimelineNodeStatic'
    }],
    default: []
  },
  completionDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  },
  formSchema: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true,
  collection: 'timeline_nodes',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-sync type with title before saving
staticTimelineNodeSchema.pre('validate', function(next) {
  if (this.title) {
    this.title = this.title.toLowerCase();
    // Normalize singular 'task' to 'tasks' or keep consistent
    if (this.title === 'task') {
      this.title = 'tasks';
    }
    this.type = this.title;
  }
  next();
});

/**
 * Instance Method: Check if this node has substages
 */
staticTimelineNodeSchema.methods.hasSubstages = async function() {
  if (this.title !== 'stage') return false;
  if (this.has_substages) return true;
  const count = await this.constructor.countDocuments({
    parent_id: this.id,
    title: 'substage'
  });
  return count > 0;
};

/**
 * Static Method: Check if a given stage has substages
 * @param {string} stageId
 * @returns {Promise<boolean>}
 */
staticTimelineNodeSchema.statics.hasSubstages = async function(stageId) {
  if (!stageId) return false;
  const stage = await this.findOne({ id: stageId });
  if (stage && stage.has_substages) return true;

  const count = await this.countDocuments({
    parent_id: stageId,
    title: 'substage'
  });
  return count > 0;
};

/**
 * Static Method: Resolve parent_id for a new task according to business rules:
 * - If the stage has substages -> task must attach to substage.id
 * - If the stage has NO substages -> task attaches directly to stage.id
 *
 * @param {Object} params
 * @param {string} params.stageId
 * @param {string} [params.substageId]
 * @returns {Promise<string>} resolved parent_id
 */
staticTimelineNodeSchema.statics.resolveParentIdForTask = async function({ stageId, substageId }) {
  if (!stageId && !substageId) {
    throw new Error('Either stageId or substageId is required to resolve parent_id for a task.');
  }

  // If substageId is explicitly provided, verify it exists
  if (substageId) {
    const substage = await this.findOne({ id: substageId, title: 'substage' });
    if (!substage) {
      throw new Error(`Substage with id '${substageId}' not found.`);
    }
    return substage.id;
  }

  // If only stageId provided, check if it has substages
  const stageHasSub = await this.hasSubstages(stageId);
  if (stageHasSub) {
    throw new Error(
      `Stage '${stageId}' has substages. Task must be linked to a substage, so 'substageId' is required.`
    );
  }

  // Stage has NO substages -> task directly belongs to stage
  const stage = await this.findOne({ id: stageId, title: 'stage' });
  if (!stage) {
    throw new Error(`Stage with id '${stageId}' not found.`);
  }
  return stage.id;
};

// Composite indexes for fast hierarchical queries
staticTimelineNodeSchema.index({ parent_id: 1, order: 1 });
staticTimelineNodeSchema.index({ title: 1, order: 1 });

module.exports = mongoose.models.TimelineNodeStatic || mongoose.model('TimelineNodeStatic', staticTimelineNodeSchema, 'timeline_nodes');

