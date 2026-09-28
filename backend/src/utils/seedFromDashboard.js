const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Employee = require('../modules/employees/employee.model');
const ProjectService = require('../modules/projects/project.service');
const ProjectMember = require('../modules/projects/project-member.model');
const Timeline = require('../modules/timeline/timeline.model');
const TimelineNode = require('../modules/timeline/timeline-node.model');
const TimelineService = require('../modules/timeline/timeline.service');
const ProjectRequest = require('../modules/requests/project-request.model');
const Requirement = require('../modules/requirements/requirements.model');
const Activity = require('../modules/activity/activity.model');
const Notification = require('../modules/notifications/notifications.model');
const { GLOBAL_ROLES, DESIGNATIONS, PROJECT_STATUSES } = require('../core/constants');

const UNIFIED_PASSWORD = 'Digitoppers@123';

const PLATFORM_TO_HARDWARE_MAP = {
  ifp: {
    key: 'IFP_PANEL',
    label: 'Interactive Flat Panel (65"/75")',
    spec: '75-inch 4K UHD Touch Display with Android 13 + OPS Windows'
  },
  tablet: {
    key: 'STUDENT_TABLETS',
    label: 'Student Learning Tablets (10")',
    spec: '10-inch Octa-Core Android 13 Ruggedized Tablets with Kiosk Mode'
  },
  windows: {
    key: 'SERVER_MINI_PC',
    label: 'Mini PC / Central Lab Server',
    spec: 'Intel Core i5, 16GB RAM, 512GB SSD Windows 11 Pro'
  },
  linux: {
    key: 'NETWORKING_ROUTER',
    label: 'Gigabit Switch & Wi-Fi 6 Router',
    spec: 'Ubuntu Core Server & Managed Gigabit Local Distribution Network'
  }
};

const EMPLOYEES_DATA = [
  {
    name: 'Pawan Kumar',
    designation: 'CEO',
    reportingManager: 'N/A',
    phone: '8506092552',
    email: 'growth@digitoppers.com',
    globalRole: GLOBAL_ROLES.ADMIN,
    employeeCode: 'EMP001',
    canRequestNewProject: true
  },
  {
    name: 'Manoj Kumar',
    designation: 'COO',
    reportingManager: 'Pawan Kumar',
    phone: '9716771574',
    email: 'manojk@digitoppers.com',
    globalRole: GLOBAL_ROLES.ADMIN,
    employeeCode: 'EMP002',
    canRequestNewProject: true
  },
  {
    name: 'Sandeep Mudgal',
    designation: 'CTO',
    reportingManager: 'Pawan Kumar',
    phone: '8929094972',
    email: 'tech@digitoppers.com',
    globalRole: GLOBAL_ROLES.ADMIN,
    employeeCode: 'EMP003',
    canRequestNewProject: true
  },
  {
    name: 'Manoj Kumar Acc',
    designation: 'Accounts Executive',
    reportingManager: 'Pawan Kumar',
    phone: '978651740',
    email: 'finance@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP004',
    canRequestNewProject: false
  },
  {
    name: 'Soumay Garg',
    designation: 'Associate Project Manager',
    reportingManager: 'Pawan Kumar',
    phone: '8130154069',
    email: 'soumay@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP005',
    canRequestNewProject: true
  },
  {
    name: 'Kashish',
    designation: 'Social Media Executive',
    reportingManager: 'Sandeep Mudgal',
    phone: '8860350434',
    email: 'marketing@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP006',
    canRequestNewProject: false
  },
  {
    name: 'Bhavna Yadav',
    designation: 'Business Development Manager',
    reportingManager: 'Pawan Kumar',
    phone: '7082976273',
    email: 'bhavna@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP007',
    canRequestNewProject: true
  },
  {
    name: 'Pratham Yadav',
    designation: 'Content Intern',
    reportingManager: 'Manoj Kumar',
    phone: '9217724294',
    email: 'prathamy@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP008',
    canRequestNewProject: false
  },
  {
    name: 'Parveen Malik',
    designation: 'Operations Executive',
    reportingManager: 'Manoj Kumar',
    phone: '8930255095',
    email: 'parveen@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP009',
    canRequestNewProject: false
  },
  {
    name: 'Ajay Punia',
    designation: 'Operations Intern',
    reportingManager: 'Soumay Garg',
    phone: '8708761351',
    email: 'ajayp@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP010',
    canRequestNewProject: false
  },
  {
    name: 'Dharam Prakash',
    designation: 'Content Head',
    reportingManager: 'Pawan Kumar',
    phone: '9868161129',
    email: 'dharamparkash@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP011',
    canRequestNewProject: false
  },
  {
    name: 'Dheeraj Mokhria',
    designation: 'Marketing Intern',
    reportingManager: 'Manoj Kumar',
    phone: '9871644705',
    email: 'dheeraj@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP012',
    canRequestNewProject: false
  },
  {
    name: 'Shruti',
    designation: 'Technical Intern',
    reportingManager: 'Sandeep Mudgal',
    phone: '8318925380',
    email: 'shruti@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP013',
    canRequestNewProject: false
  },
  {
    name: 'Rishab Sharma',
    designation: 'Accounts Intern',
    reportingManager: 'Manoj Kumar',
    phone: '7065100881',
    email: 'rishab@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP014',
    canRequestNewProject: false
  },
  {
    name: 'Sachin Kumar',
    designation: 'Flutter Developer',
    reportingManager: 'Sandeep Mudgal',
    phone: '9521605805',
    email: 'sachin@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP015',
    canRequestNewProject: false
  },
  {
    name: 'Nidhi Kharb',
    designation: 'Data Analyst Intern',
    reportingManager: 'Pawan Kumar',
    phone: '9729691294',
    email: 'nidhi@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP016',
    canRequestNewProject: false
  },
  {
    name: 'Anjali Thakraan',
    designation: 'Business Development Intern',
    reportingManager: 'Soumay Garg',
    phone: '',
    email: 'anjali@digitoppers.com',
    globalRole: GLOBAL_ROLES.EMPLOYEE,
    employeeCode: 'EMP017',
    canRequestNewProject: false
  }
];

