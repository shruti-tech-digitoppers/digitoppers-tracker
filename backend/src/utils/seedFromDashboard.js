const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Employee = require('../modules/employees/employee.model');
const ProjectService = require('../modules/projects/project.service');
const ProjectMember = require('../modules/projects/project-member.model');
const Timeline = require('../modules/timeline/timeline.model');
const TimelineNode = require('../modules/timeline/timeline-node.model');
const Requirement = require('../modules/requirements/requirements.model');
const Activity = require('../modules/activity/activity.model');
const Notification = require('../modules/notifications/notifications.model');
const { GLOBAL_ROLES, DESIGNATIONS, PROJECT_STATUSES } = require('../core/constants');

/**
 * Mappings from Dashboard Platforms to Project Tracker Hardware Items
 */
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

/**
 * Curated Dataset mirroring Deployed Dashboard MongoDB Models
 * (Projects, Schools, Platforms, License counts, Coordinators, Geo-Locations)
 */
const DASHBOARD_SOURCE_DATA = [
  {
    dashboardProjectId: 'PRJ-DASH-001',
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
    dashboardProjectId: 'PRJ-DASH-002',
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
        contactDesignation: 'Senior Teacher & STEM Coordinator',
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
    dashboardProjectId: 'PRJ-DASH-003',
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
        contactDesignation: 'EdTech Coordinator',
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
    dashboardProjectId: 'PRJ-DASH-004',
    projectName: 'DAV Educational Trust — Astronomy & Space Science Centers',
    organizationName: 'DAV College Managing Committee',
    email: 'space.labs@davcmc.net.in',
    phone: '+91 11 2351 5951',
    address: 'Chitra Gupta Road, Paharganj, New Delhi 110055',
    status: PROJECT_STATUSES.ACTIVE,
    expectedProjectValue: 5200000,
    solutions: ['ASTRONOMY', 'ROBOTICS', 'STEM_LAB'],
    schools: [
      {
        schoolId: 'SCH-DAV-0401',
        name: 'DAV Public School Pushpanjali Enclave',
        address: 'Pushpanjali Enclave, Pitampura, New Delhi 110034',
        contactPerson: 'Mrs. Rashmi Grover',
        contactDesignation: 'Astronomy Club Convener',
        phone: '+91 98101 22334',
        email: 'davpe.delhi@davcmc.net.in',
        studentCount: 2100,
        platforms: [
          { platform: 'ifp', licenseCount: 16, licenseDays: 365 },
          { platform: 'windows', licenseCount: 40, licenseDays: 365 }
        ]
      }
    ]
  }
];

/**
 * Main Seeding Routine
 */
