
const mongoose = require('mongoose');

// Ensure referenced models are registered in Mongoose
try {
  require('../schools/school.model');
  require('../solutions/solution.model');
  require('../hardware/hardware.model');
  require('../content/content-section/content-section.model');
  require('../content/language/language.model');
  require('../content/grade/grade.model');
  require('../content/category/l0category.model');
  require('../employees/employee.model');
} catch (e) {
  // Models will be registered when their respective modules load
}

/*
|--------------------------------------------------------------------------
| REQUIREMENTS MODEL — Dynamic Streamlined Schema
| Aligned with timeline.js stages & Referenced Project-School Structure
| Hierarchy: Project -> School (School Branch) -> Solution -> Hardware & Content
|--------------------------------------------------------------------------
*/

// Subschema: Content item requirement under solution / school
const contentRequirementItemSchema = new mongoose.Schema(
  {
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContentSection',
      default: null
    },
    contentKey: { type: String, trim: true, default: '' },
    reqKey: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, default: '' },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'L0Category',
      default: null
    },
    categoryName: { type: String, trim: true, default: '' },
    language: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
      default: null
    },
    languageName: { type: String, trim: true, default: '' },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      default: null
    },
    gradeName: { type: String, trim: true, default: '' },
    board: { type: String, trim: true, default: '' },
    stream: { type: String, trim: true, default: '' },
    driveLink: { type: String, trim: true, default: '' },
    sheetUrl: { type: String, trim: true, default: '' },
    solution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Solution',
      default: null
    },
    solutionKey: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIGURED', 'IN_PROGRESS', 'READY', 'TESTED', null],
      default: 'PENDING'
    },
    remarks: { type: String, default: '' }
  },
  { _id: true }
);

// Subschema: Individual hardware item lifecycle inside school / solution hardware array
const hardwareExecutionItemSchema = new mongoose.Schema(
  {
    hardware: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hardware',
      default: null
    },
    hardwareKey: { type: String, required: true, trim: true },
    itemName: { type: String, required: true, trim: true },
    hardwareName: { type: String, trim: true, default: '' },
    quantity: { type: Number, default: 1, min: 0 },
    qty: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: 'Units', trim: true },
    specNotes: { type: String, default: '' },
    spec: { type: String, default: '' },
    serialNotes: { type: String, default: '' },
    solution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Solution',
      default: null
    },
    solutionKey: { type: String, default: '', trim: true },
    solutionName: { type: String, default: '', trim: true },

    stockCheck: {
      requiredQty: { type: Number, default: 0 },
      inStockQty: { type: Number, default: 0 },
      purchaseQty: { type: Number, default: 0 },
      stockStatus: {
        type: String,
        enum: ['IN_STOCK', 'PARTIALLY_AVAILABLE', 'NOT_IN_STOCK', null],
        default: 'IN_STOCK'
      },
      assignedTo: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
      verifiedAt: { type: Date },
      remarks: { type: String, default: '' }
    },

    poAndPi: {
      vendorName: { type: String, default: '' },
      purchaseOrders: [
        {
          poNumber: String,
          poDate: Date,
          uploadDate: { type: Date, default: Date.now },
          poDocumentUrl: String,
          issuingOrganization: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: { type: Date, default: Date.now }
        }
      ],
      proformaInvoices: [
        {
          piNumber: String,
          piDate: Date,
          uploadDate: { type: Date, default: Date.now },
          ewayBillNumber: String,
          paymentStatus: {
            type: String,
            enum: ['PAID', 'PARTIALLY_PAID', 'PENDING', 'UNPAID', null],
            default: 'PENDING'
          },
          piDocumentUrl: String,
          paymentTerms: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: { type: Date, default: Date.now }
        }
      ],
      paymentStatus: {
        type: String,
        enum: ['PAID', 'PARTIALLY_PAID', 'PENDING', 'UNPAID', null],
        default: 'PENDING'
      },
      overallRemarks: { type: String, default: '' }
    },

    consignmentTracking: {
      courierName: { type: String, default: '' },
      trackingNumber: { type: String, default: '' },
      dispatchDate: { type: Date },
      expectedDeliveryDate: { type: Date },
      deliveryStatus: {
        type: String,
        enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'PARTIALLY_DELIVERED', null],
        default: 'PENDING'
      },
      actualDeliveryDate: { type: Date },
      proofOfDeliveryUrl: { type: String, default: '' },
      consignments: { type: mongoose.Schema.Types.Mixed, default: [] },
      remarks: { type: String, default: '' }
    },

    hardwareReady: {
      received: { type: Boolean, default: false },
      receivedQty: { type: Number, default: 0 },
      damagedItems: { type: String, default: '' },
      readyForInstallation: {
        type: String,
        enum: ['YES', 'NO', 'PENDING', null],
        default: 'PENDING'
      },
      deliveryDate: { type: Date },
      remarks: { type: String, default: '' }
    },

    stockCheckStatus: { type: String, default: 'IN_STOCK' },
    inStockQty: { type: Number, default: 0 },
    purchaseQty: { type: Number, default: 0 },
    purchaseOrders: { type: mongoose.Schema.Types.Mixed, default: [] },
    proformaInvoices: { type: mongoose.Schema.Types.Mixed, default: [] }
  },
  { _id: true }
);

