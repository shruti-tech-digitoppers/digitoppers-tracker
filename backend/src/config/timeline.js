module.exports = {
  version: 'v1',
  stages: [
    {
      key: 'PROJECT_REVIEWER',
      name: '01 — PROJECT REVIEWER',
      order: 1,
      metadata: { noAssignment: true },
      substages: [
        {
          key: 'PROJECT_CREATED',
          name: 'Project Created',
          order: 1,
          metadata: { noAssignment: true },
          formSchema: {
            fields: [
              { key: 'organizationName', label: 'Organization / School Name', type: 'text', required: true },
              { key: 'contactPerson', label: 'Contact Person Name', type: 'text' },
              { key: 'contactDesignation', label: 'Designation', type: 'text' },
              { key: 'phone', label: 'Phone Number', type: 'text' },
              { key: 'email', label: 'Email Address', type: 'text' },
              { key: 'location', label: 'Location / City', type: 'text' },
              { key: 'leadSource', label: 'Lead Source', type: 'select', options: ['Cold Call', 'Referral', 'Tender / RFP', 'Government Portal', 'Exhibition / Event', 'Direct Walk-in', 'Other'] },
              { key: 'expectedProjectValue', label: 'Expected Project Value (₹)', type: 'number' },
              { key: 'leadDescription', label: 'Discussion / Requirement Summary', type: 'textarea' },
              { key: 'confirmed', label: 'Negotiation Confirmed?', type: 'select', options: ['YES', 'NO', 'PENDING'], required: true },
              { key: 'confirmationDate', label: 'Confirmation Date', type: 'date' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        }
      ]
    },
    {
      key: 'PO_AND_PI',
      name: '02 — PO & PI',
      order: 2,
      substages: [
        {
          key: 'PO_UPLOAD',
          name: 'PO Upload',
          order: 1,
          metadata: { noAssignment: true },
          formSchema: {
            fields: [
              { key: 'projectName', label: 'Project Name / Title', type: 'text', placeholder: 'Enter Project Name' },
              { key: 'poDocumentUrl', label: 'PO Document (PDF)', type: 'file', required: true, hint: 'Upload official Purchase Order document (PDF / Images)' },
              { key: 'poNumber', label: 'PO Number', type: 'text' },
              { key: 'poDate', label: 'PO Date', type: 'date' },
              { key: 'poAmount', label: 'PO Amount (₹)', type: 'number' },
              { key: 'issuingOrganization', label: 'Issuing Organization', type: 'text' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'PI_REQUEST',
          name: 'PI Request',
          order: 2,
          metadata: { noAssignment: true },
          formSchema: {
            fields: [
              { key: 'requestedDate', label: 'PI Request Date', type: 'date' },
              { key: 'expectedPIDate', label: 'Expected PI Date', type: 'date' },
              { key: 'requestRemarks', label: 'Request Details / Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'PI_UPLOAD',
          name: 'PI Upload',
          order: 3,
          metadata: { noAssignment: true },
          formSchema: {
            fields: [
              { key: 'piDocumentUrl', label: 'PI Document (PDF)', type: 'file', required: true, hint: 'Upload Proforma Invoice document (PDF / Images)' },
              { key: 'piNumber', label: 'PI Number', type: 'text' },
              { key: 'piDate', label: 'PI Date', type: 'date' },
              { key: 'amount', label: 'Base Amount (₹)', type: 'number' },
              { key: 'tax', label: 'Tax / GST (%)', type: 'number' },
              { key: 'totalAmount', label: 'Total Amount (₹)', type: 'number' },
              { key: 'paymentTerms', label: 'Payment Terms', type: 'textarea' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        }
      ]
    },
    {
      key: 'ORDER_REQUIREMENT',
      name: '03 — ORDER REQUIREMENT',
      order: 3,
      metadata: { noAssignment: true },
      substages: [
        {
          key: 'SCHOOL_ONBOARDING_INFORMATION',
          name: 'School Information',
          order: 1,
          metadata: { noAssignment: true },
          formSchema: {
            fields: [
              { key: 'schoolName', label: 'School / Institution / Trust Name', type: 'text', required: true },
              { key: 'schoolCode', label: 'School Code / UDISE', type: 'text' },
              { key: 'address', label: 'School Address & City', type: 'textarea' },
              { key: 'deploymentLocations', label: 'Implementation Site(s) / Lab Rooms / Branches', type: 'textarea', placeholder: 'e.g. Branch 1: STEM Lab Room 101, Branch 2: Robotics Room' },
              { key: 'principalName', label: 'Principal / Head Name', type: 'text' },
              { key: 'contactPerson', label: 'Coordinator / Contact Person Name', type: 'text' },
              { key: 'phone', label: 'Contact Phone Number', type: 'text' },
              { key: 'email', label: 'Contact Email Address', type: 'text' },
              { key: 'totalStudents', label: 'Total Student Strength', type: 'number' },
              { key: 'labAvailable', label: 'Dedicated Lab Room Available?', type: 'select', options: ['Yes', 'No'] },
              { key: 'internetAvailable', label: 'Internet / Wi-Fi Available?', type: 'select', options: ['Yes', 'No'] },
              { key: 'remarks', label: 'Site / Infrastructure Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'SOLUTION_SELECTION',
          name: 'Solutions',
          order: 2,
          formSchema: {
            fields: [
              { 
                key: 'solutions', 
                label: 'Solutions & Quantity Breakdown', 
                type: 'solutionsConfig',
                hint: 'Check each solution required and enter its quantity, target classes, and implementation room'
              },
              { key: 'assignedTechLead', label: 'Assigned Tech In-charge / Specialist', type: 'employeeSelect', hint: 'Assign employee responsible for Tech Stream tasks in Stage 04' },
              { key: 'assignedContentLead', label: 'Assigned Content In-charge / Specialist', type: 'employeeSelect', hint: 'Assign employee responsible for Content Stream tasks in Stage 04' },
              { key: 'overallNotes', label: 'Overall Scope & Implementation Notes', type: 'textarea' },
              { key: 'remarks', label: 'Remarks / Special Customization', type: 'textarea' }
            ]
          }
        },
        {
          key: 'HARDWARE_REQUIREMENT',
          name: 'Hardware',
          order: 3,
          metadata: { noAssignment: true },
          formSchema: {
            fields: [
              { 
                key: 'hardwareRequirements', 
                label: 'Hardware Products & Specifications', 
                type: 'hardwareRequirementsInput', 
                hint: 'Select required hardware products, set required quantity and specification / model / brand' 
              },
              { key: 'assignedHardwareManager', label: 'Assigned Hardware In-charge', type: 'employeeSelect', hint: 'Assign employee responsible for hardware stock check in execution' },
              { key: 'remarks', label: 'Remarks / Notes', type: 'textarea' }
            ]
          }
        }
      ]
    },
    {
      key: 'EXECUTION',
      name: '04 — EXECUTION',
      order: 4,
      substages: [
        {
          key: 'HARDWARE_STREAM',
          name: 'HARDWARE',
          order: 1,
          isBranch: true,
          nested: [
            {
              key: 'REQ_AND_STOCK_CHECK',
              name: 'Requirement & Stock Check',
              order: 1,
              supportsConditional: true,
              formSchema: {
                fields: [
                  { 
                    key: 'stockCheck', 
                    label: 'Hardware Stock Verification', 
                    type: 'hardwareStockCheck', 
                    hint: 'Enter available in-stock quantity. Remaining quantity automatically moves to purchase.' 
                  },
                  { key: 'purchaseAssignedTo', label: 'Assigned Purchase / Procurement In-charge', type: 'employeeSelect', hint: 'Select employee responsible for procurement if purchase is needed' },
                  { key: 'remarks', label: 'Stock Verification Remarks', type: 'textarea' }
                ]
              }
            },
            {
              key: 'PURCHASE_IF_NEEDED',
              name: 'Purchase',
              order: 2,
              conditionalOnly: 'NOT_IN_STOCK',
              formSchema: {
                fields: [
                  { 
                    key: 'productProcurements', 
                    label: 'Per-Product Vendor PO & PI Procurement', 
                    type: 'hardwarePurchaseSection', 
                    hint: 'Upload Vendor PO and PI documents individually for each product being purchased' 
                  },
                  { key: 'overallProcurementRemarks', label: 'Overall Procurement Remarks', type: 'textarea' }
                ]
              }
            },
            {
              key: 'CONSIGNMENT_TRACKING',
              name: 'Consignment / Tracking',
              order: 3,
              conditionalOnly: 'NOT_IN_STOCK',
              formSchema: {
                fields: [
                  { 
                    key: 'productConsignments', 
                    label: 'Per-Product Consignment & Address Tracking', 
                    type: 'hardwareConsignmentSection', 
                    hint: 'Track individual consignment docket IDs, courier partners, and delivery addresses per hardware product' 
                  },
                  { key: 'overallLogisticsRemarks', label: 'Overall Logistics Remarks', type: 'textarea' }
                ]
              }
            },
            /*
            {
              key: 'ADDRESS_CONFIRMATION',
              name: 'Address Confirmation',
              order: 4,
              formSchema: {
                fields: [
                  { key: 'deliveryAddress', label: 'Confirmed Delivery Address', type: 'textarea' },
                  { key: 'contactPerson', label: 'Site Receiving Person', type: 'text' },
                  { key: 'phone', label: 'Receiving Person Phone', type: 'text' },
                  { key: 'addressConfirmed', label: 'Address Confirmed?', type: 'select', options: ['YES', 'NO'] },
                  { key: 'remarks', label: 'Remarks', type: 'textarea' }
                ]
              }
            },
            {
              key: 'DELIVERY_AND_TRACKING',
              name: 'Delivery & Tracking',
              order: 4,
              formSchema: {
                fields: [
                  { key: 'dispatchDate', label: 'Actual Dispatch Date', type: 'date' },
                  { key: 'deliveryDate', label: 'Actual Delivery Date', type: 'date' },
                  { key: 'deliveryStatus', label: 'Delivery Status', type: 'select', options: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'PARTIALLY_DELIVERED'] },
                  { key: 'proofOfDeliveryUrl', label: 'Proof of Delivery (POD)', type: 'file' },
                  { key: 'remarks', label: 'Remarks', type: 'textarea' }
                ]
              }
            },
            */
            {
              key: 'HARDWARE_READY',
              name: 'Hardware Ready',
              order: 5,
              formSchema: {
                fields: [
                  { key: 'allHardwareReceived', label: 'All Hardware Received & Verified?', type: 'select', options: ['YES', 'NO'], required: true },
                  { key: 'damagedItems', label: 'Damaged / Missing Items (if any)', type: 'textarea' },
                  { key: 'readyForInstallation', label: 'Ready for Installation?', type: 'select', options: ['YES', 'NO'] },
                  { key: 'remarks', label: 'Remarks', type: 'textarea' }
                ]
              }
            }
          ]
        },
        {
          key: 'TECH_STREAM',
          name: 'TECH',
          order: 2,
          isBranch: true,
          nested: [
            {
              key: 'PROJECT_CONFIG_AND_IMPLEMENTATION',
              name: 'Project Configuration & Implementation',
              order: 1,
              formSchema: {
                fields: [
                  { key: 'projectCreation', label: 'Project Creation', type: 'select', options: ['YES', 'NO'], defaultValue: 'YES', required: true },
                  { key: 'schoolCreation', label: 'School Creation', type: 'select', options: ['YES', 'NO'], defaultValue: 'YES', required: true },
                  { key: 'licenseCreation', label: 'License Creation', type: 'select', options: ['YES', 'NO'], defaultValue: 'YES', required: true },
                  { key: 'apkFileUrl', label: 'Upload Application / APK File', type: 'file', hint: 'Upload the application build or APK file for testers and school installation' },
                  { key: 'remarks', label: 'Configuration Remarks', type: 'textarea' }
                ]
              }
            },
            {
              key: 'TECH_TESTING',
              name: 'Testing Done',
              order: 2,
              formSchema: {
                fields: [
                  { key: 'testingDone', label: 'Testing Done?', type: 'select', options: ['YES', 'NO'], defaultValue: 'YES', required: true },
                  { key: 'testReportUrl', label: 'Test Report / Evidence', type: 'file' },
                  { key: 'remarks', label: 'Testing Notes / Remarks', type: 'textarea' }
                ]
              }
            }
          ]
        },
        {
          key: 'CONTENT_STREAM',
          name: 'CONTENT',
          order: 3,
          isBranch: true,
          nested: [
            {
              key: 'CONTENT_CONFIGURATION',
              name: 'Content Configuration',
              order: 1,
              formSchema: {
                fields: [
                  { 
                    key: 'contentSets', 
                    label: 'Board, Language, Class & Category Sets', 
                    type: 'contentConfigSection'
                  },
                  { key: 'remarks', label: 'Configuration Remarks', type: 'textarea' }
                ]
              }
            },
            {
              key: 'CONTENT_REVIEW_QA',
              name: 'Content Review & QA',
              order: 2,
              formSchema: {
                fields: [
                  { key: 'reviewDone', label: 'Content Review & QA Done?', type: 'select', options: ['YES', 'NO'], defaultValue: 'YES', required: true },
                  { key: 'remarks', label: 'Review Remarks', type: 'textarea' }
                ]
              }
            },
            {
              key: 'SHEET_READINESS',
              name: 'Sheet Readiness',
              order: 3,
              formSchema: {
                fields: [
                  { key: 'sheetReady', label: 'Sheet Readiness Completed?', type: 'select', options: ['YES', 'NO'], defaultValue: 'YES', required: true },
                  { key: 'remarks', label: 'Sheet Readiness Remarks', type: 'textarea' }
                ]
              }
            },
            {
              key: 'DUMP_READINESS',
              name: 'Dump Readiness',
              order: 4,
              formSchema: {
                fields: [
                  { key: 'dumpReady', label: 'Dump Readiness Completed?', type: 'select', options: ['YES', 'NO'], defaultValue: 'YES', required: true },
                  { key: 'remarks', label: 'Dump Readiness Remarks', type: 'textarea' }
                ]
              }
            },
            {
              key: 'CONTENT_READY',
              name: 'Content Ready',
              order: 5,
              formSchema: {
                fields: [
                  { key: 'contentReady', label: 'Content Ready & Verified?', type: 'select', options: ['YES', 'NO'], defaultValue: 'YES', required: true },
                  { key: 'remarks', label: 'Final Content Remarks', type: 'textarea' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      key: 'TECH_AND_CONTENT_TESTING',
      name: '05 — TECH + CONTENT TESTING',
      order: 5,
      dependencies: ['TECH_READY', 'CONTENT_READY'],
      substages: [
        {
          key: 'TESTING_PREPARATION',
          name: 'Testing Preparation',
          order: 1,
          formSchema: {
            fields: [
              { 
                key: 'appDownload', 
                label: 'Application / APK File (Download for Testing)', 
                type: 'appFileDownloadSection', 
                hint: 'Download the application build / APK uploaded by the Tech team' 
              },
              { key: 'testEnvironment', label: 'Test Environment / Device Type', type: 'select', options: ['Android Tablet', 'Interactive Flat Panel / Smartboard', 'Android Mobile', 'Windows PC / Desktop', 'Web Browser / Emulator', 'Multiple Devices'], defaultValue: 'Android Tablet' },
              { key: 'plannedTestingDate', label: 'Planned Testing Date', type: 'date' },
              { key: 'testScope', label: 'Testing Scope & Focus Areas', type: 'textarea', placeholder: 'e.g. Core curriculum modules, question bank functionality, offline licensing' },
              { key: 'remarks', label: 'Preparation Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'INTEGRATION_TESTING',
          name: 'Integration Testing',
          order: 2,
          formSchema: {
            fields: [
              {
                key: 'testingResults',
                label: 'App, Dashboard & Content Testing Results',
                type: 'integrationTestingSection',
                hint: 'Record QA testing results, assignees for improvements, test sheet links and feedback remarks'
              },
              { key: 'overallTestResult', label: 'Overall QA Status', type: 'select', options: ['ALL_PASSED', 'NEEDS_IMPROVEMENT', 'PENDING'], defaultValue: 'PENDING', required: true },
              { key: 'remarks', label: 'General Testing Remarks', type: 'textarea' }
            ]
          }
        }
      ]
    },
    {
      key: 'INSTALLATION',
      name: '06 — INSTALLATION',
      order: 6,
      substages: [
        {
          key: 'INSTALLATION_PLANNING',
          name: 'Installation Planning',
          order: 1,
          formSchema: {
            fields: [
              { key: 'installationDate', label: 'Planned Installation Date', type: 'date' },
              { key: 'teamMembers', label: 'Field Engineers / Team Members', type: 'textarea' },
              { key: 'siteContact', label: 'Site Contact Person', type: 'text' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'INSTALLATION_EXECUTION',
          name: 'Installation Execution',
          order: 2,
          formSchema: {
            fields: [
              { key: 'installationStarted', label: 'Installation Started?', type: 'select', options: ['Yes', 'No'] },
              { key: 'installedItems', label: 'Installed Items Summary', type: 'textarea' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'INSTALLATION_TESTING',
          name: 'Installation Testing',
          order: 3,
          formSchema: {
            fields: [
              { key: 'testResult', label: 'Site Test Result', type: 'select', options: ['PASS', 'FAIL', 'PARTIAL'], required: true },
              { key: 'issues', label: 'Issues Encountered', type: 'textarea' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'INSTALLATION_COMPLETED',
          name: 'Installation Completed',
          order: 4,
          formSchema: {
            fields: [
              { key: 'completed', label: 'Installation Completed?', type: 'select', options: ['YES', 'NO'], required: true },
              { key: 'installationReportUrl', label: 'Installation Report (PDF/Photo)', type: 'file', hint: 'Upload signed installation report' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        }
      ]
    },
    {
      key: 'TRAINING',
      name: '07 — TRAINING',
      order: 7,
      substages: [
        {
          key: 'TRAINING_PLANNING',
          name: 'Training Planning',
          order: 1,
          formSchema: {
            fields: [
              { key: 'trainingType', label: 'Training Type', type: 'select', options: ['Teacher Training', 'Admin Training', 'Student Demo', 'Full Training', 'Other'] },
              { key: 'participantsCount', label: 'Expected Participants', type: 'number' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'TRAINING_SCHEDULE',
          name: 'Training Schedule',
          order: 2,
          formSchema: {
            fields: [
              { key: 'trainingDate', label: 'Training Date', type: 'date' },
              { key: 'mode', label: 'Training Mode', type: 'select', options: ['ONLINE', 'OFFLINE', 'HYBRID'] },
              { key: 'trainerName', label: 'Trainer Name', type: 'text' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'TRAINING_EXECUTION',
          name: 'Training Execution',
          order: 3,
          formSchema: {
            fields: [
              { key: 'attendance', label: 'Actual Attendance Count', type: 'number' },
              { key: 'topicsCovered', label: 'Topics Covered', type: 'textarea' },
              { key: 'trainingPhotosUrl', label: 'Training Photos / Report', type: 'file', hint: 'Upload training report / photos' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'TRAINING_COMPLETED',
          name: 'Training Completed',
          order: 4,
          formSchema: {
            fields: [
              { key: 'completed', label: 'Training Completed & Signed off?', type: 'select', options: ['YES', 'NO'], required: true },
              { key: 'feedbackSummary', label: 'Feedback Summary', type: 'textarea' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        }
      ]
    },
    {
      key: 'PROJECT_CLOSURE',
      name: '08 — PROJECT CLOSURE',
      order: 8,
      substages: [
        {
          key: 'FINAL_PROJECT_REVIEW',
          name: 'Final Project Review',
          order: 1,
          formSchema: {
            fields: [
              { key: 'reviewed', label: 'Final Review Completed?', type: 'select', options: ['Yes', 'No'] },
              { key: 'pendingItems', label: 'Pending Items (if any)', type: 'textarea' },
              { key: 'clientFeedback', label: 'Client Feedback', type: 'textarea' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'DOCUMENTATION_COMPLETION',
          name: 'Documentation Completion',
          order: 2,
          formSchema: {
            fields: [
              { key: 'handoverDocumentUrl', label: 'Signed Handover Document (PDF)', type: 'file', hint: 'Upload signed final signoff / handover document' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'PAYMENT_TRACKING',
          name: 'Payment Tracking',
          order: 3,
          formSchema: {
            fields: [
              { key: 'totalProjectAmount', label: 'Total Project Amount (₹)', type: 'number' },
              { key: 'totalPaidAmount', label: 'Total Paid Amount (₹)', type: 'number' },
              { key: 'totalPendingAmount', label: 'Total Pending Amount (₹)', type: 'number' },
              { key: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'] },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        },
        {
          key: 'PROJECT_CLOSED',
          name: 'Project Closed',
          order: 4,
          formSchema: {
            fields: [
              { key: 'approved', label: 'Project Closed & Signed Off?', type: 'select', options: ['YES', 'NO'], required: true },
              { key: 'closureDate', label: 'Closure Date', type: 'date' },
              { key: 'closureRemarks', label: 'Closure Remarks', type: 'textarea' }
            ]
          }
        }
      ]
    }
  ]
};