async function seedFromDashboard() {
  try {
    await connectDB();
    console.log('\n======================================================');
    console.log('🚀 SEEDING FROM DASHBOARD DATABASE & MODELS');
    console.log('======================================================\n');

    // 1. Clean existing collections safely
    console.log('🧹 Preparing collections...');
    if (process.env.ALLOW_WIPE_ALL === 'true') {
      console.log('⚠️ ALLOW_WIPE_ALL is enabled. Purging collections...');
      await Employee.deleteMany({});
      await mongoose.connection.collection('projects').deleteMany({});
      await ProjectMember.deleteMany({});
      await Timeline.deleteMany({});
      await TimelineNode.deleteMany({});
      await Requirement.deleteMany({});
      await Activity.deleteMany({});
      await Notification.deleteMany({});
      console.log('✅ Cleaned all collections.');
    } else {
      console.log('🛡️ SAFEGUARD ACTIVE: Preserving live database records. Deleting only seeded test projects (PRJ-DASH-*)');
      await mongoose.connection.collection('projects').deleteMany({ projectCode: /^PRJ-DASH-/ });
    }

    // 2. Create standard Employees / Team Members
    console.log('\n👥 Creating Users & Staff Members...');
    const admin = await Employee.create({
      name: 'System Admin',
      email: 'admin@digitopper.com',
      passwordHash: 'Admin@123',
      globalRole: GLOBAL_ROLES.ADMIN,
      employeeCode: 'EMP001'
    });

    const pmRahul = await Employee.create({
      name: 'Rahul Sharma',
      email: 'rahul.pm@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP002'
    });

    const pmSneha = await Employee.create({
      name: 'Sneha Kulkarni',
      email: 'sneha.pm@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP003'
    });

    const contribAmit = await Employee.create({
      name: 'Amit Verma (Tech Lead)',
      email: 'amit.contrib@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP004'
    });

    const contribDivya = await Employee.create({
      name: 'Divya Nair (Content Lead)',
      email: 'divya.contrib@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP005'
    });

    const viewerPriya = await Employee.create({
      name: 'Priya Iyer (Coordinator)',
      email: 'priya.viewer@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP006'
    });

    console.log('✅ Created 6 employees with Admin, PM, Contributor & Viewer roles.');

    const pmList = [pmRahul, pmSneha];

    // 3. Process and Seed Projects & Associated Schools
    console.log('\n📦 Importing Dashboard Projects & Schools into Project Tracker...');

    for (let i = 0; i < DASHBOARD_SOURCE_DATA.length; i++) {
      const item = DASHBOARD_SOURCE_DATA[i];
      const assignedPM = pmList[i % pmList.length];

      console.log(`\n▶ Processing: [${item.dashboardProjectId}] ${item.projectName}`);

      // Create Project in Project Tracker (Initializes Timeline, Stages & Nodes)
      const project = await ProjectService.createProject({
        projectCode: item.dashboardProjectId,
        title: item.projectName,
        description: `Imported from Dashboard Backend. Organization: ${item.organizationName}. ${item.schools.length} affiliated school deployment site(s).`,
        client: item.organizationName,
        projectManager: assignedPM._id,
        status: item.status
      }, admin._id);

      // Assign Members
      await ProjectService.addOrUpdateMember(project._id, contribAmit._id, DESIGNATIONS.CONTRIBUTOR, admin._id);
      await ProjectService.addOrUpdateMember(project._id, contribDivya._id, DESIGNATIONS.CONTRIBUTOR, admin._id);
      await ProjectService.addOrUpdateMember(project._id, viewerPriya._id, DESIGNATIONS.VIEWER, admin._id);

      // Aggregate School & Hardware Data across schools for this project
      const primarySchool = item.schools[0];
      const allSchoolNames = item.schools.map(s => s.name).join('; ');
      const allAddresses = item.schools.map(s => `${s.name}: ${s.address}`).join(' | ');
      const totalStudents = item.schools.reduce((acc, s) => acc + (s.studentCount || 0), 0);

      // Build Solutions Dictionary
      const solutionsObj = {};
      item.solutions.forEach((solKey) => {
        solutionsObj[solKey] = {
          selected: true,
          quantity: item.schools.length * 2,
          classes: 'Class 6 to 10',
          room: 'Digital Lab 1'
        };
      });

      // Build Hardware Items Dictionary from Dashboard Platforms
      const hardwareItemsObj = {};
      item.schools.forEach((sch) => {
        sch.platforms.forEach((plat) => {
          const mapped = PLATFORM_TO_HARDWARE_MAP[plat.platform];
          if (mapped) {
            if (!hardwareItemsObj[mapped.key]) {
              hardwareItemsObj[mapped.key] = {
                selected: true,
                itemName: mapped.label,
                quantity: 0,
                specNotes: mapped.spec
              };
            }
            hardwareItemsObj[mapped.key].quantity += (plat.licenseCount || 1);
          }
        });
      });

      // Stock check summary for hardware execution stage
      const stockItems = {};
      Object.entries(hardwareItemsObj).forEach(([key, val]) => {
        stockItems[key] = {
          requiredQuantity: val.quantity,
          inStockQuantity: Math.floor(val.quantity * 0.7),
          purchaseQuantity: Math.ceil(val.quantity * 0.3)
        };
      });

      // Create Detailed Requirements document linking everything together
      await Requirement.create({
        project: project._id,
        workflowVersion: 'v1',
        currentStageKey: 'ORDER_REQUIREMENT',
        currentSubstageKey: 'SCHOOL_ONBOARDING_INFORMATION',
        status: 'IN_PROGRESS',
        updatedBy: assignedPM._id,

        // 01 — PROJECT REVIEWER
        projectReviewer: {
          projectCreated: {
            organizationName: item.organizationName,
            contactPerson: primarySchool.contactPerson,
            contactDesignation: primarySchool.contactDesignation,
            phone: item.phone,
            email: item.email,
            location: item.address,
            leadSource: 'Government Portal',
            expectedProjectValue: item.expectedProjectValue,
            leadDescription: `Imported Dashboard Project. Covers ${item.schools.length} schools across state nodes.`,
            confirmed: 'YES',
            confirmationDate: new Date('2026-01-15'),
            remarks: 'Dashboard synchronization completed smoothly.',
            submittedBy: admin._id,
            submittedAt: new Date('2026-01-15')
          }
        },

        // 02 — PO & PI
        poAndPi: {
          poUpload: {
            projectName: item.projectName,
            poDocumentUrl: '/uploads/sample-dashboard-po.pdf',
            poNumber: `PO-DASH-${1000 + i}`,
            poDate: new Date('2026-01-20'),
            poAmount: item.expectedProjectValue,
            issuingOrganization: item.organizationName,
            remarks: 'Official Work Order generated via Dashboard backend.',
            submittedBy: assignedPM._id,
            submittedAt: new Date('2026-01-20')
          },
          piUpload: {
            piDocumentUrl: '/uploads/sample-dashboard-pi.pdf',
            piNumber: `PI-DASH-${1000 + i}`,
            piDate: new Date('2026-01-22'),
            amount: Math.round(item.expectedProjectValue / 1.18),
            tax: 18,
            totalAmount: item.expectedProjectValue,
            paymentTerms: '50% Advance on hardware dispatch, 40% on installation, 10% on training handover',
            remarks: 'Proforma Invoice generated against Work Order.',
            submittedBy: assignedPM._id,
            submittedAt: new Date('2026-01-22')
          }
        },

        // 03 — ORDER REQUIREMENT (Directly populated from Dashboard Schools)
        orderRequirement: {
          schoolInformation: {
            schools: item.schools.map((s, idx) => ({
              id: `school-${idx + 1}`,
              schoolName: s.name,
              schoolCode: s.schoolId,
              address: s.address,
              deploymentLocations: `${s.name}: Room 101 & STEM Lab`,
              principalName: s.contactPerson,
              contactPerson: s.contactPerson,
              phone: s.phone,
              email: s.email,
              totalStudents: s.studentCount,
              labAvailable: 'Yes',
              internetAvailable: 'Yes',
              remarks: `Synced from Dashboard Platform. ${s.platforms.map(p => `${p.platform.toUpperCase()}: ${p.licenseCount}`).join(', ')}`
            })),
            schoolName: allSchoolNames,
            schoolCode: primarySchool.schoolId,
            address: allAddresses,
            deploymentLocations: item.schools.map(s => `${s.name}: Room 101 & STEM Room`).join('; '),
            principalName: primarySchool.contactPerson,
            contactPerson: primarySchool.contactPerson,
            phone: primarySchool.phone,
            email: primarySchool.email,
            totalStudents: totalStudents,
            labAvailable: 'Yes',
            internetAvailable: 'Yes',
            remarks: `Total Schools Synced: ${item.schools.length}. Master Dashboard Contact: ${item.phone}`,
            submittedBy: assignedPM._id,
            submittedAt: new Date()
          },
          solutionSelection: {
            solutions: solutionsObj,
            overallNotes: `Solutions active: ${item.solutions.join(', ')}. Synced from Dashboard modules.`,
            remarks: 'Configured and verified with School Administration.',
            submittedBy: contribAmit._id,
            submittedAt: new Date()
          },
          hardwareRequirement: {
            hardware: { items: hardwareItemsObj },
            overallHardwareNotes: `Total hardware units calculated across ${item.schools.length} schools: ${Object.values(hardwareItemsObj).reduce((a, b) => a + b.quantity, 0)} units.`,
            remarks: 'Hardware procurement schedule mapped to Dashboard license quotas.',
            submittedBy: contribAmit._id,
            submittedAt: new Date()
          }
        },

        // 04 — EXECUTION (Initial stock check ready)
        execution: {
          hardware: {
            reqAndStockCheck: {
              checked: true,
              stockSummary: `Verified across warehouse for ${Object.keys(hardwareItemsObj).length} item categories.`,
              stockStatus: 'PARTIALLY_AVAILABLE',
              remarks: 'Available units allocated from central inventory.',
              submittedBy: contribAmit._id,
              submittedAt: new Date()
            }
          },
          tech: {
            projectConfigAndImplementation: {
              projectCreation: 'YES',
              schoolCreation: 'YES',
              licenseCreation: 'YES',
              remarks: 'Dashboard database entries verified and connected.'
            }
          },
          content: {
            contentConfiguration: {
              remarks: 'Standard state board & NCERT mapped digital content assigned.'
            }
          }
        }
      });

      // Populate Timeline Nodes Form Data so UI drawers open with preloaded data
      const projectTimeline = await Timeline.findOne({ project: project._id });
      if (projectTimeline) {
        await TimelineNode.updateOne(
          { timeline: projectTimeline._id, key: 'SCHOOL_ONBOARDING_INFORMATION' },
          {
            formData: {
              schools: item.schools.map((s, idx) => ({
                id: `school-${idx + 1}`,
                schoolName: s.name,
                schoolCode: s.schoolId,
                address: s.address,
                deploymentLocations: `${s.name}: Room 101 & STEM Lab`,
                principalName: s.contactPerson,
                contactPerson: s.contactPerson,
                phone: s.phone,
                email: s.email,
                totalStudents: s.studentCount,
                labAvailable: 'Yes',
                internetAvailable: 'Yes',
                remarks: `Synced from Dashboard Platform. ${s.platforms.map(p => `${p.platform.toUpperCase()}: ${p.licenseCount}`).join(', ')}`
              })),
              schoolName: allSchoolNames,
              schoolCode: primarySchool.schoolId,
              address: allAddresses,
              deploymentLocations: item.schools.map(s => `${s.name}: Room 101 & STEM Room`).join('; '),
              principalName: primarySchool.contactPerson,
              contactPerson: primarySchool.contactPerson,
              phone: primarySchool.phone,
              email: primarySchool.email,
              totalStudents: totalStudents,
              labAvailable: 'Yes',
              internetAvailable: 'Yes',
              remarks: `Total Schools Synced: ${item.schools.length}. Master Dashboard Contact: ${item.phone}`
            }
          }
        );

        await TimelineNode.updateOne(
          { timeline: projectTimeline._id, key: 'SOLUTION_SELECTION' },
          {
            formData: {
              solutions: solutionsObj,
              overallNotes: `Solutions active: ${item.solutions.join(', ')}. Synced from Dashboard modules.`
            }
          }
        );

        await TimelineNode.updateOne(
          { timeline: projectTimeline._id, key: 'HARDWARE_REQUIREMENT' },
          {
            formData: {
              hardwareRequirements: { items: hardwareItemsObj },
              remarks: 'Hardware procurement schedule mapped to Dashboard license quotas.'
            }
          }
        );
      }

      console.log(`   ✔ Synced ${item.schools.length} Schools & ${Object.keys(hardwareItemsObj).length} Hardware Categories into Timeline Nodes`);
    }

    console.log('\n======================================================');
    console.log('🎉 DASHBOARD SEED COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('\n--- TEST CREDENTIALS ---');
    console.log('Admin       : admin@digitopper.com      / Admin@123');
    console.log('PM (Rahul)  : rahul.pm@digitopper.com   / Password@123');
    console.log('PM (Sneha)  : sneha.pm@digitopper.com   / Password@123');
    console.log('Contributor : amit.contrib@digitopper.com / Password@123');
    console.log('Contributor : divya.contrib@digitopper.com / Password@123');
    console.log('Viewer      : priya.viewer@digitopper.com / Password@123');
    console.log('------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during dashboard seeding:', error);
    process.exit(1);
  }
}

seedFromDashboard();
