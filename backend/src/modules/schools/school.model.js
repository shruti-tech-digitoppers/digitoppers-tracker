const mongoose = require('mongoose');

// ── Contact Person Subschema ──────────────────────────────────────────────────
const contactPersonSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: 'Principal' }
  },
  { _id: false }
);

// ── School Survey Subschema (Stage 3 Task 1: School Onboarding Survey) ─────────
const schoolSurveySchema = new mongoose.Schema(
  {
    // ── 1. School Identity & Branch ──────────────────────────────────────────
    schoolBranch: { type: String, trim: true, default: '' },
    order: { type: Number, default: 1 },
    schoolCategory: [{ type: String }],
    classes: [{ type: String }],
    streams: [{ type: String }],
    principalName: { type: String, trim: true, default: '' },
    principalDetails: { type: String, trim: true, default: '' },
    pocName: { type: String, trim: true, default: '' },
    pocDesignation: { type: String, trim: true, default: '' },
    pocContact: { type: String, trim: true, default: '' },

    // ── 2. Demographics ──────────────────────────────────────────────────────
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

    // ── 3. Infrastructure ────────────────────────────────────────────────────
    totalClassrooms: { type: Number, default: 0 },
    classroomCondition: [{ type: String }],
    additionalRooms: { type: String, default: '' },
    spareRooms: { type: String, default: '' },
    electricityInternetAvailability: { type: String, default: '' },
    drinkingWaterAvailability: { type: String, default: '' },
    washroomAvailability: { type: String, default: '' },

    // ── 4. Digital Initiatives & ICT Lab ─────────────────────────────────────
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

    // ── 5. Stakeholders & Observation ────────────────────────────────────────
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

    // ── 6. Socio-Economic Background ─────────────────────────────────────────
    parentIncomeGroup: [{ type: String }],
    parentProfessions: [{ type: String }],
    parentProfessionOther: { type: String, default: '' },
    parentEducationLevel: [{ type: String }],
    firstGenerationLearner: { type: String, default: 'No' },

    // ── 7. Security and Handling ─────────────────────────────────────────────
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

// ── Main School Schema (Strictly Stage 3 Task 1 School Info Referenced to Project) ──
const schoolSchema = new mongoose.Schema(
  {
    // ── Project Reference (Core Backend Project Reference) ──
    project: {
      type: mongoose.Schema.Types.Mixed,
      index: true
    },
    projectId: {
      type: String,
      required: [true, 'School must belong to a project (projectId is required)'],
      trim: true,
      lowercase: true,
      index: true
    },

    // ── Order for Indexing & Sorting in School List ──
    order: {
      type: Number,
      default: 1,
      index: true
    },

    // ── 1. School Info ──
    name: {
      type: String,
      required: [true, 'School name is required'],
      trim: true
    },
    schoolBranch: {
      type: String,
      trim: true,
      default: ''
    },
    schoolId: {
      type: String,
      trim: true,
      uppercase: true,
      index: true
    },
    board: {
      type: String,
      default: 'CBSE',
      trim: true
    },
    schoolCategory: [{
      type: String,
      trim: true
    }],
    classes: [{
      type: String,
      trim: true
    }],
    streams: [{
      type: String,
      trim: true
    }],
    address: {
      type: String,
      trim: true,
      default: ''
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

    // ── 2. Contact Person ──
    contactPerson: {
      type: contactPersonSchema,
      default: () => ({})
    },
    principalName: {
      type: String,
      trim: true,
      default: ''
    },
    principalDetails: {
      type: String,
      trim: true,
      default: ''
    },
    pocName: {
      type: String,
      trim: true,
      default: ''
    },
    pocDesignation: {
      type: String,
      trim: true,
      default: ''
    },
    pocContact: {
      type: String,
      trim: true,
      default: ''
    },

    // ── 3. School Survey (Strictly Stage 3 Task 1 Data) ──
    survey: {
      type: schoolSurveySchema,
      default: () => ({})
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ── Compound Indexes for Fast Project-Wise Ordering & Lookup ──────────────────
schoolSchema.index({ projectId: 1, order: 1 });
schoolSchema.index({ project: 1, order: 1 });
schoolSchema.index({ projectId: 1, name: 1 });
schoolSchema.index({ projectId: 1, schoolBranch: 1 });

// ── Virtual Aliases for Backward & Display Compatibility ──────────────────────
schoolSchema.virtual('schoolName').get(function () {
  return this.name;
}).set(function (v) {
  this.name = v;
});

schoolSchema.virtual('branch').get(function () {
  return this.schoolBranch;
}).set(function (v) {
  this.schoolBranch = v;
});

schoolSchema.virtual('schoolCode').get(function () {
  return this.schoolId || (this._id ? this._id.toString() : '');
}).set(function (v) {
  this.schoolId = v;
});

schoolSchema.virtual('schoolSurvey').get(function () {
  return this.survey;
}).set(function (v) {
  this.survey = v;
});

schoolSchema.virtual('phone').get(function () {
  return this.contactPerson?.phone || this.principalDetails || this.pocContact || '';
});

schoolSchema.virtual('email').get(function () {
  return this.contactPerson?.email || '';
});

// Auto-fill schoolId and synchronize branch/order before save
schoolSchema.pre('save', function (next) {
  if (!this.schoolId) {
    this.schoolId = this._id ? this._id.toString() : '';
  }
  if (!this.schoolBranch && this.survey?.schoolBranch) {
    this.schoolBranch = this.survey.schoolBranch;
  }
  if (this.survey && !this.survey.schoolBranch && this.schoolBranch) {
    this.survey.schoolBranch = this.schoolBranch;
  }
  if (this.survey && this.order && !this.survey.order) {
    this.survey.order = this.order;
  }
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('School', schoolSchema);