const DASHBOARD_SOURCE_DATA = [
  {
    dashboardProjectId: 'PRJ-DEL-001',
    projectName: 'Delhi Government Schools — Smart Shaala & Robotics Rollout',
    organizationName: 'Directorate of Education, Govt. of NCT Delhi',
    email: 'doe.projects@delhi.gov.in',
    phone: '+91 11 2389 0041',
    address: 'Old Secretariat, Civil Lines, New Delhi, Delhi 110054',
    status: PROJECT_STATUSES.ACTIVE,
    expectedProjectValue: 4500000,
    solutions: ['SMART_SHAALA', 'ROBOTICS', 'STEM_LAB'],
    schools: [
      {
        schoolId: 'SCH-DEL-0101',
        name: 'Sarvodaya Kanya Vidyalaya No. 1',
        address: 'Sector 7, Rohini, New Delhi 110085',
        contactPerson: 'Mrs. Sunita Mehra',
        contactDesignation: 'Vice Principal & Lab Incharge',
        phone: '+91 98112 34567',
        email: 'skv.rohini@delhischools.edu.in',
        studentCount: 1450,
        platforms: [
          { platform: 'ifp', licenseCount: 20, licenseDays: 365 },
          { platform: 'tablet', licenseCount: 40, licenseDays: 365 }
        ]
      },
      {
        schoolId: 'SCH-DEL-0102',
        name: 'Rajkiya Pratibha Vikas Vidyalaya (RPVV)',
        address: 'Surajmal Vihar, East Delhi, Delhi 110092',
        contactPerson: 'Dr. Ramesh Chandra',
        contactDesignation: 'Head of Department (Computer Science)',
        phone: '+91 98711 87654',
        email: 'rpvv.surajmal@delhischools.edu.in',
        studentCount: 920,
        platforms: [
          { platform: 'ifp', licenseCount: 15, licenseDays: 365 },
          { platform: 'windows', licenseCount: 25, licenseDays: 365 }
        ]
      }
    ]
  },
  {
    dashboardProjectId: 'PRJ-MAH-002',
    projectName: 'Maharashtra Zilla Parishad — STEM & Innovation Lab Network',
    organizationName: 'Maharashtra School Education and Sports Department',
    email: 'stem.support@maharashtra.gov.in',
    phone: '+91 20 2612 8900',
    address: 'Central Building, Dr. Babasaheb Ambedkar Road, Pune, Maharashtra 411001',
    status: PROJECT_STATUSES.ACTIVE,
    expectedProjectValue: 3800000,
    solutions: ['STEM_LAB', 'SCIENCE_LEARNING', 'EPATHSHALA'],
    schools: [
      {
        schoolId: 'SCH-MAH-0201',
        name: 'Zilla Parishad High School Haveli',
        address: 'Taluka Haveli, Pune District, Maharashtra 412207',
        contactPerson: 'Mr. Anant Deshmukh',
        contactDesignation: 'Principal',
        phone: '+91 94220 12345',
        email: 'zphaveli.pune@mahazp.edu.in',
        studentCount: 680,
        platforms: [
          { platform: 'tablet', licenseCount: 30, licenseDays: 365 },
          { platform: 'linux', licenseCount: 10, licenseDays: 365 }
        ]
      },
      {
        schoolId: 'SCH-MAH-0202',
        name: 'Zilla Parishad Model Primary School Baramati',
        address: 'Baramati Rural, Pune, Maharashtra 413102',
        contactPerson: 'Mrs. Suvarna Kadam',
        contactDesignation: 'Senior Teacher',
        phone: '+91 98231 54321',
        email: 'zp.baramati@mahazp.edu.in',
        studentCount: 520,
        platforms: [
          { platform: 'ifp', licenseCount: 12, licenseDays: 365 },
          { platform: 'tablet', licenseCount: 25, licenseDays: 365 }
        ]
      }
    ]
  },
  {
    dashboardProjectId: 'PRJ-KAR-003',
    projectName: 'Karnataka Public Schools — Digital English & Language Lab',
    organizationName: 'Department of Public Instruction, Karnataka',
    email: 'kps.edtech@karnataka.gov.in',
    phone: '+91 80 2221 4350',
    address: 'New Public Offices, Nrupathunga Road, Bengaluru, Karnataka 560001',
    status: PROJECT_STATUSES.ACTIVE,
    expectedProjectValue: 2900000,
    solutions: ['LANGUAGE', 'EPATHSHALA'],
    schools: [
      {
        schoolId: 'SCH-KAR-0301',
        name: 'Karnataka Public School (KPS) Malleshwaram',
        address: '18th Cross, Malleshwaram, Bengaluru, Karnataka 560055',
        contactPerson: 'Mr. Venkatesh Murthy',
        contactDesignation: 'Teacher / Staff Incharge',
        phone: '+91 94480 67890',
        email: 'kps.malleshwaram@kar.edu.in',
        studentCount: 890,
        platforms: [
          { platform: 'ifp', licenseCount: 10, licenseDays: 365 },
          { platform: 'tablet', licenseCount: 35, licenseDays: 365 }
        ]
      }
    ]
  },
  {
    dashboardProjectId: 'PRJ-DAV-004',
    projectName: 'DAV Educational Trust — Astronomy & Space Science Centers',
    organizationName: 'DAV College Managing Committee',
    email: 'space.labs@davcmc.net.in',
    phone: '+91 11 2351 5951',
    address: 'Chitra Gupta Road, Paharganj, New Delhi 110055',
    status: PROJECT_STATUSES.ACTIVE,
    expectedProjectValue: 5200000,
    solutions: ['ASTRONOMY', 'STEM_LAB'],
    schools: [
      {
        schoolId: 'SCH-DAV-0401',
        name: 'DAV Public School Pushpanjali Enclave',
        address: 'Pushpanjali Enclave, Pitampura, New Delhi 110034',
        contactPerson: 'Mrs. Anita Wadhera',
        contactDesignation: 'Principal',
        phone: '+91 98101 22334',
        email: 'davpe.delhi@davcmc.net.in',
        studentCount: 2100,
        platforms: [
          { platform: 'ifp', licenseCount: 16, licenseDays: 365 },
          { platform: 'windows', licenseCount: 40, licenseDays: 365 }
        ]
      }
    ]
  },
  {
    dashboardProjectId: 'PRJ-KVS-005',
    projectName: 'Kendriya Vidyalaya Sangathan — Interactive Smartboard Upgrade',
    organizationName: 'Kendriya Vidyalaya Sangathan HQ',
    email: 'kvs.smartlabs@kvsangathan.nic.in',
    phone: '+91 11 2685 8570',
    address: '18 Institutional Area, Shaheed Jeet Singh Marg, New Delhi 110016',
    status: PROJECT_STATUSES.ACTIVE,
    expectedProjectValue: 6400000,
    solutions: ['SMART_SHAALA', 'EPATHSHALA'],
    schools: [
      {
        schoolId: 'SCH-KVS-0501',
        name: 'Kendriya Vidyalaya Andrews Ganj',
        address: 'Andrews Ganj, Near Defence Colony, New Delhi 110049',
        contactPerson: 'Mr. B.K. Singh',
        contactDesignation: 'Principal',
        phone: '+91 11 2625 1234',
        email: 'kv.andrewsganj@kvsangathan.nic.in',
        studentCount: 1800,
        platforms: [
          { platform: 'ifp', licenseCount: 22, licenseDays: 365 }
        ]
      }
    ]
  },
  {
    dashboardProjectId: 'DT-PRJ-2026-XAVIER',
    projectName: "St. Xavier's World School & STEM Innovation Hub",
    organizationName: "St. Xavier's Education Foundation",
    email: 'management@stxaviers.edu.in',
    phone: '+91 9811223344',
    address: 'Plot 12, Institutional Area, Sector 62, Noida, UP 201309',
    status: PROJECT_STATUSES.ACTIVE,
    expectedProjectValue: 5600000,
    solutions: ['STEM_LAB', 'ROBOTICS', 'EPATHSHALA', 'ASTRONOMY'],
    schools: [
      {
        schoolId: 'SCH-XAVIER-01',
        name: "St. Xavier's World School (Main Campus)",
        address: 'Sector 62, Noida, UP 201309',
        contactPerson: 'Father Joseph Thomas',
        contactDesignation: 'Director & Principal',
        phone: '+91 98112 33445',
        email: 'principal@stxaviers.edu.in',
        studentCount: 2400,
        platforms: [
          { platform: 'ifp', licenseCount: 25, licenseDays: 365 },
          { platform: 'tablet', licenseCount: 60, licenseDays: 365 }
        ]
      }
    ]
  }
];

