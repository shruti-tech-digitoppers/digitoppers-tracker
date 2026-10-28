const mongoose = require('mongoose');
const { NODE_STATUSES } = require('../../core/constants');

// Sub-schema: Task Milestone
const timelineTaskSchema = new mongoose.Schema(
  {
    taskKey: { type: String, required: true, uppercase: true, trim: true },
    taskName: { type: String, required: true },
    order: { type: Number, required: true, default: 1 },
    // Department Ownership
    departmentCode: {
      type: String,
      enum: ['OPS', 'TECH', 'CONTENT', 'FIN', 'SALES', 'INSTALLATION', 'TRAINING'],
      required: true
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    // Execution Scope
    scope: {
      type: String,
      enum: ['PROJECT_LEVEL', 'SCHOOL_LEVEL'],
      default: 'PROJECT_LEVEL'
    },
    // Dynamically cached progress text for school-level tasks (e.g. "16/20 Schools Installed (80%)")
    schoolProgressSummary: {
      totalSchools: { type: Number, default: 0 },
      completedSchools: { type: Number, default: 0 },
      progressText: { type: String, default: '' }
    },
    isParallel: { type: Boolean, default: true },
    dependsOn: [{ type: String }], // Prerequisite taskKeys
    status: {
      type: String,
      enum: ['LOCKED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'SKIPPED', 'PENDING'],
      default: 'NOT_STARTED'
    },
    formData: { type: mongoose.Schema.Types.Mixed, default: {} },
    startedAt: Date,
    completedAt: Date,
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
  },
  { _id: true }
);

// Sub-schema: Stage Milestone
const timelineStageSchema = new mongoose.Schema(
  {
    stageKey: { type: String, required: true, uppercase: true },
    stageName: { type: String, required: true },
    stageNumber: { type: Number, required: true },
    order: { type: Number, required: true, default: 1 },
    primaryDepartment: { type: String, enum: ['OPS', 'TECH', 'CONTENT', 'FIN', 'SALES', 'INSTALLATION', 'TRAINING'] },
    status: {
      type: String,
      enum: ['LOCKED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'PENDING'],
      default: 'NOT_STARTED'
    },
    tasks: [timelineTaskSchema]
  },
  { _id: true }
);

const timelineSchema = new mongoose.Schema({
  projectId: { type: String, required: true, index: true, uppercase: true, trim: true },
  project: { type: mongoose.Schema.Types.Mixed, index: true },
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
  status: { type: String, default: NODE_STATUSES.IN_PROGRESS },
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  currentStageKey: { type: String, default: '' },
  stages: [timelineStageSchema]
}, { timestamps: true });

// Method: Recalculate Stage & Roadmap progress based on task completion and school roll-up
timelineSchema.methods.recalculateProgress = function () {
  let totalTasks = 0;
  let completedTasks = 0;
  if (!this.stages || this.stages.length === 0) return;
  for (const stage of this.stages) {
    let stageTotal = stage.tasks ? stage.tasks.length : 0;
    let stageDone = 0;
    if (stage.tasks) {
      for (const task of stage.tasks) {
        if (task.status === 'SKIPPED') continue;
        totalTasks++;
        if (task.status === 'COMPLETED') {
          completedTasks++;
          stageDone++;
        }
      }
    }
    if (stageTotal > 0) {
      if (stageDone === stageTotal) {
        stage.status = 'COMPLETED';
      } else if (stageDone > 0 || (stage.tasks && stage.tasks.some(t => t.status === 'IN_PROGRESS'))) {
        stage.status = 'IN_PROGRESS';
      } else {
        stage.status = 'NOT_STARTED';
      }
    }
  }
  this.progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  if (this.progressPercentage === 100) this.status = 'COMPLETED';
};

timelineSchema.index({ 'stages.tasks.assignedTo': 1 });

module.exports = mongoose.model('Timeline', timelineSchema);


