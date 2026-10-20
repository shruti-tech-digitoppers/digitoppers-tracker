const mongoose = require('mongoose');

// ── Subschema 1: Hardware Item Allocated to a School ──────────────────────────
const schoolHardwareItemSchema = new mongoose.Schema(
  {
    hardwareId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hardware'
    },
    hardwareKey: {
      type: String,
      trim: true,
      default: ''
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    allocatedQuantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Allocated quantity must be at least 1']
    },
    deliveredQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    isReceived: {
      type: Boolean,
      default: false
    },
    damagedNotes: {
      type: String,
      default: ''
    },
    readyForInstallation: {
      type: String,
      enum: ['YES', 'NO', 'PENDING', null],
      default: 'PENDING'
    },
    serialNumbers: [
      {
        type: String,
        trim: true
      }
    ],
    dispatchCourier: {
      type: String,
      default: '',
      trim: true
    },
    trackingNumber: {
      type: String,
      default: '',
      trim: true
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'PARTIALLY_DELIVERED', null],
      default: 'PENDING'
    }
  },
  { _id: false }
);

// ── Subschema 2: Solution & Content Config for a School ────────────────────────
const schoolSolutionItemSchema = new mongoose.Schema(
  {
    solutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Solution'
    },
    solutionKey: {
      type: String,
      trim: true,
      default: ''
    },
    name: {
      type: String,
      default: 'Smart Classroom Setup',
      trim: true
    },
    customLabName: {
      type: String,
      default: 'Smart Classroom',
      trim: true
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    grades: [
      {
        type: String,
        trim: true
      }
    ],
    streams: [
      {
        type: String,
        trim: true
      }
    ],
    customApkUrl: {
      type: String,
      default: '',
      trim: true
    },
    osImageVersion: {
      type: String,
      default: 'DigiOS-v2.4.0',
      trim: true
    },
    lmsVersion: {
      type: String,
      default: 'DigiLMS-2026',
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIGURED', 'TESTED', 'DEPLOYED'],
      default: 'CONFIGURED'
    }
  },
  { _id: false }
);

// ── Subschema 3: 7-Section Onboarding Survey ───────────────────────────────────
const schoolSurveySchema = new mongoose.Schema(
  {
    // Section 1: School Identity
    schoolCategory: [{ type: String }],
    classes: [{ type: String }],
    streams: [{ type: String }],
    principalName: { type: String, trim: true, default: '' },
    principalDetails: { type: String, trim: true, default: '' },
    pocName: { type: String, trim: true, default: '' },
    pocDesignation: { type: String, trim: true, default: '' },
    pocContact: { type: String, trim: true, default: '' },

    // Section 2: Demographics
    totalTeachers: { type: Number, default: 0 },
    subjectWiseTeachers: { type: String, default: '' },
    classWiseSubjects: { type: String, default: '' },
    triSystemType: { type: String, default: '' },
    totalStudents: { type: Number, default: 0 },
    regularStudentsRatio: { type: String, default: '' },
    studentCommittee: { type: String, default: '' },
    villagesCount: { type: String, default: '' },
    parentsOccupation: { type: String, default: '' },
    studentAttendance: { type: String, default: '' },
    overallResult: { type: String, default: '' },

    // Section 3: Infrastructure
    totalClassrooms: { type: Number, default: 0 },
    classroomCondition: [{ type: String }],
    additionalRooms: { type: String, default: '' },
    spareRooms: { type: String, default: '' },
    electricityInternetAvailability: { type: String, default: '' },
    drinkingWaterAvailability: { type: String, default: '' },
    washroomAvailability: { type: String, default: '' },

    // Section 4: Digital Initiatives
    ictLabAvailable: { type: String, default: 'Yes' },
    ictSetupDate: { type: String, default: '' },
    ictHardwareComponents: { type: String, default: '' },
    digitalContentProvided: { type: String, default: '' },
    digitalContentClasses: { type: String, default: '' },
    ictLabFunctional: { type: String, default: 'Yes' },
    ictWeeklyUsage: { type: String, default: '' },
    ictStudentCount: { type: String, default: '' },
    computerTeacherAvailable: { type: String, default: 'Yes' },
    internetFacilityType: { type: String, default: '' },
    libraryCornerAvailable: { type: String, default: 'Yes' },
    govtBooksCount: { type: String, default: '' },
    fullTimeLibrarian: { type: String, default: 'Yes' },
    newspaperSubscription: { type: String, default: '' },

    // Section 5: Stakeholders & Photos
    additionalNotes: { type: String, default: '' },
    otherStakeholders: { type: String, default: '' },
    supportingOrgName: { type: String, default: '' },
    supportingOrgContactPerson: { type: String, default: '' },
    supportingOrgDesignation: { type: String, default: '' },
    supportingOrgContact: { type: String, default: '' },
    supportingOrgEmail: { type: String, default: '' },
    smartClassRoomIdentification: { type: String, default: '' },
    smartClassRoomCondition: { type: String, default: '' },
    photoFrontView: { type: String, default: '' },
    photoSmartRoom: { type: String, default: '' },

    // Section 6: Socio-Economic
    parentIncomeGroup: [{ type: String }],
    parentProfessions: [{ type: String }],
    parentProfessionOther: { type: String, default: '' },
    parentEducationLevel: [{ type: String }],
    firstGenerationLearner: { type: String, default: 'No' },

    // Section 7: Security & Handling
    securityGuard: { type: String, default: '' },
    ictSecurityMeasures: { type: String, default: '' },
    deviceStorage: { type: String, default: '' },
    lostDeviceProtocol: { type: String, default: '' },
    dataBackupPlan: { type: String, default: '' },
    responsibleUseTraining: { type: String, default: '' },
    usageTrackingMechanism: { type: String, default: '' },
    cybersecurityPolicies: { type: String, default: '' },
    breachHistory: { type: String, default: 'Nil' },
    digitoppersSecurityCooperation: { type: String, default: '' },
    safetyHazardsMitigation: { type: String, default: '' }
  },
  { _id: false }
);