async function seedFromDashboard() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log('\n========================================================================');
    console.log('🚀 DIGITOPPERS PROJECT TRACKER & DASHBOARD FULL SYSTEM SYNC & SEED');
    console.log('========================================================================\n');

    // 1. Clean collections
    await Employee.deleteMany({});
    await mongoose.connection.collection('projects').deleteMany({});
    await ProjectMember.deleteMany({});
    await ProjectRequest.deleteMany({});
    await Timeline.deleteMany({});
    await TimelineNode.deleteMany({});
    await Requirement.deleteMany({});
    await Activity.deleteMany({});
    await Notification.deleteMany({});
    console.log('✅ Cleaned all previous collections.');

    // 2. Create actual Digitoppers employees
    console.log(`\n👥 Creating ${EMPLOYEES_DATA.length} Digitoppers team members...`);
    const createdMap = {};
    for (const empData of EMPLOYEES_DATA) {
      const emp = await Employee.create({
        name: empData.name,
        email: empData.email.toLowerCase().trim(),
        passwordHash: UNIFIED_PASSWORD,
        globalRole: empData.globalRole,
        employeeCode: empData.employeeCode,
        designation: empData.designation,
        phone: empData.phone,
        reportingManager: empData.reportingManager,
        isActive: true,
        canRequestNewProject: empData.canRequestNewProject,
        permissions: {
          canRequestNewProject: empData.canRequestNewProject
        }
      });
      createdMap[emp.email] = emp;
    }

    const pawan = createdMap['growth@digitoppers.com'];
    const sandeep = createdMap['tech@digitoppers.com'];
    const manoj = createdMap['manojk@digitoppers.com'];
    const soumay = createdMap['soumay@digitoppers.com'];
    const shruti = createdMap['shruti@digitoppers.com'];
    const sachin = createdMap['sachin@digitoppers.com'];
    const bhavna = createdMap['bhavna@digitoppers.com'];
    const parveen = createdMap['parveen@digitoppers.com'];
    const ajay = createdMap['ajayp@digitoppers.com'];
    const nidhi = createdMap['nidhi@digitoppers.com'];

    console.log('✅ Created all 17 team members with Digitoppers roles.');

    // 3. Process each Dashboard Project
    console.log('\n📦 Creating Projects with full Digitoppers specifications...');

    for (let i = 0; i < DASHBOARD_SOURCE_DATA.length; i++) {
      const item = DASHBOARD_SOURCE_DATA[i];
      const assignedPM = soumay;

      const totalLicenses = item.schools.reduce((acc, s) => {
        return acc + s.platforms.reduce((pAcc, p) => pAcc + p.licenseCount, 0);
      }, 0);

      // Create Project
      const project = await ProjectService.createProject({
        projectId: item.dashboardProjectId,
        projectName: item.projectName,
        title: item.projectName,
        description: `Turnkey implementation for ${item.organizationName}. ${item.schools.length} affiliated school deployment site(s) with ${totalLicenses} active licenses.`,
        organization: item.organizationName,
        client: item.organizationName,
        email: item.email,
        phone: item.phone,
        address: item.address,
        numberOfSchools: item.schools.length,
        numberOfLicenses: totalLicenses,
        projectManager: assignedPM._id,
        status: item.status
      }, pawan._id);

      // Add Members
      await ProjectService.addOrUpdateMember(project._id, shruti._id, DESIGNATIONS.CONTRIBUTOR, pawan._id);
      await ProjectService.addOrUpdateMember(project._id, sachin._id, DESIGNATIONS.CONTRIBUTOR, pawan._id);
      await ProjectService.addOrUpdateMember(project._id, bhavna._id, DESIGNATIONS.CONTRIBUTOR, pawan._id);
      await ProjectService.addOrUpdateMember(project._id, parveen._id, DESIGNATIONS.CONTRIBUTOR, pawan._id);
      await ProjectService.addOrUpdateMember(project._id, nidhi._id, DESIGNATIONS.VIEWER, pawan._id);

      // Build Solutions and Hardware dictionaries
      const primarySchool = item.schools[0];
      const allSchoolNames = item.schools.map(s => s.name).join('; ');
      const allAddresses = item.schools.map(s => `${s.name}: ${s.address}`).join(' | ');
      const totalStudents = item.schools.reduce((acc, s) => acc + (s.studentCount || 0), 0);

      const solutionsObj = {};
      item.solutions.forEach((solKey) => {
        solutionsObj[solKey] = {
          selected: true,
          quantity: item.schools.length * 2,
          classes: 'Class 6 to 10',
          room: 'Digital Lab 1'
        };
      });

      const hardwareObj = {};
      const schoolHardwareBreakdown = [];

      item.schools.forEach(school => {
        const schoolHw = {
          schoolId: school.schoolId,
          schoolName: school.name,
          hardware: {}
        };

        school.platforms.forEach(plat => {
          const mapping = PLATFORM_TO_HARDWARE_MAP[plat.platform];
          if (mapping) {
            if (!hardwareObj[mapping.key]) {
              hardwareObj[mapping.key] = {
                selected: true,
                quantity: 0,
                specifications: mapping.spec
              };
            }
            hardwareObj[mapping.key].quantity += plat.licenseCount;
            schoolHw.hardware[mapping.key] = {
              quantity: plat.licenseCount,
              specs: mapping.spec
            };
          }
        });

        schoolHardwareBreakdown.push(schoolHw);
      });

      // Save Requirement Document
      const reqDoc = await Requirement.create({
        project: project._id,
        projectId: item.dashboardProjectId,
        projectReviewer: {
          projectCreated: {
            organizationName: item.organizationName,
            clientName: item.organizationName,
            projectName: item.projectName,
            contactPerson: primarySchool.contactPerson,
            contactDesignation: primarySchool.contactDesignation,
            phone: item.phone,
            email: item.email,
            address: item.address,
            projectReviewed: 'YES',
            projectCreated: 'YES',
            confirmed: 'YES',
            projectPlanUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            expectedSchools: item.schools.length,
            expectedLicenses: totalLicenses,
            status: 'COMPLETED',
            submittedBy: pawan._id,
            submittedAt: new Date(Date.now() - (10 - i) * 86400000)
          }
        },
        poAndPi: {
          poUpload: {
            poNumber: `PO-${item.dashboardProjectId.replace(/[^a-zA-Z0-9]/g, '')}-2026`,
            poDate: new Date(Date.now() - (9 - i) * 86400000),
            poAmount: item.expectedProjectValue,
            poDocumentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            status: 'APPROVED',
            remarks: 'Purchase Order officially approved and counter-signed.',
            submittedBy: assignedPM._id,
            submittedAt: new Date(Date.now() - (9 - i) * 86400000)
          },
          purchaseOrders: [
            {
              poNumber: `PO-${item.dashboardProjectId.replace(/[^a-zA-Z0-9]/g, '')}-2026`,
              poDate: new Date(Date.now() - (9 - i) * 86400000),
              poAmount: item.expectedProjectValue,
              poDocumentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              status: 'APPROVED',
              remarks: 'Initial signed procurement order',
              submittedBy: assignedPM._id,
              submittedAt: new Date(Date.now() - (9 - i) * 86400000)
            }
          ],
          piRequest: {
            requestedDate: new Date(Date.now() - (8 - i) * 86400000),
            expectedPIDate: new Date(Date.now() - (7 - i) * 86400000),
            requestRemarks: 'Proforma Invoice generated for 50% mobilization advance payment.',
            submittedBy: assignedPM._id,
            submittedAt: new Date(Date.now() - (8 - i) * 86400000)
          },
          proformaInvoices: [
            {
              piNumber: `PI-${item.dashboardProjectId.replace(/[^a-zA-Z0-9]/g, '')}-01`,
              piDate: new Date(Date.now() - (7 - i) * 86400000),
              uploadDate: new Date(Date.now() - (7 - i) * 86400000),
              ewayBillNumber: `EWB-2026-${1000 + i}`,
              paymentStatus: 'PAID',
              piDocumentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              paymentTerms: '50% Advance received via NEFT',
              remarks: 'Payment verified by accounts team',
              submittedBy: assignedPM._id,
              submittedAt: new Date(Date.now() - (7 - i) * 86400000)
            }
          ],
          taxInvoices: [
            {
              invoiceNumber: `INV-${item.dashboardProjectId.replace(/[^a-zA-Z0-9]/g, '')}-01`,
              invoiceDate: new Date(Date.now() - (6 - i) * 86400000),
              uploadDate: new Date(Date.now() - (6 - i) * 86400000),
              ewayBillNumber: `EWB-2026-${1000 + i}`,
              paymentStatus: 'PAID',
              invoiceDocumentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              paymentTerms: 'Advance verified with GST Tax invoice',
              remarks: 'Tax Invoice logged',
              submittedBy: assignedPM._id,
              submittedAt: new Date(Date.now() - (6 - i) * 86400000)
            }
          ]
        },
        orderRequirement: {
          schoolInformation: {
            schoolName: allSchoolNames,
            address: allAddresses,
            totalStudents: totalStudents,
            labAvailable: 'Yes',
            internetAvailable: 'Yes',
            schools: item.schools.map(s => ({
              id: s.schoolId,
              name: s.name,
              address: s.address,
              studentCount: s.studentCount,
              contactPerson: s.contactPerson,
              phone: s.phone,
              email: s.email,
              platforms: s.platforms
            })),
            remarks: 'All campus sites verified and ready for hardware deployment.',
            submittedBy: assignedPM._id,
            submittedAt: new Date(Date.now() - (5 - i) * 86400000)
          },
          solutionSelection: {
            solutions: solutionsObj,
            activeSolutionKeys: item.solutions,
            assignedTechLead: sandeep._id,
            assignedContentLead: pawan._id,
            remarks: 'Digital curriculum tailored for state/CBSE curriculum standards.',
            submittedBy: assignedPM._id,
            submittedAt: new Date(Date.now() - (4 - i) * 86400000)
          },
          hardwareRequirement: {
            hardware: hardwareObj,
            activeHardwareKeys: Object.keys(hardwareObj),
            schoolWiseHardware: schoolHardwareBreakdown,
            remarks: 'Hardware procurement and batch allocation complete.',
            submittedBy: assignedPM._id,
            submittedAt: new Date(Date.now() - (3 - i) * 86400000)
          }
        }
      });

      // Initialize and update Timeline Nodes with Full Stage Data
      let timeline = await Timeline.findOne({ project: project._id });
      if (!timeline) {
        timeline = await TimelineService.initializeTimelineForProject(project._id, true);
      }
      if (timeline) {
        const isCompleteProject = (i === 0 || i === 5); // Projects PRJ-DEL-001 & DT-PRJ-2026-XAVIER
        const nodes = await TimelineNode.find({ timeline: timeline._id });

        for (const node of nodes) {
          node.assignedTo = assignedPM._id;

          if (node.key === 'PROJECT_REVIEWER' || node.key === 'PROJECT_CREATED') {
            node.status = 'COMPLETED';
            node.formData = reqDoc.projectReviewer.projectCreated;
          } else if (node.key === 'PO_UPLOAD') {
            node.status = 'COMPLETED';
            node.formData = reqDoc.poAndPi.poUpload;
          } else if (node.key === 'PI_REQUEST') {
            node.status = 'COMPLETED';
            node.formData = reqDoc.poAndPi.piRequest;
          } else if (node.key === 'PI_UPLOAD') {
            node.status = 'COMPLETED';
            node.formData = reqDoc.poAndPi.taxInvoices[0] || reqDoc.poAndPi.proformaInvoices[0];
          } else if (node.key === 'PO_AND_PI') {
            node.status = 'COMPLETED';
          } else if (node.key === 'SCHOOL_ONBOARDING_INFORMATION') {
            node.status = 'COMPLETED';
            node.formData = reqDoc.orderRequirement.schoolInformation;
          } else if (node.key === 'SOLUTION_SELECTION') {
            node.status = 'COMPLETED';
            node.formData = reqDoc.orderRequirement.solutionSelection;
          } else if (node.key === 'HARDWARE_REQUIREMENT') {
            node.status = 'COMPLETED';
            node.formData = reqDoc.orderRequirement.hardwareRequirement;
          } else if (node.key === 'ORDER_REQUIREMENT') {
            node.status = 'COMPLETED';
          } else if (node.key === 'REQ_AND_STOCK_CHECK') {
            node.status = 'COMPLETED';
            node.formData = {
              stockCheck: {
                items: [
                  { itemKey: 'IFP_PANEL', itemName: 'Interactive Flat Panel 75"', requiredQuantity: item.schools.length, inStockQuantity: item.schools.length, purchaseQuantity: 0, status: 'IN_STOCK' },
                  { itemKey: 'STUDENT_TABLETS', itemName: 'Student Learning Tablets (10")', requiredQuantity: totalLicenses, inStockQuantity: Math.floor(totalLicenses * 0.6), purchaseQuantity: Math.ceil(totalLicenses * 0.4), status: 'PARTIAL' }
                ]
              },
              purchaseAssignedTo: parveen._id,
              remarks: 'Central warehouse stock verified. Smartboards in stock; tablets earmarked for vendor procurement.'
            };
          } else if (node.key === 'PURCHASE_IF_NEEDED') {
            node.status = 'COMPLETED';
            node.formData = {
              productProcurements: {
                procurements: [
                  {
                    productKey: 'STUDENT_TABLETS',
                    productName: 'Student Learning Tablets (10")',
                    vendorName: 'Samsung Enterprise Tech Pvt Ltd',
                    vendorPoNumber: `V-PO-2026-${100 + i}`,
                    vendorPoDate: '2026-09-18',
                    poDocumentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    vendorPiNumber: `V-PI-8821${i}`,
                    vendorPiDate: '2026-09-19',
                    piDocumentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    status: 'ORDER_PLACED',
                    remarks: 'Procurement order placed with 3-year OEM replacement warranty.'
                  }
                ]
              },
              overallProcurementRemarks: 'Vendor purchase order approved and advance payment processed.'
            };
          } else if (node.key === 'CONSIGNMENT_TRACKING') {
            node.status = 'COMPLETED';
            node.formData = {
              productConsignments: {
                consignments: [
                  {
                    productKey: 'STUDENT_TABLETS',
                    productName: 'Student Learning Tablets (10")',
                    courierName: 'Blue Dart Express',
                    docketNumber: `BD-EXP-992019${i}`,
                    dispatchDate: '2026-09-20',
                    expectedDeliveryDate: '2026-09-22',
                    actualDeliveryDate: '2026-09-22',
                    status: 'DELIVERED',
                    proofOfDeliveryUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                    deliveryAddress: item.address,
                    remarks: 'Consignment received at school premises in intact sealed condition.'
                  }
                ]
              },
              overallLogisticsRemarks: 'All consignments delivered on site.'
            };
          } else if (node.key === 'HARDWARE_READY') {
            node.status = 'COMPLETED';
            node.formData = {
              allHardwareReceived: 'YES',
              damagedItems: 'None',
              readyForInstallation: 'YES',
              remarks: 'Physical verification and unboxing completed with zero defects.'
            };
          } else if (node.key === 'PROJECT_CONFIG_AND_IMPLEMENTATION') {
            node.status = 'COMPLETED';
            node.formData = {
              projectCreation: 'YES',
              schoolCreation: 'YES',
              licenseCreation: 'YES',
              apkFileUrl: 'https://digitoppers.com/builds/digi-smart-v2.4.apk',
              remarks: `Tenant created, ${item.schools.length} schools and ${totalLicenses} licenses active.`
            };
          } else if (node.key === 'TECH_TESTING') {
            node.status = 'COMPLETED';
            node.formData = {
              testingDone: 'YES',
              testReportUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              remarks: 'Smoke testing, offline lesson caching, and token validation passed 100%.'
            };
          } else if (node.key === 'CONTENT_CONFIGURATION') {
            node.status = 'COMPLETED';
            node.formData = {
              contentSets: {
                board: 'CBSE / State Board',
                languages: ['English', 'Hindi'],
                classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
                subjects: ['Science', 'Mathematics', 'Social Science', 'Robotics & STEM']
              },
              remarks: 'Classes 6 to 10 mapped with multimedia animations and question banks.'
            };
          } else if (node.key === 'CONTENT_REVIEW_QA') {
            node.status = 'COMPLETED';
            node.formData = {
              reviewDone: 'YES',
              remarks: 'Reviewed by Subject Matter Experts with zero curriculum defects.'
            };
          } else if (node.key === 'SHEET_READINESS') {
            node.status = 'COMPLETED';
            node.formData = {
              sheetReady: 'YES',
              remarks: 'Master curriculum and lesson plan sheets synced.'
            };
          } else if (node.key === 'DUMP_READINESS') {
            node.status = 'COMPLETED';
            node.formData = {
              dumpReady: 'YES',
              remarks: 'Offline SD Card and Lab Server dump image validated.'
            };
          } else if (node.key === 'CONTENT_READY') {
            node.status = 'COMPLETED';
            node.formData = {
              contentReady: 'YES',
              remarks: 'Content locked, encrypted, and bundled.'
            };
          } else if (node.key === 'TESTING_PREPARATION') {
            node.status = isCompleteProject ? 'COMPLETED' : 'IN_PROGRESS';
            node.formData = {
              appDownload: {
                appUrl: 'https://digitoppers.com/builds/digi-smart-v2.4.apk',
                version: 'v2.4.0-release',
                uploadedAt: '2026-09-21'
              },
              testEnvironment: 'Interactive Flat Panel / Smartboard',
              plannedTestingDate: '2026-09-22',
              testScope: 'Core curriculum offline videos, interactive quiz engine, and progress sync.',
              remarks: 'Test lab ready with Android 13 IFP and student tablets.'
            };
          } else if (node.key === 'INTEGRATION_TESTING') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              overallTestResult: 'ALL_PASSED',
              testingResults: {
                appTesting: 'PASSED',
                dashboardSync: 'PASSED',
                contentPlayback: 'PASSED',
                offlineMode: 'PASSED'
              },
              remarks: 'Full end-to-end integration verified. Ready for school rollout.'
            };
          } else if (node.key === 'INSTALLATION_PLANNING') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              installationDate: '2026-09-23',
              teamMembers: 'Parveen Malik (Lead Engineer), Sachin Kumar (Tech Support)',
              siteContact: primarySchool.contactPerson || 'School Principal',
              remarks: 'Site electrical, wall mount brackets, and network switches confirmed.'
            };
          } else if (node.key === 'INSTALLATION_EXECUTION' || node.key === 'INSTALLATION_COMPLETED') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              completed: 'YES',
              installationReportUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              remarks: 'Smartboard installed on classroom wall with UPS power backup; tablet lab configured with mobile charging trolley.',
              installationSection: {
                schools: item.schools.map((sch, sIdx) => ({
                  schoolId: sch.schoolId,
                  schoolName: sch.name,
                  hardwareItems: [
                    {
                      itemKey: 'IFP_PANEL',
                      itemName: 'Interactive Flat Panel 75"',
                      quantity: 1,
                      individualSerials: [`DT-IFP-75-2026-${100 + sIdx}`]
                    },
                    {
                      itemKey: 'STUDENT_TABLETS',
                      itemName: 'Student Tablets 10"',
                      quantity: 20,
                      individualSerials: Array.from({ length: 20 }, (_, tIdx) => `DT-TAB-10-2026-${sIdx * 20 + tIdx + 1}`)
                    }
                  ],
                  photo1: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop',
                  photo2: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop',
                  photo3: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop',
                  installationDate: '2026-09-24',
                  status: 'COMPLETED'
                }))
              }
            };
          } else if (node.key === 'INSTALLATION_TESTING') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              testResult: 'PASS',
              issues: 'None',
              remarks: 'Touch response, speaker audio, stylus calibration, and Wi-Fi tested.'
            };
          } else if (node.key === 'TRAINING_PLANNING') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              trainingType: 'Full Training',
              participantsCount: 30,
              remarks: 'Training schedule shared with principal and head of science/IT.'
            };
          } else if (node.key === 'TRAINING_SCHEDULE') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              trainingDate: '2026-09-25',
              mode: 'OFFLINE',
              trainerName: 'Bhavna Yadav (Lead Trainer)',
              remarks: 'Hands-on practical workshop in smart classroom.'
            };
          } else if (node.key === 'TRAINING_EXECUTION') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              attendance: 28,
              topicsCovered: 'DigiToppers Smart Curriculum, offline lesson planner, quiz assessment, analytics dashboard.',
              trainingPhotosUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop',
              remarks: '28 teachers attended and received practical training certificates.'
            };
          } else if (node.key === 'TRAINING_COMPLETED') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              completed: 'YES',
              feedbackSummary: 'Average score 4.9/5 from 28 teachers. High enthusiasm for interactive math and science content.',
              remarks: 'Training sign-off signed by Principal.'
            };
          } else if (node.key === 'FINAL_PROJECT_REVIEW') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              reviewed: 'Yes',
              pendingItems: 'None',
              clientFeedback: 'Excellent execution quality and prompt on-site support.',
              remarks: 'Reviewed by Project Manager and COO.'
            };
          } else if (node.key === 'DOCUMENTATION_COMPLETION') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              handoverDocumentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              remarks: 'Hardware asset register, warranty cards, and handover certificates counter-signed.'
            };
          } else if (node.key === 'PAYMENT_TRACKING') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              totalProjectAmount: item.expectedProjectValue || 4500000,
              totalPaidAmount: item.expectedProjectValue || 4500000,
              totalPendingAmount: 0,
              paymentStatus: 'PAID',
              remarks: '100% payment settled with tax invoices cleared.'
            };
          } else if (node.key === 'PROJECT_CLOSED') {
            node.status = isCompleteProject ? 'COMPLETED' : 'PENDING';
            node.formData = {
              approved: 'YES',
              closureDate: '2026-09-26',
              closureRemarks: 'Project successfully completed and transitioned to 3-year AMC & warranty support.'
            };
          } else if (node.key === 'EXECUTION' || node.key === 'HARDWARE_STREAM' || node.key === 'TECH_STREAM' || node.key === 'CONTENT_STREAM' || node.key === 'INSTALLATION' || node.key === 'TRAINING' || node.key === 'PROJECT_CLOSURE' || node.key === 'TECH_AND_CONTENT_TESTING') {
            node.status = isCompleteProject ? 'COMPLETED' : 'IN_PROGRESS';
          }

          await TimelineNode.findByIdAndUpdate(node._id, {
            status: node.status,
            formData: node.formData,
            assignedTo: node.assignedTo
          });
        }

        if (isCompleteProject) {
          await Timeline.findByIdAndUpdate(timeline._id, {
            status: 'COMPLETED'
          });
        }
      }

      console.log(`  ✓ Seeded [${item.dashboardProjectId}] ${item.projectName} (${item.schools.length} Schools, ${totalLicenses} Licenses)`);
    }

    // 4. Create Project Requests
    console.log('\n📥 Creating Project Requests...');
    const allProjects = await ProjectService.getAllProjects(pawan);

    if (allProjects.length >= 2) {
      await ProjectRequest.create({
        requestId: 'REQ-2026-001',
        title: allProjects[0].projectName || allProjects[0].title,
        projectName: allProjects[0].projectName || allProjects[0].title,
        client: allProjects[0].organization || 'Education Dept.',
        expectedProjectValue: 4500000,
        requestedBy: bhavna._id,
        requestedTo: pawan._id,
        projectManager: soumay._id,
        status: 'APPROVED',
        dashboardProjectId: allProjects[0].projectId,
        confirmedProjectId: allProjects[0]._id,
        isManualDashboardCreated: true,
        reviewNotes: 'Manually verified on Dashboard and approved for full rollout.',
        reviewedBy: pawan._id,
        reviewedAt: new Date()
      });

      await ProjectRequest.create({
        requestId: 'REQ-2026-002',
        title: allProjects[1].projectName || allProjects[1].title,
        projectName: allProjects[1].projectName || allProjects[1].title,
        client: allProjects[1].organization || 'Education Dept.',
        expectedProjectValue: 3800000,
        requestedBy: shruti._id,
        requestedTo: sandeep._id,
        projectManager: soumay._id,
        status: 'APPROVED',
        dashboardProjectId: allProjects[1].projectId,
        confirmedProjectId: allProjects[1]._id,
        isManualDashboardCreated: true,
        reviewNotes: 'Dashboard project created and linked to tracker timeline.',
        reviewedBy: sandeep._id,
        reviewedAt: new Date()
      });
    }

    await ProjectRequest.create({
      requestId: 'REQ-2026-003',
      title: 'Odisha Adarsha Vidyalaya STEM Labs',
      projectName: 'Odisha Adarsha Vidyalaya STEM Labs',
      client: 'Odisha School Education Programme Authority',
      expectedProjectValue: 4200000,
      requestedBy: bhavna._id,
      requestedTo: pawan._id,
      projectManager: soumay._id,
      status: 'PENDING',
      description: 'Rollout of 20 STEM labs with IFPs and student tablets across Sambalpur and Cuttack.'
    });

    await ProjectRequest.create({
      requestId: 'REQ-2026-004',
      title: 'Assam High School Digital Classroom Pilot',
      projectName: 'Assam High School Digital Classroom Pilot',
      client: 'Samagra Shiksha Assam',
      expectedProjectValue: 3100000,
      requestedBy: parveen._id,
      requestedTo: manoj._id,
      projectManager: soumay._id,
      status: 'PENDING',
      description: 'Phase 1 implementation for 15 model high schools in Guwahati.'
    });

    await ProjectRequest.create({
      requestId: 'REQ-2026-005',
      title: 'Private Pilot Setup - North Zone',
      projectName: 'Private Pilot Setup - North Zone',
      client: 'Alpha Global Academy',
      expectedProjectValue: 1200000,
      requestedBy: ajay._id,
      requestedTo: pawan._id,
      projectManager: soumay._id,
      status: 'REJECTED',
      reviewNotes: 'Budget allocation deferred to next fiscal quarter.',
      reviewedBy: pawan._id,
      reviewedAt: new Date()
    });

    console.log('\n🎉 ALL DASHBOARD & PROJECT TRACKER DATA SUCCESSFULLY SEEDED WITH EXACT PROPERTIES!\n');
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('🔑 Unified Password for ALL accounts: ' + UNIFIED_PASSWORD);
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('Key Logins:');
    console.log('  👑 Pawan Kumar (CEO)          : growth@digitoppers.com');
    console.log('  👑 Sandeep Mudgal (CTO)       : tech@digitoppers.com');
    console.log('  👑 Manoj Kumar (COO)          : manojk@digitoppers.com');
    console.log('  💼 Soumay Garg (Assoc PM)     : soumay@digitoppers.com');
    console.log('  ✨ Shruti (Tech Intern)       : shruti@digitoppers.com');
    console.log('  💻 Sachin Kumar (Flutter Dev) : sachin@digitoppers.com');
    console.log('  📈 Bhavna Yadav (BDM)         : bhavna@digitoppers.com');
    console.log('  ⚙️  Parveen Malik (Operations) : parveen@digitoppers.com');
    console.log('────────────────────────────────────────────────────────────────────────\n');

    if (require.main === module) {
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('❌ Seeding error:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  seedFromDashboard();
}

module.exports = seedFromDashboard;