// Subschema: Solution requirement item with nested Hardware & Content
const solutionRequirementSchema = new mongoose.Schema(
  {
    solution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Solution',
      default: null
    },
    solutionKey: { type: String, trim: true, uppercase: true },
    solutionName: { type: String, trim: true },
    label: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    description: { type: String, default: '' },
    remarks: { type: String, default: '' },

    // Hardware items required according to this solution
    hardware: [hardwareExecutionItemSchema],

    // Content items required according to this solution
    content: [contentRequirementItemSchema]
  },
  { _id: true }
);

// Subschema: School-level requirement record with referenced School, School Branch, Solutions, Hardware & Content
const schoolRequirementSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      default: null
    },
    schoolBranch: {
      type: String,
      trim: true,
      default: ''
    },
    schoolBranchId: {
      type: String,
      trim: true,
      default: ''
    },
    schoolId: {
      type: String,
      trim: true,
      uppercase: true
    },
    schoolName: {
      type: String,
      trim: true,
      default: ''
    },
    order: {
      type: Number,
      default: 1
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    contactPerson: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },

    // Solutions deployed in this school branch (each contains its hardware & content)
    solutions: [solutionRequirementSchema],

    // Flat direct arrays for school-level hardware & content aggregation
    hardware: [hardwareExecutionItemSchema],
    content: [contentRequirementItemSchema],

    readyForInstallation: { type: String, default: 'NO' },
    allHardwareReceived: { type: String, default: 'NO' },
    deliveryDate: { type: Date },
    hardwareMap: { type: mongoose.Schema.Types.Mixed, default: {} },
    remarks: { type: String, default: '' }
  },
  { _id: true }
);

// Hook to ensure solution references propagate down to nested hardware and content
schoolRequirementSchema.pre('validate', function (next) {
  if (this.solutions && Array.isArray(this.solutions)) {
    this.solutions.forEach((sol) => {
      if (sol.hardware && Array.isArray(sol.hardware)) {
        sol.hardware.forEach((hw) => {
          if (!hw.solution && sol.solution) hw.solution = sol.solution;
          if (!hw.solutionKey && sol.solutionKey) hw.solutionKey = sol.solutionKey;
          if (!hw.solutionName && (sol.solutionName || sol.label)) {
            hw.solutionName = sol.solutionName || sol.label;
          }
        });
      }
      if (sol.content && Array.isArray(sol.content)) {
        sol.content.forEach((cnt) => {
          if (!cnt.solution && sol.solution) cnt.solution = sol.solution;
          if (!cnt.solutionKey && sol.solutionKey) cnt.solutionKey = sol.solutionKey;
        });
      }
    });
  }
  if (typeof next === 'function') next();
});

// Backward-compatible alias for existing execution references
const schoolHardwareExecutionSchema = schoolRequirementSchema;

const requirementSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: [true, 'Requirement must belong to a project (projectId required)'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true
    },
    project: {
      type: mongoose.Schema.Types.Mixed,
      index: true
    },

    workflowVersion: {
      type: String,
      default: 'v1'
    },

    // Current Position
    currentStageKey: {
      type: String,
      default: 'PROJECT_REVIEWER'
    },
    currentSubstageKey: {
      type: String,
      default: 'PROJECT_CREATED'
    },

    // ── Schools Requirement Structure (Project -> School Branches -> Solutions -> Hardware & Content) ──
    schools: [schoolRequirementSchema],

    // ─── 01 — PROJECT REVIEWER ───────────────────────────────────────────
    projectReviewer: {
      projectCreated: {
        organizationName: String,
        contactPerson: String,
        contactDesignation: String,
        phone: String,
        email: String,
        location: String,
        leadSource: String,
        expectedProjectValue: Number,
        leadDescription: String,
        confirmed: { type: String, enum: ['YES', 'NO', 'PENDING', null], default: 'PENDING' },
        projectReviewed: { type: String, enum: ['YES', 'NO', 'PENDING', null], default: 'PENDING' },
        projectCreated: { type: String, enum: ['YES', 'NO', 'PENDING', null], default: 'PENDING' },
        country: String,
        address: String,
        confirmationDate: Date,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      }
    },

    // ─── 02 — PO, PI & TAX INVOICE ──────────────────────────────────────
    poAndPi: {
      // Multiple Purchase Orders
      purchaseOrders: [
        {
          poNumber: String,
          poDate: Date,
          uploadDate: { type: Date, default: Date.now },
          poDocumentUrl: String,
          issuingOrganization: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: { type: Date, default: Date.now }
        }
      ],
      poUpload: {
        poNumber: String,
        poDate: Date,
        uploadDate: { type: Date, default: Date.now },
        poDocumentUrl: String,
        issuingOrganization: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      // PI Request
      piRequest: {
        requestedDate: Date,
        expectedPIDate: Date,
        requestRemarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      // Multiple Proforma Invoices
      proformaInvoices: [
        {
          piNumber: String,
          piDate: Date,
          uploadDate: { type: Date, default: Date.now },
          ewayBillNumber: String,
          paymentStatus: { type: String, enum: ['PAID', 'PARTIALLY_PAID', 'PENDING', 'UNPAID', null], default: 'PENDING' },
          piDocumentUrl: String,
          paymentTerms: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: { type: Date, default: Date.now }
        }
      ],
      // Multiple Tax Invoices
      taxInvoices: [
        {
          invoiceNumber: String,
          invoiceDate: Date,
          uploadDate: { type: Date, default: Date.now },
          ewayBillNumber: String,
          paymentStatus: { type: String, enum: ['PAID', 'PARTIALLY_PAID', 'PENDING', 'UNPAID', null], default: 'PENDING' },
          invoiceDocumentUrl: String,
          paymentTerms: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: { type: Date, default: Date.now }
        }
      ],
      piUpload: {
        piNumber: String,
        piDate: Date,
        piUploadDate: Date,
        piDocumentUrl: String,
        invoiceNumber: String,
        invoiceDate: Date,
        invoiceUploadDate: Date,
        invoiceDocumentUrl: String,
        ewayBillNumber: String,
        paymentStatus: { type: String, enum: ['PAID', 'PARTIALLY_PAID', 'PENDING', 'UNPAID', null], default: 'PENDING' },
        uploadDate: Date,
        paymentTerms: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      }
    },

    // ─── 03 — ORDER REQUIREMENT ──────────────────────────────────────────
    orderRequirement: {
      // Structured schools list referencing School, Solution, Hardware and Content
      schools: [schoolRequirementSchema],
      schoolInformation: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      solutionSelection: {
        activeSolutionKeys: [String],
        schoolWiseSolutions: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        solutions: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        assignedTechLead: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        assignedContentLead: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        overallNotes: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      hardwareRequirement: {
        activeHardwareKeys: [String],
        schoolWiseHardware: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        assignedHardwareManager: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        overallHardwareNotes: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      contentConfiguration: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },

    // ─── 06 — EXECUTION ──────────────────────────────────────────────────
    execution: {
      schoolWiseHardware: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      tech: {
        technicalSetup: {
          operatingSystem: String,
          applicationsRequired: String,
          devicesConfigured: Number,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        implementationAndConfig: {
          modulesConfigured: String,
          softwareInstalled: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        techInternalTesting: {
          overallResult: { type: String, enum: ['PASS', 'FAIL', 'PARTIAL', null], default: null },
          issues: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        techReady: {
          ready: { type: String, enum: ['YES', 'NO', null], default: null },
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        }
      },
      content: {
        contentPreparation: {
          classes: String,
          subjects: String,
          language: String,
          curriculum: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        contentConfig: {
          contentUploaded: Boolean,
          configurationNotes: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        contentReviewQA: {
          qaResult: { type: String, enum: ['PASS', 'FAIL', 'PARTIAL', null], default: null },
          issues: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        sheetReadiness: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        contentReady: {
          ready: { type: String, enum: ['YES', 'NO', null], default: null },
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        }
      }
    },

    // ─── 07 — TECH + CONTENT TESTING ────────────────────────────────────
    techAndContentTesting: {
      testingPreparation: {
        testEnvironment: String,
        plannedTestingDate: Date,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      integrationTesting: {
        integrationStatus: { type: String, enum: ['PASS', 'FAIL', 'PARTIAL', null], default: null },
        issues: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      issueResolution: {
        resolutionSummary: String,
        retestResult: { type: String, enum: ['PASS', 'FAIL', 'PENDING', null], default: null },
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      testingCompleted: {
        passed: { type: String, enum: ['YES', 'NO', null], default: null },
        finalResult: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      }
    },

    // ─── 08 — INSTALLATION ───────────────────────────────────────────────
    installation: {
      installationPlanning: {
        installationPlanning: mongoose.Schema.Types.Mixed,
        plannedSchools: mongoose.Schema.Types.Mixed,
        schoolWiseInstallationPlans: mongoose.Schema.Types.Mixed,
        technicalPerson: String,
        technicalPersonId: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        contactNumber: String,
        leadEngineer: String,
        phone: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      installationCompleted: {
        completed: { type: String, enum: ['YES', 'NO', null], default: null },
        installationReportUrl: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      }
    },

    // ─── 10 — PROJECT CLOSURE ────────────────────────────────────────────
    projectClosure: {
      finalProjectReview: {
        reviewed: Boolean,
        pendingItems: String,
        clientFeedback: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      documentationCompletion: {
        handoverDocumentUrl: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      paymentTracking: {
        totalProjectAmount: Number,
        totalPaidAmount: Number,
        totalPendingAmount: Number,
        paymentStatus: { type: String, enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'] },
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      projectClosed: {
        approved: { type: String, enum: ['YES', 'NO', null], default: null },
        closureDate: Date,
        closureRemarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      }
    },

    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },

    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Employee'
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

// ── Compound Indexes for Fast Lookups & Relational Queries ───────────────────
requirementSchema.index({ projectId: 1, currentStageKey: 1, currentSubstageKey: 1 });
requirementSchema.index({ 'schools.school': 1 });
requirementSchema.index({ 'schools.schoolId': 1 });
requirementSchema.index({ 'schools.schoolBranch': 1 });
requirementSchema.index({ 'schools.solutions.solution': 1 });
requirementSchema.index({ 'schools.solutions.hardware.hardware': 1 });
requirementSchema.index({ 'schools.solutions.content.content': 1 });
requirementSchema.index({ 'orderRequirement.schools.school': 1 });

// Pre-save hook to synchronize root schools array and orderRequirement.schools array
requirementSchema.pre('save', function (next) {
  // Propagate solution details to child hardware & content in schools
  const targetSchools = this.schools && this.schools.length > 0 ? this.schools : this.orderRequirement?.schools;
  if (targetSchools && Array.isArray(targetSchools)) {
    targetSchools.forEach((sch) => {
      if (sch.solutions && Array.isArray(sch.solutions)) {
        sch.solutions.forEach((sol) => {
          if (sol.hardware && Array.isArray(sol.hardware)) {
            sol.hardware.forEach((hw) => {
              if (!hw.solution && sol.solution) hw.solution = sol.solution;
              if (!hw.solutionKey && sol.solutionKey) hw.solutionKey = sol.solutionKey;
              if (!hw.solutionName && (sol.solutionName || sol.label)) {
                hw.solutionName = sol.solutionName || sol.label;
              }
            });
          }
          if (sol.content && Array.isArray(sol.content)) {
            sol.content.forEach((cnt) => {
              if (!cnt.solution && sol.solution) cnt.solution = sol.solution;
              if (!cnt.solutionKey && sol.solutionKey) cnt.solutionKey = sol.solutionKey;
            });
          }
        });
      }
    });
  }

  if (this.schools && this.schools.length > 0) {
    if (!this.orderRequirement) this.orderRequirement = {};
    this.orderRequirement.schools = this.schools;
  } else if (this.orderRequirement && this.orderRequirement.schools && this.orderRequirement.schools.length > 0) {
    this.schools = this.orderRequirement.schools;
  }
  next();
});

const Requirement = mongoose.models.Requirement || mongoose.model('Requirement', requirementSchema);

module.exports = Requirement;