// ── Subschema 4: School Installation Lifecycle ─────────────────────────────────
const schoolInstallationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    assignedEngineerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
    scheduledDate: {
      type: Date,
      default: null
    },
    planOutDate: {
      type: String,
      default: '',
      trim: true
    },
    engineerContact: {
      type: String,
      default: '',
      trim: true
    },
    completedDate: {
      type: Date,
      default: null
    },
    completionPhotos: [
      {
        type: String,
        trim: true
      }
    ],
    signedChallanUrl: {
      type: String,
      default: '',
      trim: true
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  { _id: false }
);

// ── Subschema 5: School Teacher Training Lifecycle ─────────────────────────────
const schoolTrainingSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
      index: true
    },
    assignedTrainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
    trainerName: { type: String, default: '', trim: true },
    trainerPhone: { type: String, default: '', trim: true },
    planOutDate: { type: String, default: '' },
    trainingDate: {
      type: Date,
      default: null
    },
    trainingMode: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'HYBRID'],
      default: 'OFFLINE'
    },
    teachersTrainedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryConfirmationSheetUrl: {
      type: String,
      default: '',
      trim: true
    },
    appreciationLetterUrl: {
      type: String,
      default: '',
      trim: true
    },
    workCompletionLetterUrl: {
      type: String,
      default: '',
      trim: true
    },
    teachersDetailsDocUrl: {
      type: String,
      default: '',
      trim: true
    },
    checklist: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    photographyPhotosUrl: {
      type: String,
      default: '',
      trim: true
    },
    googleReviewsNotes: {
      type: String,
      default: '',
      trim: true
    },
    attendanceSheetUrl: {
      type: String,
      default: '',
      trim: true
    },
    feedbackRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    issuesNoted: {
      type: String,
      default: '',
      trim: true
    },
    onGroundFeedback: {
      type: String,
      default: '',
      trim: true
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  { _id: false }
);

// ── Subschema 6: School Handover & AMC Closure ─────────────────────────────────
const schoolClosureSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SIGNED_OFF'],
      default: 'PENDING'
    },
    signOffDate: {
      type: Date,
      default: null
    },
    signOffDocumentUrl: {
      type: String,
      default: '',
      trim: true
    },
    amcStartDate: {
      type: Date,
      default: null
    },
    amcEndDate: {
      type: Date,
      default: null
    },
    warrantyYears: {
      type: Number,
      default: 3
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  { _id: false }
);

// ── Main School Schema ─────────────────────────────────────────────────────────
const schoolSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'School must belong to a project'],
      index: true
    },
    schoolId: {
      type: String,
      trim: true,
      uppercase: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true
    },
    board: {
      type: String,
      default: 'CBSE',
      trim: true
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    district: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    pincode: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    contactPerson: {
      name: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      designation: { type: String, trim: true, default: 'Principal' }
    },
    
    // 360° Living Lifecycle Subschemas
    survey: {
      type: schoolSurveySchema,
      default: () => ({})
    },
    solutions: [schoolSolutionItemSchema],
    hardware: [schoolHardwareItemSchema],
    installation: {
      type: schoolInstallationSchema,
      default: () => ({})
    },
    training: {
      type: schoolTrainingSchema,
      default: () => ({})
    },
    closure: {
      type: schoolClosureSchema,
      default: () => ({})
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound Indexes for High-Performance Queries
schoolSchema.index({ projectId: 1, 'installation.status': 1 });
schoolSchema.index({ projectId: 1, 'training.status': 1 });
schoolSchema.index({ 'installation.assignedEngineerId': 1, 'installation.status': 1 });
schoolSchema.index({ 'training.assignedTrainerId': 1, 'training.status': 1 });

// Virtual aliases for canonical specification compatibility
schoolSchema.virtual('schoolName').get(function () {
  return this.name;
}).set(function (v) {
  this.name = v;
});

schoolSchema.virtual('schoolCode').get(function () {
  return this.schoolId || '';
}).set(function (v) {
  this.schoolId = v;
});

schoolSchema.pre('save', function (next) {
  if (!this.schoolId) {
    this.schoolId = this._id ? this._id.toString() : '';
  }
  if (typeof next === 'function') next();
});

schoolSchema.virtual('phone').get(function () {
  return this.contactPerson?.phone || '';
});

schoolSchema.virtual('email').get(function () {
  return this.contactPerson?.email || '';
});

module.exports = mongoose.model('School', schoolSchema);
