const mongoose = require('mongoose');

// Sub-schema: Hardware Item Deployment per School
const schoolHardwareDeploymentSchema = new mongoose.Schema(
  {
    hardwareKey: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    specNotes: { type: String, default: '' },
    solutionName: { type: String, default: '' },
    // 1. Warehouse Stock Verification (Owned by OPS)
    stockCheck: {
      requiredQty: { type: Number, default: 0 },
      inStockQty: { type: Number, default: 0 },
      purchaseQty: { type: Number, default: 0 },
      stockStatus: {
        type: String,
        enum: ['IN_STOCK', 'PARTIALLY_AVAILABLE', 'NOT_IN_STOCK', null],
        default: 'IN_STOCK'
      },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      verifiedAt: Date,
      remarks: { type: String, default: '' }
    },
    // 2. LAYER 2: VENDOR PO & PI PER HARDWARE (Ops raises PO, Finance clears PI)
    poAndPi: {
      vendorName: { type: String, default: '' },
      paymentStatus: {
        type: String,
        enum: ['PAID', 'PARTIALLY_PAID', 'PENDING', 'UNPAID', null],
        default: 'PENDING'
      },
      purchaseOrders: [
        {
          poNumber: String,
          poDate: Date,
          poDocumentUrl: String,
          issuingOrganization: String,
          poAmount: Number,
          submittedByDept: { type: String, default: 'OPS' },
          submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
          remarks: String
        }
      ],
      proformaInvoices: [
        {
          piNumber: String,
          piDate: Date,
          ewayBillNumber: String,
          paymentStatus: String,
          piDocumentUrl: String,
          paymentReferenceUTR: String,
          approvedByDept: { type: String, default: 'FIN' },
          approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
          remarks: String
        }
      ]
    },
    // 3. Logistics & Courier Tracking
    consignmentTracking: {
      courierName: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      dispatchDate: Date,
      expectedDeliveryDate: Date,
      actualDeliveryDate: Date,
      deliveryStatus: {
        type: String,
        enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', null],
        default: 'PENDING'
      },
      proofOfDeliveryUrl: { type: String, default: '' }
    },
    // 4. Gate Reception & Readiness Verification
    hardwareReady: {
      received: { type: Boolean, default: false },
      receivedQty: { type: Number, default: 0 },
      damagedItems: { type: String, default: '' },
      readyForInstallation: {
        type: String,
        enum: ['YES', 'NO', 'PENDING', null],
        default: 'PENDING'
      },
      deliveryDate: Date
    }
  },
  { _id: true }
)

// Sub-schema: Complete School Execution Object
const schoolDeploymentUnitSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    schoolId: { type: String, required: true },
    schoolName: { type: String, required: true },
    deploymentStatus: {
      type: String,
      enum: ['SURVEY_PENDING', 'PROCUREMENT', 'IN_TRANSIT', 'DELIVERED', 'INSTALLING', 'COMPLETED'],
      default: 'SURVEY_PENDING'
    },
    // A. Site Info Gathering & Readiness Survey (OPS)
    siteSurvey: {
      roomReady: { type: Boolean, default: false },
      powerBackupAvailable: { type: Boolean, default: false },
      networkAvailable: { type: Boolean, default: false },
      classroomDimension: { type: String, default: '' },
      surveyNotes: { type: String, default: '' },
      surveyDate: Date,
      surveyor: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }
    },
    // B. Solutions Deployed in this School
    solutions: [
      {
        solutionKey: String,
        solutionName: String,
        quantity: { type: Number, default: 1 }
      }
    ],
    // C. Hardware Allocation Array (with Stock, Vendor PO/PIs, Tracking)
    hardware: [schoolHardwareDeploymentSchema],
    // D. Site Physical Installation Sign-off (OPS / Field Engg)
    installation: {
      status: {
        type: String,
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
        default: 'NOT_STARTED'
      },
      assignedEngineer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      startedAt: Date,
      completedAt: Date,
      signOffDocumentUrl: { type: String, default: '' },
      remarks: { type: String, default: '' }
    },
    // E. Teacher & Staff Training (TRAINING Department)
    training: {
      status: {
        type: String,
        enum: ['NOT_STARTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'NOT_STARTED'
      },
      trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      trainerName: { type: String, default: '' },
      trainerPhone: { type: String, default: '' },
      trainers: [
        {
          trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
          name: String,
          phone: String,
          role: String
        }
      ],
      trainingDate: Date,
      planOutDate: { type: String, default: '' },
      // Execution fields
      deliveryConfirmationSheetUrl: { type: String, default: '' },
      appreciationLetterUrl: { type: String, default: '' },
      workCompletionLetterUrl: { type: String, default: '' },
      teachersDetailsDocUrl: { type: String, default: '' },
      checklist: {
        type: mongoose.Schema.Types.Mixed,
        default: {
          trainingDone: false,
          applicationWorking: false,
          teachersTraining: false,
          teachersIdCreated: false,
          photographyShootsDone: false,
          googleReviews: false
        }
      },
      photographyPhotosUrl: { type: String, default: '' },
      googleReviewsNotes: { type: String, default: '' },
      teachersAttended: { type: Number, default: 0 },
      attendanceSheetUrl: { type: String, default: '' },
      feedbackRating: { type: Number, min: 1, max: 5 },
      issuesNoted: { type: String, default: '' },
      onGroundFeedback: { type: String, default: '' },
      remarks: { type: String, default: '' }
    }
  },
  { _id: true }
);

const projectSchoolsSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true
    },
    projectId: { type: String, required: true, index: true },
    projectName: { type: String, required: true },
    // ── STAGE 03: ORDER REQUIREMENT SPECIFICATION (Project Level BOM) ──
    orderRequirement: {
      solutionsSelected: [{ solutionKey: String, solutionName: String }],
      totalSchoolsEnrolled: { type: Number, default: 0 },
      overallHardwareBOM: {
        type: mongoose.Schema.Types.Mixed,
        default: {} // Keyed by hardwareKey with total project quotas
      },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      submittedAt: Date
    },
    // ── GROUND SCHOOL DEPLOYMENTS ARRAY ──
    schools: [schoolDeploymentUnitSchema],
    // ── STAGE 07: TRAINING DEPARTMENT DATA (Canonical ground storage for Training) ──
    training: {
      planning: { type: mongoose.Schema.Types.Mixed, default: {} },
      execution: { type: mongoose.Schema.Types.Mixed, default: {} },
      schedule: { type: mongoose.Schema.Types.Mixed, default: {} },
      completed: { type: mongoose.Schema.Types.Mixed, default: {} },
      schoolWiseTrainingPlans: { type: mongoose.Schema.Types.Mixed, default: {} },
      schoolWiseTrainingExecutions: { type: mongoose.Schema.Types.Mixed, default: {} },
      schoolWiseTrainingCompletion: { type: mongoose.Schema.Types.Mixed, default: {} },
      overallStatus: {
        type: String,
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'NOT_STARTED'
      },
      issuesNoted: { type: String, default: '' },
      onGroundFeedback: { type: String, default: '' },
      remarks: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

// Indexes
projectSchoolsSchema.index({ 'schools.school': 1 });
projectSchoolsSchema.index({ 'schools.schoolId': 1 });
projectSchoolsSchema.index({ 'schools.installation.assignedEngineer': 1 });

module.exports = mongoose.models.ProjectSchools || mongoose.model('ProjectSchools', projectSchoolsSchema, 'projectschools');
