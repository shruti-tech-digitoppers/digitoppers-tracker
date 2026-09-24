require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../modules/projects/project.model');
const Requirement = require('../modules/requirements/requirements.model');
const Timeline = require('../modules/timeline/timeline.model');
const TimelineNode = require('../modules/timeline/timeline-node.model');
const Employee = require('../modules/employees/employee.model');
const timelineService = require('../modules/timeline/timeline.service');

async function seedMultiSchoolProject() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://itzshrutiiisharma_db_user:r3aSLf6f4hBNHRGW@cluster0.8lguhwy.mongodb.net/digitoppers_db?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Find PM or Admin Employee
  let pm = await Employee.findOne({ role: { $in: ['PROJECT_MANAGER', 'ADMIN'] } });
  if (!pm) {
    pm = await Employee.findOne();
  }
  const pmId = pm?._id;
  console.log('Using PM / Assignee:', pm?.name, pm?.email);

  // 1. Create or Find Project
  const customProjectId = 'DT-PRJ-2026-XAVIER';
  let project = await Project.findOne({ projectId: customProjectId });
  
  if (!project) {
    project = await Project.create({
      projectId: customProjectId,
      projectName: "St. Xavier's World School & STEM Innovation Hub",
      email: "management@stxaviers.edu.in",
      phone: "+91 9811223344",
      address: "Plot 12, Institutional Area, Sector 62, Noida, UP 201309",
      numberOfSchools: 3,
      numberOfLicenses: 50,
      status: 'ACTIVE',
      isActive: true
    });
    console.log('Created new Project:', project.projectName, project._id);
  } else {
    project.projectName = "St. Xavier's World School & STEM Innovation Hub";
    project.email = "management@stxaviers.edu.in";
    project.phone = "+91 9811223344";
    project.address = "Plot 12, Institutional Area, Sector 62, Noida, UP 201309";
    project.numberOfSchools = 3;
    project.status = 'ACTIVE';
    project.isActive = true;
    await project.save();
    console.log('Updated existing Project:', project.projectName, project._id);
  }

  // 2. Initialize or Reset Timeline
  await timelineService.resetTimelineForProject(project._id);
  const timeline = await Timeline.findOne({ project: project._id });
  console.log('Timeline initialized for project with ID:', timeline._id);

  // 3. Multi-School Data
  const schoolsData = [
    {
      id: 'school-xavier-main',
      schoolName: "St. Xavier's High School (Main Campus)",
      schoolCode: "07080104501",
      address: "Plot 12, Institutional Area, Sector 62, Noida, Uttar Pradesh 201309",
      deploymentLocations: "STEM Innovation Lab Room 101, Robotics Lab 202, 15 Smart Classrooms",
      principalName: "Dr. Anita Sharma",
      contactPerson: "Mr. Rajesh Verma (Head of IT)",
      phone: "+91 9811223344",
      email: "noida@stxaviers.edu.in",
      totalStudents: 1850,
      labAvailable: "Yes",
      internetAvailable: "Yes",
      remarks: "Dedicated 1200 sq.ft AC Lab ready with 3-phase power and fiber broadband."
    },
    {
      id: 'school-xavier-south',
      schoolName: "St. Xavier's International Academy (South Campus)",
      schoolCode: "07080104502",
      address: "Block C, Knowledge Park V, Greater Noida West, UP 201306",
      deploymentLocations: "Science & Robotics Hub Room 301, 10 Smart Panels",
      principalName: "Fr. Thomas Joseph",
      contactPerson: "Ms. Pooja Nair (Lab In-charge)",
      phone: "+91 9877112233",
      email: "gnoida@stxaviers.edu.in",
      totalStudents: 1200,
      labAvailable: "Yes",
      internetAvailable: "Yes",
      remarks: "New wing completed; lab furniture installed and verified."
    },
    {
      id: 'school-xavier-delhi',
      schoolName: "St. Xavier's Model School (Delhi Heritage Campus)",
      schoolCode: "07080104503",
      address: "14 Rajpur Road, Civil Lines, North Delhi 110054",
      deploymentLocations: "Space Observatory & STEM Hub 2nd Floor",
      principalName: "Mrs. Sunita Kaul",
      contactPerson: "Mr. Amit Saxena",
      phone: "+91 9822334455",
      email: "delhi@stxaviers.edu.in",
      totalStudents: 950,
      labAvailable: "Yes",
      internetAvailable: "Yes",
      remarks: "Rooftop observation deck accessible for astronomy telescopes."
    }
  ];

  // 4. Solutions Data School-Wise
  const activeSolutionKeys = ['STEM_LAB', 'ROBOTICS', 'EPATHSHALA', 'ASTRONOMY'];
  const schoolWiseSolutions = {
    'school-xavier-main': {
      'STEM_LAB': {
        solutionKey: 'STEM_LAB',
        solutionName: 'STEM Lab',
        quantity: 2,
        targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
        deploymentLocation: 'STEM Lab Room 101 & 102',
        board: 'CBSE',
        notes: 'Includes Mechanical, Electrical, and Aeromodelling DIY kits'
      },
      'ROBOTICS': {
        solutionKey: 'ROBOTICS',
        solutionName: 'Robotics Lab',
        quantity: 1,
        targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 (Science - PCM)', 'Class 11 (Science - PCB)', 'Class 12 (Science - PCM)', 'Class 12 (Science - PCB)'],
        deploymentLocation: 'Innovation Lab Room 202',
        board: 'CBSE',
        notes: 'AI & Arduino Modular IoT kits with 3D Printer'
      },
      'EPATHSHALA': {
        solutionKey: 'EPATHSHALA',
        solutionName: 'ePathshala',
        quantity: 15,
        targetClasses: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 (Science - PCM)', 'Class 11 (Commerce)', 'Class 11 (Humanities/Arts)', 'Class 12 (Science - PCM)', 'Class 12 (Commerce)', 'Class 12 (Humanities/Arts)'],
        deploymentLocation: 'Primary & Secondary Classrooms',
        board: 'CBSE',
        notes: 'Full K-12 mapped digital animated content & question bank'
      }
    },
    'school-xavier-south': {
      'STEM_LAB': {
        solutionKey: 'STEM_LAB',
        solutionName: 'STEM Lab',
        quantity: 1,
        targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
        deploymentLocation: 'Science & STEM Hub Room 301',
        board: 'ICSE / ISC',
        notes: 'Curriculum mapped to ICSE Science syllabus'
      },
      'ROBOTICS': {
        solutionKey: 'ROBOTICS',
        solutionName: 'Robotics Lab',
        quantity: 1,
        targetClasses: ['Class 6', 'Class 7', 'Class 8'],
        deploymentLocation: 'Tech Lab 1',
        board: 'ICSE / ISC',
        notes: 'Block-based coding and sensors'
      }
    },
    'school-xavier-delhi': {
      'STEM_LAB': {
        solutionKey: 'STEM_LAB',
        solutionName: 'STEM Lab',
        quantity: 1,
        targetClasses: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'],
        deploymentLocation: 'Discovery Room Ground Floor',
        board: 'State Board',
        notes: 'Junior science experiments'
      },
      'ASTRONOMY': {
        solutionKey: 'ASTRONOMY',
        solutionName: 'Astronomy Lab',
        quantity: 1,
        targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
        deploymentLocation: 'Rooftop Observatory 3rd Floor',
        board: 'State Board',
        notes: 'Equatorial telescope with sky mapping kit'
      }
    }
  };

  // 5. Hardware Requirements Data School-Wise
  const activeHardwareKeys = ['IFP_PANEL', 'STUDENT_TABLETS', 'STEM_INNOVATION_KIT', 'ROBOTICS_IOT_KIT', 'ASTRONOMY_TELESCOPE', 'SERVER_MINI_PC', 'UPS_POWER_BACKUP'];
  const schoolWiseHardware = {
    'school-xavier-main': {
      'IFP_PANEL': {
        itemKey: 'IFP_PANEL',
        itemName: 'Interactive Flat Panel (75")',
        quantity: 3,
        specNotes: '75-inch 4K UHD Touch Display, Android 13 with Core i5 OPS PC',
        deploymentRoom: 'STEM Lab 101, Innovation Lab 202, AV Room',
        serialNotes: ''
      },
      'STUDENT_TABLETS': {
        itemKey: 'STUDENT_TABLETS',
        itemName: 'Student Learning Tablets (10")',
        quantity: 30,
        specNotes: '10.1" Ruggedized Octa-core Android Tablets with preloaded DigiToppers App',
        deploymentRoom: 'Innovation Lab 202 Charging Cart',
        serialNotes: ''
      },
      'STEM_INNOVATION_KIT': {
        itemKey: 'STEM_INNOVATION_KIT',
        itemName: 'STEM Lab Innovation Kits',
        quantity: 4,
        specNotes: 'Grade 6-10 Comprehensive DIY Science Kits (120+ experiments)',
        deploymentRoom: 'STEM Lab 101 & 102 Storage Cabinets',
        serialNotes: ''
      },
      'ROBOTICS_IOT_KIT': {
        itemKey: 'ROBOTICS_IOT_KIT',
        itemName: 'Robotics & IoT Modular Kits',
        quantity: 2,
        specNotes: 'Complete Modular robotics set with Arduino, ESP32, motors & sensors',
        deploymentRoom: 'Innovation Lab 202',
        serialNotes: ''
      },
      'SERVER_MINI_PC': {
        itemKey: 'SERVER_MINI_PC',
        itemName: 'Central Lab Offline Content Server',
        quantity: 1,
        specNotes: 'Core i7 / 32GB RAM / 2TB NVMe SSD High-Speed Local Server',
        deploymentRoom: 'Server Rack Room 101',
        serialNotes: ''
      },
      'UPS_POWER_BACKUP': {
        itemKey: 'UPS_POWER_BACKUP',
        itemName: 'Online UPS Power Backup (3kVA)',
        quantity: 2,
        specNotes: '3kVA Online UPS with 60-min battery backup',
        deploymentRoom: 'Lab 101 & Lab 202',
        serialNotes: ''
      }
    },
    'school-xavier-south': {
      'IFP_PANEL': {
        itemKey: 'IFP_PANEL',
        itemName: 'Interactive Flat Panel (75")',
        quantity: 2,
        specNotes: '75-inch 4K Touch Panel with OPS PC',
        deploymentRoom: 'Science Hub Room 301 & Tech Lab 1',
        serialNotes: ''
      },
      'STUDENT_TABLETS': {
        itemKey: 'STUDENT_TABLETS',
        itemName: 'Student Learning Tablets (10")',
        quantity: 20,
        specNotes: '10.1" Tablets for classroom learning',
        deploymentRoom: 'Tech Lab 1 Cart',
        serialNotes: ''
      },
      'STEM_INNOVATION_KIT': {
        itemKey: 'STEM_INNOVATION_KIT',
        itemName: 'STEM Lab Innovation Kits',
        quantity: 2,
        specNotes: 'ICSE Science mapped experiment sets',
        deploymentRoom: 'Science Hub Room 301',
        serialNotes: ''
      },
      'ROBOTICS_IOT_KIT': {
        itemKey: 'ROBOTICS_IOT_KIT',
        itemName: 'Robotics & IoT Modular Kits',
        quantity: 1,
        specNotes: 'Modular robotics kit with sensors',
        deploymentRoom: 'Tech Lab 1',
        serialNotes: ''
      }
    },
    'school-xavier-delhi': {
      'IFP_PANEL': {
        itemKey: 'IFP_PANEL',
        itemName: 'Interactive Flat Panel (65")',
        quantity: 1,
        specNotes: '65-inch 4K Touch Panel',
        deploymentRoom: 'Discovery Room Ground Floor',
        serialNotes: ''
      },
      'ASTRONOMY_TELESCOPE': {
        itemKey: 'ASTRONOMY_TELESCOPE',
        itemName: 'Astronomy Telescope & Space Kit',
        quantity: 2,
        specNotes: '150mm Reflector Telescope with Motorized Equatorial Mount & Solar Filter',
        deploymentRoom: 'Rooftop Observatory 3rd Floor',
        serialNotes: ''
      },
      'STEM_INNOVATION_KIT': {
        itemKey: 'STEM_INNOVATION_KIT',
        itemName: 'STEM Lab Innovation Kits',
        quantity: 2,
        specNotes: 'Junior STEM learning sets',
        deploymentRoom: 'Discovery Room Storage',
        serialNotes: ''
      }
    }
  };

  // 6. Populate Requirements Document
  let reqDoc = await Requirement.findOne({ project: project._id });
  if (!reqDoc) {
    reqDoc = await Requirement.create({ project: project._id });
  }

  // Stage 01
  reqDoc.projectReviewer = {
    projectCreated: {
      projectName: "St. Xavier's World School & STEM Innovation Hub",
      organizationName: "St. Xavier's Educational Group",
      country: "India",
      phone: "+91 9811223344",
      email: "management@stxaviers.edu.in",
      address: "Plot 12, Institutional Area, Sector 62, Noida, UP",
      confirmed: "YES",
      projectReviewed: "YES",
      projectCreated: "YES",
      confirmationDate: new Date('2026-03-05'),
      remarks: "Project reviewed and confirmed by Management Committee for 3 campuses.",
      submittedBy: pmId,
      submittedAt: new Date('2026-03-05')
    }
  };

  // Stage 02
  reqDoc.poAndPi = {
    purchaseOrders: [
      {
        poNumber: "PO/XAVIER/2026/089",
        poDate: new Date('2026-03-10'),
        uploadDate: new Date('2026-03-10'),
        poDocumentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        issuingOrganization: "St. Xavier's Educational Group",
        remarks: "Official Purchase Order for Phase 1 Lab Setup & Hardware",
        submittedBy: pmId,
        submittedAt: new Date('2026-03-10')
      },
      {
        poNumber: "PO/XAVIER/2026/090",
        poDate: new Date('2026-03-12'),
        uploadDate: new Date('2026-03-12'),
        poDocumentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        issuingOrganization: "St. Xavier's Educational Group",
        remarks: "Supplementary PO for Astronomy & Space Lab kits",
        submittedBy: pmId,
        submittedAt: new Date('2026-03-12')
      }
    ],
    poUpload: {
      poNumber: "PO/XAVIER/2026/089",
      poDate: new Date('2026-03-10'),
      uploadDate: new Date('2026-03-10'),
      poDocumentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      issuingOrganization: "St. Xavier's Educational Group",
      remarks: "Primary PO submitted and approved",
      submittedBy: pmId,
      submittedAt: new Date('2026-03-10')
    },
    piRequest: {
      requestedDate: new Date('2026-03-11'),
      expectedPIDate: new Date('2026-03-15'),
      requestRemarks: "Proforma Invoice requested with split campus billing",
      submittedBy: pmId,
      submittedAt: new Date('2026-03-11')
    },
    proformaInvoices: [
      {
        piNumber: "PI-2026-DT-441",
        piDate: new Date('2026-03-14'),
        uploadDate: new Date('2026-03-14'),
        ewayBillNumber: "EWB-9081-2241-1001",
        paymentStatus: "PAID",
        piDocumentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        paymentTerms: "50% Advance received via NEFT Ref: DT8921448",
        remarks: "Advance payment verified by finance",
        submittedBy: pmId,
        submittedAt: new Date('2026-03-14')
      },
      {
        piNumber: "PI-2026-DT-442",
        piDate: new Date('2026-03-15'),
        uploadDate: new Date('2026-03-15'),
        ewayBillNumber: "EWB-9081-2241-1002",
        paymentStatus: "PARTIALLY_PAID",
        piDocumentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        paymentTerms: "50% Balance on Delivery",
        remarks: "Balance invoice pending shipment dispatch",
        submittedBy: pmId,
        submittedAt: new Date('2026-03-15')
      }
    ],
    taxInvoices: [
      {
        invoiceNumber: "INV/2026/0991",
        invoiceDate: new Date('2026-03-18'),
        uploadDate: new Date('2026-03-18'),
        ewayBillNumber: "EWB-9081-2241-1001",
        paymentStatus: "PAID",
        invoiceDocumentUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        paymentTerms: "Paid in Full via Direct Bank Transfer",
        remarks: "GST Tax Invoice with generated E-Way Bill",
        submittedBy: pmId,
        submittedAt: new Date('2026-03-18')
      }
    ],
    piUpload: {
      piNumber: "PI-2026-DT-441",
      piDate: new Date('2026-03-14'),
      piUploadDate: new Date('2026-03-14'),
      invoiceNumber: "INV/2026/0991",
      invoiceDate: new Date('2026-03-18'),
      invoiceUploadDate: new Date('2026-03-18'),
      ewayBillNumber: "EWB-9081-2241-1001",
      paymentStatus: "PAID",
      uploadDate: new Date('2026-03-18'),
      submittedBy: pmId,
      submittedAt: new Date('2026-03-18')
    }
  };

  // Stage 03
  reqDoc.orderRequirement = {
    schoolInformation: {
      schools: schoolsData,
      schoolName: "St. Xavier's High School (Main Campus); St. Xavier's International Academy; St. Xavier's Model School",
      address: "Noida Sector 62 | Greater Noida West | Delhi Civil Lines",
      totalStudents: 4000,
      labAvailable: "Yes",
      internetAvailable: "Yes",
      remarks: "All 3 campuses have allocated dedicated lab infrastructure rooms.",
      submittedBy: pmId,
      submittedAt: new Date('2026-03-20')
    },
    solutionSelection: {
      activeSolutionKeys,
      schoolWiseSolutions,
      solutions: {
        'STEM_LAB': { selected: true, solutionName: 'STEM Lab', quantity: 4, targetClasses: 'Class 1 to 10' },
        'ROBOTICS': { selected: true, solutionName: 'Robotics Lab', quantity: 2, targetClasses: 'Class 6 to 12' },
        'EPATHSHALA': { selected: true, solutionName: 'ePathshala', quantity: 15, targetClasses: 'Class 1 to 12' },
        'ASTRONOMY': { selected: true, solutionName: 'Astronomy Lab', quantity: 1, targetClasses: 'Class 6 to 10' }
      },
      assignedTechLead: pmId,
      assignedContentLead: pmId,
      overallNotes: "Turnkey multi-school implementation with blended learning pedagogy and teacher empowerment workshops.",
      remarks: "Scheduled teacher training across all 3 centers in first week of April.",
      submittedBy: pmId,
      submittedAt: new Date('2026-03-21')
    },
    hardwareRequirement: {
      activeHardwareKeys,
      schoolWiseHardware,
      hardware: {
        'IFP_PANEL': { selected: true, itemName: 'Interactive Flat Panel (75")', quantity: 6, specNotes: '75-inch 4K UHD Touch Display with OPS PC' },
        'STUDENT_TABLETS': { selected: true, itemName: 'Student Learning Tablets (10")', quantity: 50, specNotes: '10.1" Ruggedized Android Tablets' },
        'STEM_INNOVATION_KIT': { selected: true, itemName: 'STEM Lab Innovation Kits', quantity: 8, specNotes: 'Grade 6-10 Comprehensive DIY Science Kits' },
        'ROBOTICS_IOT_KIT': { selected: true, itemName: 'Robotics & IoT Modular Kits', quantity: 3, specNotes: 'Modular robotics set with Arduino & sensors' },
        'ASTRONOMY_TELESCOPE': { selected: true, itemName: 'Astronomy Telescope & Space Kit', quantity: 2, specNotes: '150mm Reflector Telescope with Equatorial Mount' },
        'SERVER_MINI_PC': { selected: true, itemName: 'Central Lab Offline Content Server', quantity: 1, specNotes: 'Core i7 / 32GB RAM / 2TB SSD' },
        'UPS_POWER_BACKUP': { selected: true, itemName: 'Online UPS Power Backup', quantity: 2, specNotes: '3kVA Online UPS' }
      },
      overallHardwareNotes: "Procurement ready with priority delivery to Noida Main Campus.",
      remarks: "Equipment inspection and serial logging mandatory before dispatch.",
      submittedBy: pmId,
      submittedAt: new Date('2026-03-22')
    }
  };

  await reqDoc.save();
  console.log('Successfully saved Requirement document with multi-school and school-wise solutions & hardware data!');

  // 7. Update Timeline Nodes
  const nodes = await TimelineNode.find({ timeline: timeline._id });
  for (const node of nodes) {
    node.assignedTo = pmId;

    if (node.key === 'PROJECT_REVIEWER' || node.key === 'PROJECT_CREATED') {
      node.status = 'COMPLETED';
      node.formData = reqDoc.projectReviewer.projectCreated;
    } else if (node.key === 'PO_UPLOAD') {
      node.status = 'COMPLETED';
      node.formData = {
        organizationName: "St. Xavier's Educational Group",
        purchaseOrders: reqDoc.poAndPi.purchaseOrders,
        ...reqDoc.poAndPi.poUpload
      };
    } else if (node.key === 'PI_REQUEST') {
      node.status = 'COMPLETED';
      node.formData = reqDoc.poAndPi.piRequest;
    } else if (node.key === 'PI_UPLOAD') {
      node.status = 'COMPLETED';
      node.formData = {
        organizationName: "St. Xavier's Educational Group",
        proformaInvoices: reqDoc.poAndPi.proformaInvoices,
        taxInvoices: reqDoc.poAndPi.taxInvoices,
        ...reqDoc.poAndPi.piUpload
      };
    } else if (node.key === 'PO_AND_PI') {
      node.status = 'COMPLETED';
    } else if (node.key === 'SCHOOL_ONBOARDING_INFORMATION') {
      node.status = 'COMPLETED';
      node.formData = {
        schools: schoolsData,
        ...reqDoc.orderRequirement.schoolInformation
      };
    } else if (node.key === 'SOLUTION_SELECTION') {
      node.status = 'COMPLETED';
      node.formData = {
        schools: schoolsData,
        activeSolutionKeys,
        schoolWiseSolutions,
        assignedTechLead: pmId,
        assignedContentLead: pmId,
        ...reqDoc.orderRequirement.solutionSelection
      };
    } else if (node.key === 'HARDWARE_REQUIREMENT') {
      node.status = 'COMPLETED';
      node.formData = {
        schools: schoolsData,
        activeHardwareKeys,
        schoolWiseHardware,
        ...reqDoc.orderRequirement.hardwareRequirement
      };
    } else if (node.key === 'ORDER_REQUIREMENT') {
      node.status = 'COMPLETED';
    } else if (node.key === 'EXECUTION' || node.key === 'HARDWARE_STREAM' || node.key === 'REQ_AND_STOCK_CHECK') {
      node.status = 'IN_PROGRESS';
    }

    await node.save();
  }

  console.log(`Updated ${nodes.length} timeline nodes. Project '${customProjectId}' is fully seeded and ready!`);
  await mongoose.disconnect();
}

seedMultiSchoolProject().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
