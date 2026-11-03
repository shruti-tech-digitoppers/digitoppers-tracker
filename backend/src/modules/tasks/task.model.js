const mongoose = require('mongoose');
const { NODE_STATUSES } = require('../../core/constants');

const taskSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false,
    index: true
  },
  projectId: {
    type: String,
    required: [true, 'Project ID is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  phase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Phase',
    required: [true, 'Parent Phase reference is required'],
    index: true
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null,
    index: true
  },
  taskKey: {
    type: String,
    required: [true, 'Task Key is required'],
    uppercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Task Title is required'],
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(NODE_STATUSES),
    default: NODE_STATUSES.PENDING,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
    index: true
  },
  streamType: {
    type: String,
    enum: ['HARDWARE', 'TECH', 'CONTENT', null],
    default: null,
    index: true
  },
  isStreamRoot: {
    type: Boolean,
    default: false
  },
  formKey: {
    type: String,
    default: null
  },
  formSchema: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  dependencies: [{
    type: String
  }],
  timelineNodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimelineNode',
    default: null,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for sub-tasks (children)
taskSchema.virtual('subTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'parentTask'
});

// Virtual for form data
taskSchema.virtual('formData', {
  ref: 'TaskFormData',
  localField: '_id',
  foreignField: 'task',
  justOne: true
});

taskSchema.index({ phase: 1, order: 1 });
taskSchema.index({ projectId: 1, taskKey: 1 });
taskSchema.index({ parentTask: 1, order: 1 });

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema, 'tasks');
