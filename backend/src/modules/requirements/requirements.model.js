const mongoose = require('mongoose');

/*
|--------------------------------------------------------------------------
| REQUIREMENTS MODEL — Dynamic Streamlined Schema
| Aligned with timeline.js stages
|--------------------------------------------------------------------------
*/

// Subschema: Individual hardware item lifecycle inside school hardware array
const hardwareExecutionItemSchema = new mongoose.Schema(
  {
    hardwareKey: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    qty: { type: Number, default: 1 },
    specNotes: { type: String, default: '' },
    spec: { type: String, default: '' },
    serialNotes: { type: String, default: '' },
    solutionKey: { type: String, default: '' },
    solutionName: { type: String, default: '' },

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
  { _id: false }
);

// Subschema: School-level execution record with an array of hardware items
const schoolHardwareExecutionSchema = new mongoose.Schema(
  {
    schoolId: { type: String },
    schoolName: { type: String },
    address: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    phone: { type: String, default: '' },
    readyForInstallation: { type: String, default: 'NO' },
    allHardwareReceived: { type: String, default: 'NO' },
    deliveryDate: { type: Date },
    hardware: [hardwareExecutionItemSchema],
    hardwareMap: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const requirementSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.ObjectId,
      ref: 'Project',
      required: [true, 'Requirement must belong to a project'],
      unique: true,
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

requirementSchema.index({ project: 1, currentStageKey: 1, currentSubstageKey: 1 });

module.exports = mongoose.model('Requirement', requirementSchema);