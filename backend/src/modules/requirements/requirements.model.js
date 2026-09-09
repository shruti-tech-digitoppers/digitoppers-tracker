const mongoose = require('mongoose');

/*
|--------------------------------------------------------------------------
| REQUIREMENTS MODEL — Dynamic Streamlined Schema
| Aligned with timeline.js stages
|--------------------------------------------------------------------------
*/

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

    // ─── 02 — PO & PI (PURCHASE ORDER & PROFORMA INVOICE) ────────────────
    poAndPi: {
      poUpload: {
        projectName: String,
        poDocumentUrl: String,
        poNumber: String,
        poDate: Date,
        poAmount: Number,
        issuingOrganization: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      piRequest: {
        requestedDate: Date,
        expectedPIDate: Date,
        requestRemarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      piUpload: {
        piDocumentUrl: String,
        piNumber: String,
        piDate: Date,
        amount: Number,
        tax: Number,
        totalAmount: Number,
        paymentTerms: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      }
    },

    // ─── 03 — ORDER REQUIREMENT ──────────────────────────────────────────
    orderRequirement: {
      schoolInformation: {
        schoolName: String,
        schoolCode: String,
        address: String,
        deploymentLocations: String,
        principalName: String,
        contactPerson: String,
        phone: String,
        email: String,
        totalStudents: Number,
        labAvailable: String,
        internetAvailable: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      solutionSelection: {
        solutions: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        overallNotes: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      hardwareRequirement: {
        hardware: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        overallHardwareNotes: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      }
    },

    // ─── 06 — EXECUTION ──────────────────────────────────────────────────
    execution: {
      hardware: {
        reqAndStockCheck: {
          checked: Boolean,
          stockSummary: String,
          stockStatus: { type: String, enum: ['IN_STOCK', 'PARTIALLY_AVAILABLE', 'NOT_IN_STOCK'] },
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        purchaseIfNeeded: {
          vendorName: String,
          purchaseOrderNumber: String,
          purchaseAmount: Number,
          purchaseDocumentUrl: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        consignmentTracking: {
          courierName: String,
          trackingNumber: String,
          dispatchDate: Date,
          expectedDeliveryDate: Date,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        addressConfirmation: {
          deliveryAddress: String,
          contactPerson: String,
          phone: String,
          addressConfirmed: { type: String, enum: ['YES', 'NO', null], default: null },
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        deliveryAndTracking: {
          dispatchDate: Date,
          deliveryDate: Date,
          deliveryStatus: { type: String, enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'PARTIALLY_DELIVERED'] },
          proofOfDeliveryUrl: String,
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        },
        hardwareReady: {
          allHardwareReceived: { type: String, enum: ['YES', 'NO', null], default: null },
          damagedItems: String,
          readyForInstallation: { type: String, enum: ['YES', 'NO', null], default: null },
          remarks: String,
          submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
          submittedAt: Date
        }
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
        installationDate: Date,
        teamMembers: String,
        siteContact: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      installationExecution: {
        installationStarted: Boolean,
        installedItems: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      installationTesting: {
        testResult: { type: String, enum: ['PASS', 'FAIL', 'PARTIAL', null], default: null },
        issues: String,
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

    // ─── 09 — TRAINING ───────────────────────────────────────────────────
    training: {
      trainingPlanning: {
        trainingType: String,
        participantsCount: Number,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      trainingSchedule: {
        trainingDate: Date,
        mode: { type: String, enum: ['ONLINE', 'OFFLINE', 'HYBRID'] },
        trainerName: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      trainingExecution: {
        attendance: Number,
        topicsCovered: String,
        trainingPhotosUrl: String,
        remarks: String,
        submittedBy: { type: mongoose.Schema.ObjectId, ref: 'Employee' },
        submittedAt: Date
      },
      trainingCompleted: {
        completed: { type: String, enum: ['YES', 'NO', null], default: null },
        feedbackSummary: String,
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
    timestamps: true
  }
);

requirementSchema.index({ project: 1, currentStageKey: 1, currentSubstageKey: 1 });

module.exports = mongoose.model('Requirement', requirementSchema);