const mongoose = require('mongoose');

// Sub-schema: Dynamic Trainer
const trainerItemSchema = new mongoose.Schema(
  {
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    name: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    employeeCode: { type: String, default: '', trim: true },
    designation: { type: String, default: '', trim: true },
    role: { type: String, default: 'Lead Trainer', trim: true },
    email: { type: String, default: '', trim: true }
  },
  { _id: true }
);

// Sub-schema: Training Checklist per School
const trainingChecklistSchema = new mongoose.Schema(
  {
    trainingDone: { type: Boolean, default: false },
    applicationWorking: { type: Boolean, default: false },
    teachersTraining: { type: Boolean, default: false },
    teachersIdCreated: { type: Boolean, default: false },
    photographyShootsDone: { type: Boolean, default: false },
    googleReviews: { type: Boolean, default: false }
  },
  { _id: false }
);

// Sub-schema: School-Wise Training Execution & Planning Unit
const schoolTrainingUnitSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true
    },
    schoolId: { type: String, required: true },
    schoolName: { type: String, required: true },
    address: { type: String, default: '' },
    contactPerson: { type: mongoose.Schema.Types.Mixed, default: '' },
    contactPhone: { type: String, default: '' },

    // ── STAGE 07.1: PLANNING & SCHEDULING ──
    planningStatus: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING'
    },
    planOutDate: { type: String, default: '' },
    assignedTrainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    trainerName: { type: String, default: '', trim: true },
    trainerPhone: { type: String, default: '', trim: true },
    trainers: [trainerItemSchema],
    planningRemarks: { type: String, default: '' },

    // ── STAGE 07.2: TRAINING EXECUTION & COMPLETION ──
    executionStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED'
    },
    trainingDate: { type: Date, default: null },
    completedDate: { type: Date, default: null },
    trainingMode: {
      type: String,
      enum: ['OFFLINE', 'ONLINE', 'HYBRID'],
      default: 'OFFLINE'
    },
    teachersTrainedCount: { type: Number, default: 0, min: 0 },

    // Uploaded Documents (PDF only)
    deliveryConfirmationSheetUrl: { type: String, default: '', trim: true },
    appreciationLetterUrl: { type: String, default: '', trim: true },
    workCompletionLetterUrl: { type: String, default: '', trim: true },
    teachersDetailsDocUrl: { type: String, default: '', trim: true },
    attendanceSheetUrl: { type: String, default: '', trim: true },

    // Execution Checklist
    checklist: {
      type: trainingChecklistSchema,
      default: () => ({})
    },

    // Media & Public Ratings
    photographyPhotosUrl: { type: String, default: '', trim: true },
    googleReviewsNotes: { type: String, default: '', trim: true },
    feedbackRating: { type: Number, min: 1, max: 5, default: null },

    // On-Ground Hardware Serials & Feedback
    hardwareSerials: { type: mongoose.Schema.Types.Mixed, default: {} },
    issuesNoted: { type: String, default: '', trim: true },
    onGroundFeedback: { type: String, default: '', trim: true },
    remarks: { type: String, default: '', trim: true }
  },
  { _id: true, timestamps: true }
);

// Main Schema: Project Training Lifecycle
const projectTrainingSchema = new mongoose.Schema(
  {
    projectId: { type: String, required: true, index: true, uppercase: true, trim: true },
    project: { type: mongoose.Schema.Types.Mixed, index: true },
    projectName: { type: String, required: true },

    // Overall Status
    overallStatus: {
      type: String,
      enum: ['NOT_STARTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
      index: true
    },

    // ── Stage: Planning and Scheduling Data ──
    planning: {
      trainingType: {
        type: String,
        enum: ['Teacher Training', 'Admin Training', 'Student Demo', 'Full Training', 'Other'],
        default: 'Teacher Training'
      },
      expectedParticipants: { type: Number, default: 0 },
      trainingRosterUrl: { type: String, default: '' },
      plannedDates: { type: String, default: '' },
      remarks: { type: String, default: '' },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      submittedAt: { type: Date }
    },

    // ── Stage: Execution and Completion Data ──
    execution: {
      actualStartDate: { type: Date },
      actualEndDate: { type: Date },
      conductedBy: [{ type: String }],
      totalTeachersTrained: { type: Number, default: 0 },
      overallRemarks: { type: String, default: '' },
      issuesNoted: { type: String, default: '' },
      onGroundFeedback: { type: String, default: '' },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      submittedAt: { type: Date }
    },

    // School Deployments for Training
    schools: [schoolTrainingUnitSchema],

    // Canonical Fast-Lookup Maps
    schoolWiseTrainingPlans: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    schoolWiseTrainingExecutions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    schoolWiseTrainingCompletion: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Rollup Metrics
    totalSchools: { type: Number, default: 0 },
    scheduledSchools: { type: Number, default: 0 },
    completedSchools: { type: Number, default: 0 },

    // Project-Wide Training Feedback & Issues
    issuesNoted: { type: String, default: '' },
    onGroundFeedback: { type: String, default: '' },
    remarks: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

projectTrainingSchema.index({ 'schools.school': 1 });
projectTrainingSchema.index({ 'schools.schoolId': 1 });
projectTrainingSchema.index({ 'schools.assignedTrainerId': 1 });
projectTrainingSchema.index({ 'schools.trainers.trainerId': 1 });

module.exports = mongoose.models.Training || mongoose.model('Training', projectTrainingSchema, 'trainings');
