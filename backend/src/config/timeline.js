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
              { key: 'projectName', label: 'Project Name / Title', type: 'text', required: true },
              { key: 'email', label: 'Email Address', type: 'text' },
              { key: 'country', label: 'Country', type: 'text' },
              { key: 'phone', label: 'Phone Number', type: 'text' },
              { key: 'address', label: 'Address / Location', type: 'text' },
              { key: 'projectReviewed', label: 'Project Reviewed?', type: 'select', options: ['YES', 'NO', 'PENDING'], required: true },
              { key: 'projectCreated', label: 'Project Created?', type: 'select', options: ['YES', 'NO', 'PENDING'], required: true },
              { key: 'confirmed', label: 'Negotiation Confirmed?', type: 'select', options: ['YES', 'NO', 'PENDING'] },
              { key: 'confirmationDate', label: 'Confirmation Date', type: 'date' },
              { key: 'remarks', label: 'Remarks', type: 'textarea' }
            ]
          }
        }
      ]
    },
    {
      key: 'PO_AND_PI',
      name: '02 — PO, PI & TAX INVOICE',
      order: 2,
      substages: [
        {
          key: 'PO_UPLOAD',
          name: 'PO Upload',
          order: 1,
          metadata: { noAssignment: true },
          formSchema: {
            fields: [
              { key: 'multiPoSection', label: 'Purchase Orders (Multiple)', type: 'multiPoSection' },
              { key: 'poDocumentUrl', label: 'Primary PO Document (PDF)', type: 'file', required: false, hint: 'Upload official Purchase Order document (PDF / Images)' },
              { key: 'poNumber', label: 'PO Number', type: 'text' },
              { key: 'poDate', label: 'PO Date', type: 'date' },
              { key: 'uploadDate', label: 'PO Upload Date', type: 'date' },
              { key: 'issuingOrganization', label: 'Issuing Organization', type: 'text' },
              { key: 'remarks', label: 'PO Remarks', type: 'textarea' }
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
          name: 'PI & Tax Invoice Upload',
          order: 3,
          metadata: { noAssignment: true },
          formSchema: {
            fields: [
              { key: 'multiPiInvoiceSection', label: 'Proforma & Tax Invoices (Multiple)', type: 'multiPiInvoiceSection' },
              { key: 'piDocumentUrl', label: 'Primary PI Document (PDF)', type: 'file', required: false, hint: 'Upload Proforma Invoice document (PDF / Images)' },
              { key: 'piNumber', label: 'PI Number', type: 'text' },
              { key: 'piDate', label: 'PI Date', type: 'date' },
              { key: 'piUploadDate', label: 'PI Upload Date', type: 'date' },
              { key: 'invoiceDocumentUrl', label: 'Primary Tax Invoice Document (PDF)', type: 'file', required: false, hint: 'Upload Tax Invoice document (PDF / Images)' },
              { key: 'invoiceNumber', label: 'Tax Invoice Number', type: 'text' },
              { key: 'invoiceDate', label: 'Tax Invoice Date', type: 'date' },
              { key: 'invoiceUploadDate', label: 'Tax Invoice Upload Date', type: 'date' },
              { key: 'ewayBillNumber', label: 'E-Way Bill Number', type: 'text' },
              { key: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['PAID', 'PARTIALLY_PAID', 'PENDING'] },
              { key: 'paymentTerms', label: 'Payment Terms', type: 'textarea' },
              { key: 'remarks', label: 'Invoice Remarks', type: 'textarea' }
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
              // 1. School Information
              { key: 'schoolName', label: '1.1 Name of the School', type: 'text', required: true },
              { key: 'addressContact', label: '1.2 Contact Details (Address with PIN code and Mobile number)', type: 'textarea' },
              { key: 'schoolCategory', label: '1.3 School Category', type: 'select', options: ['Primary only with grade 1 to 5', 'Upper Primary with grade 1 to 8', 'Higher secondary with grade 1 to 12', 'Middle School only with grade 6 to 8', 'Higher secondary with grade 6 to 12'] },
              { key: 'principalName', label: '1.4 Name of the Principal/Head contact', type: 'text' },
              { key: 'principalDetails', label: '1.5 Principal Details (Phone / Email)', type: 'text' },
              { key: 'pocName', label: '1.6 Name of the contact person (POC)', type: 'text' },
              { key: 'pocDesignation', label: '1.7 Designation', type: 'text' },
              { key: 'pocContact', label: '1.8 Contact Details (POC Phone / Email)', type: 'text' },
              // 2. Demographics
              { key: 'totalTeachers', label: '2.1 Number of teachers', type: 'number' },
              { key: 'subjectWiseTeachers', label: '2.2 Subject-wise bifurcation of teacher', type: 'text' },
              { key: 'classWiseSubjects', label: '2.3 Class-wise details of subjects', type: 'textarea' },
              { key: 'triSystemType', label: '2.4 Tri system or multi trisystem for different subjects', type: 'text' },
              { key: 'totalStudents', label: '2.5 Total Number of students', type: 'number' },
              { key: 'regularStudentsRatio', label: '2.5.1 Number/percentage of student coming regularly', type: 'text' },
              { key: 'studentCommittee', label: '2.6 Is there a student committee in school?', type: 'text' },
              { key: 'villagesCount', label: '2.7 From how many villages students are coming', type: 'text' },
              { key: 'parentsOccupation', label: '2.8 Basic occupation of the parents', type: 'text' },
              { key: 'studentAttendance', label: '2.9 Student Attendance', type: 'text' },
              { key: 'overallResult', label: '3.0 Overall School Result', type: 'text' },
              // 3. Infrastructure
              { key: 'totalClassrooms', label: '3.1 Total number of classroom in the school', type: 'number' },
              { key: 'classroomCondition', label: '3.2 Condition of classroom', type: 'select', options: ['Pucca (पक्का)', 'Semi-Pucca (आंशिक रूप से पक्का)', 'Kutcha (कच्चा)', 'Tent (तंबू)'] },
              { key: 'additionalRooms', label: '3.3 Additional rooms (Music/Computer lab/Sports/Library)', type: 'text' },
              { key: 'spareRooms', label: '3.4 Any spare rooms for classes', type: 'text' },
              { key: 'electricityInternetAvailability', label: '3.5 Availability of electricity / Internet', type: 'text' },
              { key: 'drinkingWaterAvailability', label: '3.6 Availability of drinking water facilities', type: 'text' },
              { key: 'washroomAvailability', label: '3.7 Availability of washroom facilities', type: 'text' },
              // 4. Digital Initiatives
              { key: 'ictLabAvailable', label: '4.1 Is the ICT Lab available in the school?', type: 'select', options: ['Yes', 'No'] },
              { key: 'ictSetupDate', label: '4.2 When was it set up?', type: 'text' },
              { key: 'ictHardwareComponents', label: '4.3 Hardware components of this ICT Lab', type: 'textarea' },
              { key: 'digitalContentProvided', label: '4.4 Digital content provided?', type: 'text' },
              { key: 'digitalContentClasses', label: '4.5 Classes and subjects covered', type: 'text' },
              { key: 'ictLabFunctional', label: '4.6 Is the ICT Lab functional?', type: 'select', options: ['Yes', 'No'] },
              { key: 'ictWeeklyUsage', label: '4.7 Weekly usage frequency', type: 'text' },
              { key: 'ictStudentCount', label: '4.8 Students accessing ICT Lab', type: 'text' },
              { key: 'computerTeacherAvailable', label: '4.9 Computer teacher available in school?', type: 'text' },
              { key: 'internetFacilityType', label: '4.10 Internet Facility Type', type: 'text' },
              { key: 'libraryCornerAvailable', label: '4.11 Library/Reading Corner available?', type: 'select', options: ['Yes', 'No'] },
              { key: 'govtBooksCount', label: '4.12 Total books from NCERT, NBT, or Govt publisher', type: 'text' },
              { key: 'fullTimeLibrarian', label: '4.13 Full-time librarian available?', type: 'select', options: ['Yes', 'No'] },
              { key: 'newspaperSubscription', label: '4.14 Newspaper/magazines subscription', type: 'text' },
              // 5. Additional Notes & Stakeholders
              { key: 'additionalNotes', label: '5.1 Additional notes / Points of observation', type: 'textarea' },
              { key: 'otherStakeholders', label: '5.2 Other stakeholders details (SMC, DEO, BEEO, etc.)', type: 'textarea' },
              { key: 'supportingOrgName', label: '5.3.1 Supporting Organization / NGO Name', type: 'text' },
              { key: 'supportingOrgContactPerson', label: '5.3.2 Contact Person Name', type: 'text' },
              { key: 'supportingOrgDesignation', label: '5.3.3 Designation', type: 'text' },
              { key: 'supportingOrgContact', label: '5.3.4 Contact Number', type: 'text' },
              { key: 'supportingOrgEmail', label: '5.3.5 Email Address', type: 'text' },
              { key: 'smartClassRoomIdentification', label: '5.4 Room identification for smart classroom setup', type: 'text' },
              { key: 'smartClassRoomCondition', label: '5.5 Seating / Furniture / Ventilation / Security', type: 'text' },
              { key: 'photoFrontView', label: '5.6 School Front View Photo URL', type: 'text' },
              { key: 'photoSmartRoom', label: '5.6 Smart Classroom Room Photo URL', type: 'text' },
              // 6. Socio-Economic Background
              { key: 'parentIncomeGroup', label: '6.1 Income group of most of the parents', type: 'select', options: ['Below Poverty Line (BPL)', 'Lower Income Group (LIG)', 'Middle Income Group (MIG)', 'High Income Group (HIG)'] },
              { key: 'parentProfessions', label: '6.2 Profession of the Parents', type: 'multiselect' },
              { key: 'parentEducationLevel', label: '6.3 Educational Level of Parents', type: 'select', options: ['No Formal Education', 'Primary Education (Up to Class 5)', 'Secondary Education (Class 6–10)', 'Higher Secondary Education (Class 11–12)', 'Graduate', 'Postgraduate or Above'] },
              { key: 'firstGenerationLearner', label: '6.4 Are Children first-generation learners', type: 'select', options: ['Yes, the child is the first in the family to receive formal education', 'No, other family members have received formal education'] },
              // 7. Security and Handling
              { key: 'securityGuard', label: '7.1 Security guard or personnel on school premises', type: 'text' },
              { key: 'ictSecurityMeasures', label: '7.2 Security measures in place for ICT Lab (CCTV, locks, access control)', type: 'text' },
              { key: 'deviceStorage', label: '7.3 Storage of digital devices when not in use', type: 'textarea' },
              { key: 'lostDeviceProtocol', label: '7.4 Protocol for reporting lost or damaged devices', type: 'text' },
              { key: 'dataBackupPlan', label: '7.5 Backup and data recovery plan', type: 'text' },
              { key: 'responsibleUseTraining', label: '7.6 Guidelines / training on responsible & secure use', type: 'text' },
              { key: 'usageTrackingMechanism', label: '7.7 Usage tracking mechanism of digital content', type: 'text' },
              { key: 'cybersecurityPolicies', label: '7.8 Cybersecurity and data protection policies', type: 'text' },
              { key: 'breachHistory', label: '7.9 Previous instances of security breaches & handling', type: 'text' },
              { key: 'digitoppersSecurityCooperation', label: '7.10 Willingness to cooperate with Digitoppers security guidelines', type: 'text' },
              { key: 'safetyHazardsMitigation', label: '7.11 Potential safety hazards and mitigation', type: 'textarea' }
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
                type: 'solutionsConfig'
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
              {
                key: 'installationSection',
                label: 'Hardware Serial Numbers & 3 Installation Images',
                type: 'installationSection'
              }
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
              {
                key: 'installationSection',
                label: 'School-wise Installation, Hardware Serial Numbers & 3 Site Images',
                type: 'installationSection'
              },
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
