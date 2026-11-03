const mongoose = require('mongoose');

const taskFormDataSchema = new mongoose.Schema({
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
    required: [true, 'Phase reference is required'],
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task reference is required']
  },
  taskKey: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false
  },
  inputs: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  references: {
    schools: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School'
    }],
    documents: [{
      docType: { type: String, trim: true }, // 'PO' | 'PI' | 'TAX_INVOICE' | 'INSTALLATION_REPORT' | 'HANDOVER'
      fileUrl: { type: String, trim: true },
      fileName: { type: String, trim: true },
      referenceNumber: { type: String, trim: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    hardwareItems: [{
      hardware: { type: mongoose.Schema.Types.ObjectId, ref: 'Hardware' },
      hardwareKey: { type: String },
      hardwareName: { type: String },
      quantity: { type: Number, default: 0 },
      inStock: { type: Number, default: 0 },
      toPurchase: { type: Number, default: 0 }
    }],
    solutions: [{
      solution: { type: mongoose.Schema.Types.ObjectId, ref: 'Solution' },
      solutionKey: { type: String },
      solutionName: { type: String },
      quantity: { type: Number, default: 0 }
    }]
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

taskFormDataSchema.index({ task: 1 }, { unique: true });
taskFormDataSchema.index({ projectId: 1, taskKey: 1 });

module.exports = mongoose.models.TaskFormData || mongoose.model('TaskFormData', taskFormDataSchema, 'taskformdata');
