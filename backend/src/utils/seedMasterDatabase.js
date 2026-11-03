const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');
const timelineConfig = require('../config/timeline');

// Models
const Department = {
  deleteMany: () => Promise.resolve({ deletedCount: 0 }),
  insertMany: (docs) => Promise.resolve(docs.map(d => ({ ...d, _id: new mongoose.Types.ObjectId() })))
};
const Employee = require('../modules/employees/employee.model');
const Solution = require('../modules/solutions/solution.model');
const Hardware = require('../modules/hardware/hardware.model');
// Project collection helper (direct MongoDB access since local Project model is removed)
const Project = {
  deleteMany: (q) => mongoose.connection.collection('projects').deleteMany(q || {}).catch(() => ({ deletedCount: 0 })),
  create: async (doc) => {
    const res = await mongoose.connection.collection('projects').insertOne({ ...doc });
    return { ...doc, _id: res.insertedId };
  },
  findOne: (q) => mongoose.connection.collection('projects').findOne(q || {}),
  find: (q) => ({ lean: () => mongoose.connection.collection('projects').find(q || {}).toArray() })
};
const ProjectMember = require('../modules/project-members/project-member.model');
const School = require('../modules/schools/school.model');
const ProjectSchools = require('../modules/project-schools/project-schools.model');
const Requirement = require('../modules/requirements/requirements.model');
const Timeline = { create: async (doc) => ({ ...doc, _id: doc.project || new mongoose.Types.ObjectId() }), findOne: () => null, deleteMany: () => ({}) };
const TimelineNode = require('../modules/timeline/timeline-node.model');
const Activity = require('../modules/activity/activity.model');
const Notification = require('../modules/notifications/notifications.model');
const Grade = require('../modules/content/grade/grade.model');
const HardwareSpec = require('../modules/hardware-specs/hardware-spec.model');
const { License, SchoolHardwareLicense } = require('../modules/tech');
const ProjectRequest = require('../modules/project-requests/project-request.model');

// Helper to generate full 7-section school onboarding survey
function createDetailedSchoolSurvey(name, district, state, pin, index) {
    const principalNames = [
        'Dr. Rajesh Kumar Sharma',
        'Mrs. Anjali Sengupta',
        'Mr. Vikramaditya Rathore',
        'Dr. Meenakshi Sundaram',
        'Prof. Harish Chandran',
        'Mrs. Sunita Deshmukh'
    ];
    const pocNames = [
        'Amitabh Roy',
        'Pooja Nair',
        'Suresh Kulkarni',
        'Kavita Venkataraman',
        'Rameshwar Yadav',
        'Deepa Swaminathan'
    ];

    const principal = principalNames[index % principalNames.length];
    const poc = pocNames[index % pocNames.length];
    const phone = `+91 98${110 + index * 4} 44${220 + index * 7}`;
    const pocPhone = `+91 98${730 + index * 3} 22${110 + index * 6}`;
    const email = `principal.${name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)}@gov.edu.in`;
    const pocEmail = `ict.${poc.toLowerCase().replace(/\s+/g, '.')}@gov.edu.in`;

    const totalStud = 650 + (index * 180);
    const totalTeach = 28 + (index * 6);
    const totalClass = 20 + (index * 4);

    return {
        schoolCategory: ['Higher secondary with grade 1 to 12'],
        classes: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        streams: ['Science (PCM/PCB)', 'Commerce with Mathematics', 'Humanities & Social Sciences', 'Vocational / IT Skills'],
        principalName: principal,
        principalDetails: `${principal} | Phone: ${phone} | Email: ${email}`,
        pocName: poc,
        pocDesignation: 'PGT Computer Science & Smart Lab Coordinator',
        pocContact: `${poc} | Mobile: ${pocPhone} | Email: ${pocEmail}`,

        totalTeachers: totalTeach,
        subjectWiseTeachers: `Mathematics: ${Math.floor(totalTeach * 0.15)}, Science: ${Math.floor(totalTeach * 0.25)}, CS/IT: 3, English: ${Math.floor(totalTeach * 0.25)}, Social Studies: ${Math.floor(totalTeach * 0.2)}, Arts/Sports: 4`,
        classWiseSubjects: `Primary (1-5): Math, EVS, English, Hindi, Arts & Craft\nMiddle (6-8): Mathematics, General Science, Social Science, Hindi, English, Sanskrit, Digital Literacy\nSecondary (9-10): Advanced Math, Science, Social Studies, English Language, Information Technology\nSr. Secondary (11-12): Physics, Chemistry, Mathematics, Biology, Computer Science, Accountancy, Economics`,
        triSystemType: 'Bi-annual Term Structure with Continuous & Comprehensive Evaluation (CCE)',
        totalStudents: totalStud,
        regularStudentsRatio: '94.2% daily regular attendance recorded on biometric/RFID registers',
        studentCommittee: 'Active Student Council (Head Boy, Head Girl, STEM Innovation Club Leaders)',
        villagesCount: `Students commuting from ${5 + index * 2} surrounding residential sectors within 6 km radius`,
        parentsOccupation: 'Government / PSU (35%), Private Sector & IT (40%), Local Business (20%), Other (5%)',
        studentAttendance: 'Average 93.5% across primary and senior wings',
        overallResult: '100% Pass record in Class 10 & 12 Board examinations with 46+ students securing distinctions (>85%)',

        totalClassrooms: totalClass,
        classroomCondition: ['Permanent'],
        additionalRooms: 'Physics Lab, Chemistry Lab, Biology Lab, 2 Dedicated Computer Labs, Maker/Robotics Lab, Central Library',
        spareRooms: '2 spare ventilated activity rooms available on 1st floor for smart lab expansion',
        electricityInternetAvailability: '24/7 dedicated 3-phase grid power supply with 50 kVA silent DG backup + 300 Mbps high-speed Optical Fiber Broadband',
        drinkingWaterAvailability: 'Commercial RO water purification system with refrigerated stainless steel water dispensers on all floors',
        washroomAvailability: 'Separate hygienic washroom blocks for Boys (6 cubicles), Girls (6 cubicles) and Staff (3 cubicles)',

        ictLabAvailable: 'Yes',
        ictSetupDate: '2024-06-15',
        ictHardwareComponents: '25x Intel Core i5 Desktop Systems, 2x 75" 4K Interactive Flat Panels (IFP), 5 kVA Online UPS, Gigabit Smart Switch, Full HD AI PTZ Camera, Studio Sound Bar',
        digitalContentProvided: 'Digitoppers K-12 Interactive STEM, 3D Science Experiments, Math Lab Simulators & Animated LMS Repository',
        digitalContentClasses: 'Grades 1 through 12 across Science, Mathematics, Computer Science, AI, Social Sciences',
        ictLabFunctional: 'Yes',
        ictWeeklyUsage: '6 days per week, 7 active class periods daily (approx 42 hours/week utilization)',
        ictStudentCount: `${totalStud} students scheduled on weekly rotational lab timetable`,
        computerTeacherAvailable: 'Yes (2 Full-time PGT in CS/IT + 1 Hardware Lab Assistant)',
        internetFacilityType: 'Dual Redundant Optical Fiber (300 Mbps primary + 100 Mbps backup link) with Enterprise Wi-Fi 6',
        libraryCornerAvailable: 'Yes',
        govtBooksCount: '5,400+ books from NCERT, National Book Trust (NBT), Sahitya Akademi, CSIR Science Series',
        fullTimeLibrarian: 'Yes',
        newspaperSubscription: '6 National Daily Dailies (English & Regional), Science Reporter, National Geographic, Tell Me Why',

        additionalNotes: 'School administration and faculty are highly motivated. Rooms are equipped with secure iron doors, double locks, and acoustic wall paneling.',
        otherStakeholders: 'School Management Committee (SMC) Chairperson, District Education Officer (DEO), BEO, PTA President',
        supportingOrgName: 'District Education Department & State CSR Digital Learning Mission',
        supportingOrgContactPerson: 'Mr. Alok Verma',
        supportingOrgDesignation: 'Senior Joint Director of Education & District Project Coordinator',
        supportingOrgContact: '+91 98100 77665',
        supportingOrgEmail: 'alok.verma@educationmission.gov.in',
        smartClassRoomIdentification: `Room ${101 + index * 10} (Ground Floor Digital Lab) & Room ${201 + index * 10} (First Floor Senior Interactive Smart Class)`,
        smartClassRoomCondition: 'Dual 2.0 Ton Inverter ACs, premium ergonomic desks & chairs, motorized blackout window blinds, anti-glare recessed LED lighting',
        photoFrontView: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1200&q=80',
        photoSmartRoom: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',

        parentIncomeGroup: ['Middle Income Group (MIG)', 'Lower Income Group (LIG)'],
        parentProfessions: ['Salaried Employees / Govt Service', 'Small Business / Trading', 'Healthcare & Education', 'Technical & Skilled Trades'],
        parentProfessionOther: 'Self-employed artisans and logistics professionals',
        parentEducationLevel: ['Graduate', 'Higher Secondary Education (Class 11â€“12)', 'Postgraduate or Above'],
        firstGenerationLearner: 'No',

        securityGuard: '24/7 dedicated round-the-clock security guards stationed at entrance gates and lab corridors',
        ictSecurityMeasures: 'Full HD CCTV surveillance cameras with 45-day continuous cloud & local NVR backup, biometric finger-scan door access control',
        deviceStorage: 'Fire-retardant 19-inch rack enclosures and heavy-duty steel lockboxes with dual keys for all OPS units and IFP styluses',
        lostDeviceProtocol: 'Immediate incident logging in Asset Security Register, mandatory notification to Digitoppers PM within 2 hours',
        dataBackupPlan: 'Automated 12-hour local NAS differential snapshot backup + Daily synchronized Digitoppers encrypted cloud storage',
        responsibleUseTraining: 'Mandatory semester-wise cybersecurity, digital citizenship, and equipment safety training workshops',
        usageTrackingMechanism: 'Digitoppers Smart Classroom OS telemetry daemon logging teacher login hours and application metrics',
        cybersecurityPolicies: 'Enterprise DNS-level content filtering, strict classroom firewall rules, disabled auto-exec/removable media',
        breachHistory: 'Nil',
        digitoppersSecurityCooperation: '100% full institutional agreement of Digitoppers Equipment Safety & Digital Asset Maintenance Charter',
        safetyHazardsMitigation: 'Concealed FRLS copper wiring, dedicated Earth Pit grounding (<2 Ohms), high-speed MCB/ELCB circuit trip protection'
    };
}

// Generate realistic node form data based on key and project context
function generateNodeFormData(nodeKey, projCode, projTitle, schools, emps, isCompleted) {
    const pm = emps.empSoumay;
    const eng = emps.empRahul;
    const trainer = emps.empNeha;
    const techLead = emps.empSandeep;
    const contentLead = emps.empKavita;

    switch (nodeKey) {
        case 'PROJECT_REVIEWER':
            return {
                projectName: projTitle,
                email: `pmo.${projCode.toLowerCase()}@digitoppers.com`,
                country: 'India',
                phone: '+91 98110 01101',
                address: `${schools[0]?.district || 'Central District'}, State Directorate of Education`,
                projectReviewed: 'YES',
                projectCreated: 'YES',
                projectPlanUrl: `https://s3.digitoppers.com/plans/${projCode}_execution_plan.pdf`,
                confirmed: 'YES',
                confirmationDate: '2026-02-01',
                remarks: 'Approved by Digitoppers Executive Review Board & Department of Education.'
            };

        case 'PO_UPLOAD':
            return {
                poNumber: `PO-${projCode}-2026-01`,
                poDate: '2026-02-05',
                uploadDate: '2026-02-06',
                issuingOrganization: 'Department of School Education',
                poDocumentUrl: `https://s3.digitoppers.com/pos/${projCode}_po_signed.pdf`,
                remarks: `Official Purchase Order received for ${schools.length} schools deployment.`,
                purchaseOrders: [
                    {
                        poNumber: `PO-${projCode}-2026-01`,
                        poDate: '2026-02-05',
                        poDocumentUrl: `https://s3.digitoppers.com/pos/${projCode}_po_signed.pdf`,
                        issuingOrganization: 'Department of School Education',
                        remarks: 'Primary PO for hardware & interactive LMS setup.'
                    }
                ]
            };

        case 'PI_REQUEST':
            return {
                requestedDate: '2026-02-07',
                expectedPIDate: '2026-02-10',
                requestRemarks: 'Proforma Invoice requested for initial advance & stage milestone clearance.'
            };

        case 'PI_UPLOAD':
            return {
                piNumber: `PI-${projCode}-2026-V1`,
                piDate: '2026-02-10',
                piUploadDate: '2026-02-10',
                piDocumentUrl: `https://s3.digitoppers.com/pi/${projCode}_pi.pdf`,
                invoiceNumber: `INV-${projCode}-2026-01`,
                invoiceDocumentUrl: `https://s3.digitoppers.com/invoices/${projCode}_tax_invoice.pdf`,
                ewayBillNumber: `EWB-${projCode}-887711`,
                remarks: '100% payment reconciled and verified with Finance team.',
                proformaInvoices: [
                    {
                        piNumber: `PI-${projCode}-2026-V1`,
                        piDate: '2026-02-10',
                        piDocumentUrl: `https://s3.digitoppers.com/pi/${projCode}_pi.pdf`,
                        ewayBillNumber: `EWB-${projCode}-887711`,
                        paymentStatus: isCompleted ? 'PAID' : 'PARTIALLY_PAID',
                        remarks: 'Invoice vetted by accounts team.'
                    }
                ],
                taxInvoices: [
                    {
                        invoiceNumber: `INV-${projCode}-2026-01`,
                        invoiceDate: '2026-02-12',
                        invoiceDocumentUrl: `https://s3.digitoppers.com/invoices/${projCode}_tax_invoice.pdf`,
                        totalAmount: schools.length * 125000,
                        remarks: 'GST Tax invoice submitted to client treasury.'
                    }
                ]
            };

        case 'SCHOOL_ONBOARDING_INFORMATION':
            return {
                schoolName: schools.map(s => s.name).join('; '),
                totalStudents: schools.length * 850,
                remarks: `Complete 360-degree onboarding survey recorded for all ${schools.length} school sites.`
            };

        case 'SOLUTION_SELECTION':
            return {
                selectedSolutions: ['SMART_SHAALA', 'STEM_LAB'],
                solutionNotes: 'Interactive Smart Classrooms with 4K IFP & STEM Robotics Lab configurations.',
                approvalStatus: 'APPROVED'
            };

        case 'HARDWARE_REQUIREMENT':
            return {
                selectedHardware: ['IFP_75', 'OPS_I5', 'PENDRIVE_64', 'WALL_MOUNT'],
                hardwareNotes: '75-inch 4K panels, Core i5 OPS units, 64GB fast USB keys and heavy-duty wall mounts allocated per school.',
                allocationStatus: 'CONFIRMED'
            };

        case 'REQ_AND_STOCK_CHECK':
            return {
                stockStatus: 'ALL_IN_STOCK',
                warehouseLocation: 'Digitoppers Central Logistics Depot (Sector 63, Noida)',
                verifiedDate: '2026-02-18',
                verifiedBy: eng.name,
                remarks: `Physical stock counted & reserved for ${schools.length} school labs.`
            };

        case 'PURCHASE_IF_NEEDED':
            return {
                procurementStatus: 'PROCUREMENT_COMPLETE',
                vendorName: 'Direct OEM Fulfillment Hub',
                poNumber: `V-PO-${projCode}-01`,
                deliveryTimeline: 'Immediate Dispatch',
                remarks: 'Zero deficit stock. Hardware ready for staging.'
            };

        case 'CONSIGNMENT_TRACKING':
            return {
                courierPartner: 'Delhivery Surface Express Logistics',
                consignmentDocket: `DLV-${projCode}-89012`,
                dispatchDate: '2026-02-22',
                estimatedDeliveryDate: '2026-02-25',
                actualDeliveryDate: '2026-02-25',
                consignmentStatus: 'DELIVERED',
                remarks: `All packages safely received at all ${schools.length} destination schools.`
            };

        case 'HARDWARE_READY':
            return {
                qcCheckPassed: true,
                serialNumbersLogged: true,
                totalUnitsReady: schools.length * 4,
                qcEngineer: eng.name,
                qcDate: '2026-02-26',
                remarks: 'All interactive displays, OPS units and accessories passed 100% burn-in testing.'
            };

        case 'PROJECT_CONFIG_AND_IMPLEMENTATION':
            return {
                osBuildVersion: 'DigiOS-v2.4.1-LTS',
                apkVersion: 'Digitoppers-SmartClass-v3.0.2',
                configStatus: 'CONFIGURED',
                leadEngineer: techLead.name,
                completionDate: '2026-02-28',
                remarks: 'Offline LMS image pre-configured with school license keys.'
            };

        case 'TECH_TESTING':
            return {
                bootTestResult: 'PASSED',
                touchLatencyScore: '99.4%',
                audioVideoSync: 'PASSED',
                testedBy: emps.empShruti.name,
                testReportUrl: `https://s3.digitoppers.com/qa/${projCode}_tech_qa.pdf`,
                remarks: 'All display calibration and dual-boot tests verified.'
            };

        case 'CONTENT_CONFIGURATION':
            return {
                curriculumBoard: 'CBSE & State Board Integrated',
                gradesConfigured: 'Grades 6 to 12',
                subjectsConfigured: 'Mathematics, Science, English, Computer Science & AI',
                configuredBy: contentLead.name,
                remarks: 'Full animated lessons and interactive simulations indexed.'
            };

        case 'CONTENT_REVIEW_QA':
            return {
                qaResult: 'APPROVED',
                totalModulesVerified: 480,
                qaLead: contentLead.name,
                reviewDate: '2026-03-02',
                remarks: 'Zero missing asset errors. 100% syllabus alignment certified.'
            };

        case 'SHEET_READINESS':
            return {
                sheetUrl: `https://docs.google.com/spreadsheets/d/${projCode}_master_inventory`,
                verifiedBy: pm.name,
                status: 'READY',
                remarks: 'School-wise device and license tracking matrix prepared.'
            };

        case 'DUMP_READINESS':
            return {
                dumpImageSize: '48.6 GB',
                imageChecksum: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
                flashedMediaCount: schools.length * 2,
                status: 'FLASHED',
                remarks: 'USB keys flashed and write-protected.'
            };

        case 'CONTENT_READY':
            return {
                status: 'READY_FOR_DEPLOYMENT',
                readinessDate: '2026-03-05',
                certifiedBy: contentLead.name,
                remarks: 'Master curriculum packages bundled and ready for site installation.'
            };

        case 'TESTING_PREPARATION':
            return {
                testEnvironment: 'Pre-Deployment Lab Staging Area',
                devicesUnderTesting: schools.length,
                leadTester: emps.empShruti.name,
                status: 'PREPARED',
                remarks: 'Bench testing rigs and test suites prepared.'
            };

        case 'INTEGRATION_TESTING':
            return {
                integrationStatus: 'PASSED',
                e2eTestReportUrl: `https://s3.digitoppers.com/qa/${projCode}_e2e_report.pdf`,
                approvedBy: techLead.name,
                date: '2026-03-08',
                remarks: 'Hardware + Firmware + LMS end-to-end integration test passed.'
            };

        case 'INSTALLATION_PLANNING':
            return {
                assignedLeadEngineer: eng.name,
                plannedStartDate: '2026-03-10',
                plannedEndDate: '2026-03-15',
                installationRosterUrl: `https://s3.digitoppers.com/rosters/${projCode}_install_plan.pdf`
            };

        case 'INSTALLATION_COMPLETED':
            return {
                signedChallanCount: isCompleted ? schools.length : 0,
                allChallansUploaded: isCompleted,
                signedChallanFolderUrl: `https://s3.digitoppers.com/challans/${projCode}_all_signed/`,
                status: isCompleted ? 'COMPLETED' : 'PENDING',
                remarks: isCompleted ? '100% signed physical installation challans verified.' : 'Awaiting remaining school signatures.'
            };

        case 'TRAINING_PLANNING':
            return {
                trainerAssigned: trainer.name,
                trainingModules: 'DigiLMS Navigation, Smart Whiteboard Tools, Interactive 3D Simulations, Teacher Lesson Planner',
                trainingRosterUrl: `https://s3.digitoppers.com/training/${projCode}_roster.pdf`,
                remarks: 'Trainer briefing completed and courseware handed over.'
            };

        case 'TRAINING_EXECUTION':
            return {
                trainingStatus: isCompleted ? 'COMPLETED' : 'PENDING',
                totalTeachersTrained: isCompleted ? schools.length * 20 : 0,
                trainerName: trainer.name,
                attendanceSheetUrl: `https://s3.digitoppers.com/training/${projCode}_attendance_signed.pdf`,
                remarks: isCompleted ? 'Hands-on practice conducted for all subject faculties.' : 'Scheduled.'
            };

        case 'TRAINING_COMPLETED':
            return {
                trainingFeedbackRating: isCompleted ? 5 : null,
                feedbackSummary: isCompleted ? 'Excellent hands-on session. Teachers enthusiastic about 3D models.' : '',
                status: isCompleted ? 'COMPLETED' : 'PENDING',
                remarks: isCompleted ? 'Teacher training certificates and signed rosters archived.' : 'Pending.'
            };

        case 'FINAL_PROJECT_REVIEW':
            return {
                reviewStatus: isCompleted ? 'APPROVED' : 'PENDING',
                reviewBoard: 'Pawan Kumar (CEO), Sandeep Mudgal (CTO), Soumay Garg (PM)',
                reviewDate: isCompleted ? '2026-03-25' : null,
                remarks: isCompleted ? 'All project milestones verified and officially approved.' : 'Pending project completion.'
            };

        case 'DOCUMENTATION_COMPLETION':
            return {
                documentationStatus: isCompleted ? 'COMPLETED' : 'PENDING',
                handoverDossierUrl: `https://s3.digitoppers.com/handover/${projCode}_dossier.pdf`,
                warrantyCardsArchived: isCompleted,
                amcContractArchived: isCompleted,
                remarks: isCompleted ? '3-Year comprehensive warranty and AMC signed.' : 'Pending.'
            };

        case 'PAYMENT_TRACKING':
            return {
                paymentStatus: isCompleted ? '100% CLEARED' : 'PARTIALLY_CLEARED',
                totalContractValue: schools.length * 125000,
                totalPaidAmount: isCompleted ? schools.length * 125000 : Math.floor(schools.length * 125000 * 0.5),
                balancePending: isCompleted ? 0 : Math.floor(schools.length * 125000 * 0.5),
                reconciliationDate: isCompleted ? '2026-03-28' : null,
                remarks: isCompleted ? 'All invoice installments settled via RTGS/NEFT.' : 'Advance cleared; milestone invoice pending.'
            };

        case 'PROJECT_CLOSED':
            return {
                closureCertificateUrl: `https://s3.digitoppers.com/certificates/${projCode}_completion_certificate.pdf`,
                closedBy: pm.name,
                signOffDate: isCompleted ? '2026-03-30' : null,
                finalRating: isCompleted ? 5 : null,
                status: isCompleted ? 'CLOSED' : 'PENDING',
                remarks: isCompleted ? 'Project successfully executed, handed over, and formally closed.' : 'Project in progress.'
            };

        default:
            return {
                status: isCompleted ? 'COMPLETED' : 'PENDING',
                remarks: `Updated for ${projCode}.`
            };
    }
}

async function seedMasterDatabase() {
    console.log('\n========================================================================');
    console.log('ðŸš€ DIGITOPPERS PROJECT TRACKER â€” COMPLETE DATA SEEDER');
    console.log('========================================================================\n');

    if (mongoose.connection.readyState !== 1) {
        await connectDB();
    }

    // 1. Clean up legacy or orphan documents
    console.log('ðŸ§¹ Cleaning legacy orphaned collections and invalid references...');
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collNames = collections.map(c => c.name);

        const fragmentedToDrop = ['projecthardwares', 'projecttechs', 'projectcontents', 'projectclosures'];
        for (const f of fragmentedToDrop) {
            if (collNames.includes(f)) {
                await db.collection(f).drop();
                console.log(`  ðŸ—‘ï¸ Dropped redundant collection: ${f}`);
            }
        }
    } catch (err) {
        console.warn('Note on collection cleanup:', err.message);
    }

    // 2. Ensure Departments
    console.log('\nðŸ¢ Ensuring Master Departments...');
    await Department.deleteMany({});
    const departments = await Department.insertMany([
        { name: 'Operations & Logistics', code: 'OPS', description: 'Field operations, dispatches & logistics' },
        { name: 'Technology Solutions', code: 'TECH', description: 'Software configuration, LMS & hardware integrations' },
        { name: 'Content & Academics', code: 'CONTENT', description: 'Curriculum, content development and review' },
        { name: 'Finance & Accounts', code: 'FIN', description: 'Invoicing, billing & PO reconciliation' },
        { name: 'Sales & Accounts', code: 'SALES', description: 'Lead management & client relations' },
        { name: 'Installation & Field Operations', code: 'INSTALLATION', description: 'On-site installation, hardware deployment, and field planning' },
        { name: 'Training & Academics', code: 'TRAINING', description: 'Teacher training, pedagogy, academic workshops and school capacity building' }
    ]);
    const deptOps = departments.find(d => d.code === 'OPS') || departments[0];
    const deptTech = departments.find(d => d.code === 'TECH') || departments[1];
    const deptContent = departments.find(d => d.code === 'CONTENT') || departments[2];
    const deptFin = departments.find(d => d.code === 'FIN') || departments[3];
    const deptSales = departments.find(d => d.code === 'SALES') || departments[4];
    const deptInstallation = departments.find(d => d.code === 'INSTALLATION') || departments[5];
    const deptTraining = departments.find(d => d.code === 'TRAINING') || departments[6];
    console.log(`  ✅ 7 Master Departments ready.`);

    // 3. Ensure Employees
    console.log('\n👥 Ensuring Master Employees...');
    await Employee.deleteMany({});
    const defaultPassword = await bcrypt.hash('Digitoppers@123', 10);
    const employeeList = [
        { name: 'Pawan Kumar', email: 'growth@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP001', designation: 'CEO', globalRole: 'ADMIN', phone: '9811001101', department: deptSales._id, departmentCode: 'SALES' },
        { name: 'Sandeep Mudgal', email: 'tech@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP003', designation: 'CTO', globalRole: 'ADMIN', phone: '9811001102', department: deptTech._id, departmentCode: 'TECH' },
        { name: 'Soumay Garg', email: 'soumay@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP005', designation: 'Project Manager', globalRole: 'EMPLOYEE', phone: '9811001103', department: deptOps._id, departmentCode: 'OPS' },
        { name: 'Shruti', email: 'shruti@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP013', designation: 'Tech Intern', globalRole: 'EMPLOYEE', phone: '9811001104', department: deptTech._id, departmentCode: 'TECH' },
        { name: 'Rahul Yadav', email: 'rahul@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP014', designation: 'Field Engineer', globalRole: 'EMPLOYEE', phone: '9811001105', department: deptInstallation._id, departmentCode: 'INSTALLATION' },
        { name: 'Vikas Singh', email: 'vikas@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP015', designation: 'Field Engineer', globalRole: 'EMPLOYEE', phone: '9811001106', department: deptInstallation._id, departmentCode: 'INSTALLATION' },
        { name: 'Neha Gupta', email: 'neha@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP016', designation: 'Academic Trainer', globalRole: 'EMPLOYEE', phone: '9811001107', department: deptTraining._id, departmentCode: 'TRAINING' },
        { name: 'Pooja Mishra', email: 'pooja@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP017', designation: 'Academic Trainer', globalRole: 'EMPLOYEE', phone: '9811001108', department: deptTraining._id, departmentCode: 'TRAINING' },
        { name: 'Rohan Mehta', email: 'rohan@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP018', designation: 'Software Engineer', globalRole: 'EMPLOYEE', phone: '9811001109', department: deptTech._id, departmentCode: 'TECH' },
        { name: 'Kavita Rao', email: 'kavita@digitoppers.com', passwordHash: defaultPassword, employeeCode: 'EMP019', designation: 'Content Lead', globalRole: 'EMPLOYEE', phone: '9811001110', department: deptContent._id, departmentCode: 'CONTENT' }
    ];
    const insertedEmployees = await Employee.insertMany(employeeList);
    console.log(`  âœ… ${insertedEmployees.length} Master Employees created.`);

    const empMap = {
        empPawan: insertedEmployees[0],
        empSandeep: insertedEmployees[1],
        empSoumay: insertedEmployees[2],
        empShruti: insertedEmployees[3],
        empRahul: insertedEmployees[4],
        empVikas: insertedEmployees[5],
        empNeha: insertedEmployees[6],
        empPooja: insertedEmployees[7],
        empRohan: insertedEmployees[8],
        empKavita: insertedEmployees[9]
    };

    // 4. Ensure Catalogs
    console.log('\nðŸ“¦ Ensuring Solutions and Hardware Catalogs...');
    await Solution.deleteMany({});
    const solutions = await Solution.insertMany([
        { key: 'SMART_SHAALA', label: 'Smart Shaala', name: 'Smart Shaala Classroom', desc: 'Interactive flat panel display setup' },
        { key: 'STEM_LAB', label: 'STEM Lab', name: 'STEM Innovation Lab', desc: 'Robotics, IoT and science innovation' },
        { key: 'ASTRONOMY', label: 'Astronomy Lab', name: 'Astronomy & Space Science Center', desc: 'Telescopes & planetarium kits' },
        { key: 'LANGUAGE', label: 'Language Lab', name: 'Digital English Language Lab', desc: 'Audio-visual communication lab' },
        { key: 'EPATHSHALA', label: 'ePathshala', name: 'ePathshala Digital LMS', desc: 'Interactive smart curriculum & content' },
        { key: 'ROBOTICS', label: 'Robotics Lab', name: 'AI & Robotics Modular Lab', desc: 'Coding, AI, IoT modular kits' }
    ]);

    await Hardware.deleteMany({});
    const hardwares = await Hardware.insertMany([
        { key: 'IFP_75', label: '75" 4K IFP', name: '75" 4K UHD Interactive Flat Panel', category: 'DISPLAY', unit: 'NOS' },
        { key: 'OPS_I5', label: 'OPS i5 PC', name: 'OPS Windows 11 Pro i5 16GB/512GB PC', category: 'COMPUTING', unit: 'NOS' },
        { key: 'PENDRIVE_64', label: '64GB USB Key', name: 'Offline Curriculum USB 3.2 64GB', category: 'STORAGE', unit: 'NOS' },
        { key: 'WALL_MOUNT', label: 'Wall Mount', name: 'Heavy Duty IFP Wall Mount Bracket', category: 'ACCESSORY', unit: 'NOS' }
    ]);
    const hwIFP = hardwares[0];
    const hwOPS = hardwares[1];
    const hwPendrive = hardwares[2];
    const hwMount = hardwares[3];
    console.log(`  ✅ Solutions and Hardware catalogs ready.`);

    // 4a. Ensure Granular Hardware Specifications (Hardware as Foreign Key)
    console.log('\n⚙️ Ensuring Hardware Specifications (Hardware as Foreign Key)...');
    await HardwareSpec.deleteMany({});
    const seededSpecs = await HardwareSpec.insertMany([
        // IFP Specs
        {
            name: '75" 4K UHD Anti-Glare, 400 nits, 4GB/32GB Android 13, Dual Stylus',
            code: 'IFP_75_STD',
            hardwareId: hwIFP._id,
            hardwareKey: 'IFP_75',
            description: 'Standard Classroom 75" 4K UHD with 20-point multi-touch, front audio and Android 13',
            index: 1,
            isActive: true,
        },
        {
            name: '75" 4K UHD Optical Bonding, 450 nits, 8GB/128GB Android 14, 48MP AI Camera',
            code: 'IFP_75_PRO',
            hardwareId: hwIFP._id,
            hardwareKey: 'IFP_75',
            description: 'Pro Edition with Optical Bonding, 8-array microphone, integrated 48MP 4K camera',
            index: 2,
            isActive: true,
        },
        {
            name: '75" 4K UHD Antibacterial Zero-Gap Touch Panel, 4GB/64GB Android 13',
            code: 'IFP_75_ED',
            hardwareId: hwIFP._id,
            hardwareKey: 'IFP_75',
            description: 'Special Ed edition with certified antimicrobial glass surface and eye-care low blue light',
            index: 3,
            isActive: true,
        },

        // OPS PC Specs
        {
            name: 'OPS Intel Core i5 11th Gen, 16GB DDR4, 512GB NVMe M.2 SSD, Win 11 Pro',
            code: 'OPS_I5_11TH',
            hardwareId: hwOPS._id,
            hardwareKey: 'OPS_I5',
            description: 'Dedicated OPS compute module for IFP slot, Intel UHD Graphics, Dual 4K display output',
            index: 1,
            isActive: true,
        },
        {
            name: 'OPS Intel Core i7 12th Gen, 16GB DDR4, 1TB NVMe SSD, Intel Iris Xe, Win 11 Pro',
            code: 'OPS_I7_12TH',
            hardwareId: hwOPS._id,
            hardwareKey: 'OPS_I5',
            description: 'High-performance OPS compute module with Iris Xe graphics for STEM 3D simulations',
            index: 2,
            isActive: true,
        },
        {
            name: 'OPS Intel Core i3 10th Gen, 8GB DDR4, 256GB SSD, Win 11 Home',
            code: 'OPS_I3_10TH',
            hardwareId: hwOPS._id,
            hardwareKey: 'OPS_I5',
            description: 'Entry level OPS compute module for primary multimedia classrooms',
            index: 3,
            isActive: true,
        },

        // Pendrive Specs
        {
            name: '64GB USB 3.2 Gen 1 Metal Key, 150MB/s Read, Complete State Board K-12 Dump',
            code: 'USB_64_MET',
            hardwareId: hwPendrive._id,
            hardwareKey: 'PENDRIVE_64',
            description: 'High durability aluminum zinc body USB 3.2 with verified checksum offline curriculum',
            index: 1,
            isActive: true,
        },
        {
            name: '128GB USB 3.2 Type-A/Type-C Dual Drive, Full Bilingual Audio-Visual Dump',
            code: 'USB_128_DUAL',
            hardwareId: hwPendrive._id,
            hardwareKey: 'PENDRIVE_64',
            description: 'Dual interface OTG drive for direct connection to Android IFP panels and Windows OPS',
            index: 2,
            isActive: true,
        },

        // Wall Mount Specs
        {
            name: 'Cold-Rolled Steel Heavy-Duty Fixed Wall Bracket (65"-86", VESA 800x600, Max 120kg)',
            code: 'WM_FIX_HEAVY',
            hardwareId: hwMount._id,
            hardwareKey: 'WALL_MOUNT',
            description: 'Industrial grade 2.5mm steel fixed mount with anti-drop safety lock and masonry anchors',
            index: 1,
            isActive: true,
        },
        {
            name: 'Heavy Duty Mobile Trolley Stand with Castor Brakes & Integrated Camera Tray',
            code: 'WM_TROLLEY_MOB',
            hardwareId: hwMount._id,
            hardwareKey: 'WALL_MOUNT',
            description: 'Portable heavy duty IFP stand with 4 lockable castors and adjustable height shelf',
            index: 2,
            isActive: true,
        },
    ]);
    console.log(`  ✅ ${seededSpecs.length} Hardware Specifications created with Hardware Foreign Keys.`);

    // 4b. Ensure Curriculum Grades (with 11 & 12 streams combined directly)
    console.log('\nðŸ“š Ensuring Curriculum Grades (with embedded 11 & 12 Streams)...');
    await Grade.deleteMany({});
    const gradeList = [
        { name: '1', id: 'c1', grade: '1', stream: null, category: 'Primary', index: 1, color: '#3B82F6', icon: 'BookOpen' },
        { name: '2', id: 'c2', grade: '2', stream: null, category: 'Primary', index: 2, color: '#3B82F6', icon: 'BookOpen' },
        { name: '3', id: 'c3', grade: '3', stream: null, category: 'Primary', index: 3, color: '#3B82F6', icon: 'BookOpen' },
        { name: '4', id: 'c4', grade: '4', stream: null, category: 'Primary', index: 4, color: '#3B82F6', icon: 'BookOpen' },
        { name: '5', id: 'c5', grade: '5', stream: null, category: 'Primary', index: 5, color: '#3B82F6', icon: 'BookOpen' },
        { name: '6', id: 'c6', grade: '6', stream: null, category: 'Middle', index: 6, color: '#10B981', icon: 'Compass' },
        { name: '7', id: 'c7', grade: '7', stream: null, category: 'Middle', index: 7, color: '#10B981', icon: 'Compass' },
        { name: '8', id: 'c8', grade: '8', stream: null, category: 'Middle', index: 8, color: '#10B981', icon: 'Compass' },
        { name: '9', id: 'c9', grade: '9', stream: null, category: 'Secondary', index: 9, color: '#F59E0B', icon: 'GraduationCap' },
        { name: '10', id: 'c10', grade: '10', stream: null, category: 'Secondary', index: 10, color: '#F59E0B', icon: 'GraduationCap' },
        // Class 11 Streams
        { name: '11 Science', id: 'c11_science', grade: '11', stream: 'Science', category: 'Senior Secondary', index: 11, color: '#8B5CF6', icon: 'FlaskConical' },
        { name: '11 Commerce', id: 'c11_commerce', grade: '11', stream: 'Commerce', category: 'Senior Secondary', index: 12, color: '#EC4899', icon: 'TrendingUp' },
        { name: '11 Arts', id: 'c11_arts', grade: '11', stream: 'Arts', category: 'Senior Secondary', index: 13, color: '#6366F1', icon: 'Palette' },
        // Class 12 Streams
        { name: '12 Science', id: 'c12_science', grade: '12', stream: 'Science', category: 'Senior Secondary', index: 14, color: '#8B5CF6', icon: 'FlaskConical' },
        { name: '12 Commerce', id: 'c12_commerce', grade: '12', stream: 'Commerce', category: 'Senior Secondary', index: 15, color: '#EC4899', icon: 'TrendingUp' },
        { name: '12 Arts', id: 'c12_arts', grade: '12', stream: 'Arts', category: 'Senior Secondary', index: 16, color: '#6366F1', icon: 'Palette' },
    ];
    await Grade.insertMany(gradeList);
    console.log(`  âœ… 16 Curriculum Grades (Grades 1-10 + 11 & 12 Streams) ready.`);

    // 5. Define 6 Real Projects
    // The user asked: "3 kisi bhi projects ki timeline complete krdo"
    // Projects 1, 2, and 5 will be 100% COMPLETELY COMPLETED.
    // Projects 3, 4, and 6 will have realistic in-progress progression.
    // 5. Define 4 Real Projects from Core Backend
    // Project 1 (PRJ-ROBOTICS-AI-2026): 100% Fully Completed (8/8 Stages Completed)
    // Project 2 (PRJ-STEM-ROBOTICS-2026): 75% In Progress (6/8 Stages Completed, Stage 7 Training active)
    // Project 3 (PRJ-SMART-2026): 50% In Progress (4/8 Stages Completed, Stage 5 Testing active)
    // Project 4 (P1793013764468): 25% In Progress (2/8 Stages Completed, Stage 3 Order Requirement active)
    const projectDefinitions = [
        {
            coreMongoId: '6ae068ec20c692364d6c2c73',
            code: 'PRJ-ROBOTICS-AI-2026',
            title: 'AI, Robotics & Space Innovation Labs',
            org: 'DigiToppers Innovation & Space Foundation',
            state: 'Uttar Pradesh',
            district: 'Gautam Buddha Nagar',
            isFullyCompleted: true, // 100% COMPLETED PROJECT
            completedStagesCount: 8,
            pmEmp: empMap.empSoumay, // Soumay Garg
            members: [empMap.empRahul, empMap.empNeha, empMap.empShruti, empMap.empSandeep],
            schools: [
                { name: 'Kendriya Vidyalaya No. 1, Sector 30 Noida', district: 'Gautam Buddha Nagar', pin: '201301' },
                { name: 'Delhi Public School, Knowledge Park Greater Noida', district: 'Gautam Buddha Nagar', pin: '201310' }
            ]
        },
        {
            coreMongoId: '6ae044661f3aba518bcb271f',
            code: 'PRJ-STEM-ROBOTICS-2026',
            title: 'STEM Robotics & AI Lab Initiative 2026',
            org: 'Department of School Education, Haryana',
            state: 'Haryana',
            district: 'Gurugram',
            isFullyCompleted: false, // 75% IN PROGRESS (Stage 7 Training Active)
            completedStagesCount: 6,
            activeStageKey: 'TRAINING',
            pmEmp: empMap.empSandeep, // Sandeep Mudgal (CTO & Admin) -> Assigned to Me
            members: [empMap.empSoumay, empMap.empVikas, empMap.empPooja, empMap.empRohan],
            schools: [
                { name: 'Govt Model Senior Secondary School, Sector 4/7', district: 'Gurugram', pin: '122001' },
                { name: 'Govt Girls Senior Secondary School, Jacobpura', district: 'Gurugram', pin: '122001' }
            ]
        },
        {
            coreMongoId: '6ae0345a68c707ead8e38223',
            code: 'PRJ-SMART-2026',
            title: 'Smart Learning & STEM Initiative 2026',
            org: 'Directorate of Education, Delhi & NCR',
            state: 'Delhi',
            district: 'Central Delhi',
            isFullyCompleted: false, // 50% IN PROGRESS (Stage 5 Testing Active)
            completedStagesCount: 4,
            activeStageKey: 'TECH_AND_CONTENT_TESTING',
            pmEmp: empMap.empSoumay, // Soumay Garg
            members: [empMap.empRahul, empMap.empNeha, empMap.empKavita, empMap.empShruti, empMap.empSandeep],
            schools: [
                { name: 'Navyug School, Mandir Marg', district: 'New Delhi', pin: '110001' },
                { name: 'Composite Model School, Sector 12 Noida', district: 'Gautam Buddha Nagar', pin: '201301' }
            ]
        },
        {
            coreMongoId: '6adf38042d8f326f638e5be2',
            code: 'P1793013764468',
            altCode: 'p1793013764468',
            title: 'Project 26 Oct 1',
            org: 'Municipal Corporation Education Board',
            state: 'Delhi',
            district: 'East Delhi',
            isFullyCompleted: false, // 25% EARLY STAGE (Stage 3 Order Requirement Active)
            completedStagesCount: 2,
            activeStageKey: 'ORDER_REQUIREMENT',
            pmEmp: empMap.empSandeep, // Sandeep Mudgal (CTO & Admin) -> Assigned to Me
            members: [empMap.empVikas, empMap.empPooja, empMap.empRohan, empMap.empPawan],
            schools: [
                { name: 'Model English School, Gandhi Nagar Sector 10', district: 'East Delhi', pin: '110031' },
                { name: 'Sarvodaya Bal Vidyalaya, Gandhi Nagar', district: 'East Delhi', pin: '110031' },
                { name: 'St. Jude\'s Composite Academy, East Delhi', district: 'East Delhi', pin: '110092' },
                { name: 'Govt Boys Senior Secondary School No. 2', district: 'East Delhi', pin: '110051' },
                { name: 'Navodaya Vidyalaya Digital Wing', district: 'East Delhi', pin: '110032' }
            ]
        }
    ];

    // Stage sequence mapping for TimelineStage model (1 to 8)
    const timelineStageTemplates = [
        { stageNumber: 1, stageKey: 'LEAD', stageName: 'Lead Creation & Review' },
        { stageNumber: 2, stageKey: 'HANDOVER', stageName: 'PO, PI & Tax Invoice' },
        { stageNumber: 3, stageKey: 'PROCUREMENT', stageName: 'Order Requirement & School Data' },
        { stageNumber: 4, stageKey: 'TECH_CONTENT', stageName: 'Hardware, Tech & Content Execution' },
        { stageNumber: 5, stageKey: 'DISPATCH', stageName: 'Tech & Content QA Testing' },
        { stageNumber: 6, stageKey: 'INSTALLATION', stageName: 'School-wise Hardware Installation' },
        { stageNumber: 7, stageKey: 'TRAINING', stageName: 'Teacher Training & Capacity Building' },
        { stageNumber: 8, stageKey: 'CLOSURE', stageName: 'Project Closure & Final Handover' }
    ];

    console.log('\n🧹 Refreshing Project, School, Timeline, License, and Hardware Allocation records...');
    await Project.deleteMany({});
    await ProjectMember.deleteMany({});
    await School.deleteMany({});
    await ProjectSchools.deleteMany({});
    await Requirement.deleteMany({});
    await Timeline.deleteMany({});
    await TimelineNode.deleteMany({});
    await Activity.deleteMany({});
    await Notification.deleteMany({});
    await SchoolHardwareLicense.deleteMany({});
    await License.deleteMany({});

    console.log('\n========================================================================');
    console.log('ðŸŒ± SEEDING ALL 6 PROJECTS (3 100% COMPLETED + 3 IN-PROGRESS)');
    console.log('========================================================================\n');

    for (const def of projectDefinitions) {
        const isDone = def.isFullyCompleted;
        const projectContractBudget = def.schools.length * 125000;
        const paidAmount = isDone ? projectContractBudget : Math.floor(projectContractBudget * 0.5);

        console.log(`\n------------------------------------------------------------------------`);
        console.log(`ðŸŽ¯ Setting up Project [${def.code}]: ${def.title}`);
        console.log(`   Status: ${isDone ? 'ðŸ† 100% FULLY COMPLETED' : `â³ IN PROGRESS (Stage ${def.completedStagesCount} Done)`}`);

        // A. Ensure Project in MongoDB with Exact Core Mongo ObjectId
        const projectMongoId = new mongoose.Types.ObjectId(def.coreMongoId);
        const project = {
            _id: projectMongoId,
            projectId: def.code,
            projectName: def.title,
            state: def.state,
            district: def.district,
            address: `${def.district}, ${def.state}`,
            email: `pmo.${def.code.toLowerCase()}@digitoppers.com`,
            phone: '+91 98110 01101',
            numberOfSchools: def.schools.length,
            numberOfLicenses: def.schools.length * 2,
            budget: projectContractBudget,
            status: isDone ? 'COMPLETED' : 'ACTIVE',
            projectManager: def.pmEmp._id,
            startDate: new Date('2026-02-01'),
            targetCompletionDate: isDone ? new Date('2026-03-31') : new Date('2026-06-30'),
            clientPoAndPi: {
                purchaseOrders: [
                    {
                        poNumber: `PO-${def.code}-2026-01`,
                        poDate: new Date('2026-02-05'),
                        poDocumentUrl: `https://s3.digitoppers.com/pos/${def.code}_po.pdf`,
                        issuingOrganization: def.org,
                        poAmount: projectContractBudget,
                        remarks: 'Main Client PO for Multi-School Digitization',
                        submittedBy: def.pmEmp._id
                    }
                ],
                proformaInvoices: [
                    {
                        piNumber: `PI-${def.code}-2026-01`,
                        piDate: new Date('2026-02-10'),
                        piDocumentUrl: `https://s3.digitoppers.com/invoices/${def.code}_pi.pdf`,
                        ewayBillNumber: `EWB-${def.code}-998811`,
                        amount: projectContractBudget,
                        paymentStatus: isDone ? 'PAID' : 'PARTIALLY_PAID',
                        paymentReferenceUTR: isDone ? 'UTR-HDFC-998822' : 'UTR-HDFC-PART-11',
                        remarks: 'Client Advance Proforma Invoice (Finance Layer 1)',
                        submittedBy: def.pmEmp._id
                    }
                ]
            }
        };

        await mongoose.connection.collection('projects').updateOne(
            { _id: projectMongoId },
            { $set: project },
            { upsert: true }
        );
        if (def.altCode) {
            await mongoose.connection.collection('projects').updateOne(
                { projectId: def.altCode },
                { $set: { ...project, projectId: def.code } }
            );
        }

        // B. Assign Team Members
        const memberDocs = [
            {
                projectId: def.code,
                project: projectMongoId,
                employee: def.pmEmp._id,
                departmentCode: 'OPS',
                designation: 'PROJECT_MANAGER',
                projectRole: 'PROJECT_MANAGER',
                isDepartmentLead: true,
                assignedBy: empMap.empPawan._id,
                isActive: true
            },
            ...def.members.map(emp => ({
                projectId: def.code,
                project: projectMongoId,
                employee: emp._id,
                departmentCode: emp.designation?.includes('Engineer') ? 'OPS' : (emp.designation?.includes('Trainer') ? 'CONTENT' : 'TECH'),
                designation: 'CONTRIBUTOR',
                projectRole: emp.designation || 'CONTRIBUTOR',
                isDepartmentLead: false,
                assignedBy: def.pmEmp._id,
                isActive: true
            }))
        ];
        const uniqueMemberDocs = [];
        const seenEmpIds = new Set();
        for (const m of memberDocs) {
            const empIdStr = String(m.employee);
            if (!seenEmpIds.has(empIdStr)) {
                seenEmpIds.add(empIdStr);
                uniqueMemberDocs.push(m);
            }
        }
        await ProjectMember.insertMany(uniqueMemberDocs);

        // C. Populate Schools
        const schoolDocs = def.schools.map((s, idx) => {
            const survey = createDetailedSchoolSurvey(s.name, s.district, def.state, s.pin, idx);
            const isSchoolInstalled = isDone || (def.completedStagesCount >= 6 && idx === 0);
            const isSchoolTrained = isDone || (def.completedStagesCount >= 7 && idx === 0);
            const isSchoolClosed = isDone;

            return {
                projectId: def.code,
                project: project._id,
                schoolId: `${def.code}-SCH-${String(idx + 1).padStart(3, '0')}`,
                schoolBranch: 'Main Campus',
                order: idx + 1,
                name: s.name,
                district: s.district,
                state: def.state,
                address: `${s.name}, Sector ${10 + idx * 4}, ${s.district}, ${def.state} - ${s.pin}`,
                contactPerson: {
                    name: survey.principalName,
                    phone: survey.pocContact.split('|')[1]?.replace(/[^0-9]/g, '').slice(0, 10) || '9811002233',
                    email: survey.pocContact.split('|')[2]?.trim() || 'principal@gov.edu.in',
                    designation: 'Principal'
                },
                survey,
                solutions: [
                    {
                        solutionId: solutions[0]._id,
                        solutionKey: 'SMART_CLASSROOM',
                        name: 'Smart Shaala 4K Interactive Lab',
                        customLabName: 'Smart Shaala Setup',
                        quantity: 1,
                        grades: ['6', '7', '8', '9', '10', '11', '12'],
                        streams: ['Science', 'Commerce', 'Humanities'],
                        customApkUrl: `https://s3.digitoppers.com/apks/${def.code}_v2.4.apk`,
                        osImageVersion: 'DigiOS-v2.4.1',
                        lmsVersion: 'DigiLMS-2026',
                        status: isDone ? 'DEPLOYED' : 'CONFIGURED'
                    }
                ],
                hardware: [
                    {
                        hardwareId: hwIFP._id,
                        hardwareKey: 'IFP_75',
                        itemName: '75" 4K UHD Interactive Flat Panel',
                        allocatedQuantity: 1,
                        deliveredQuantity: 1,
                        isReceived: true,
                        readyForInstallation: 'YES',
                        serialNumbers: [`SN-IFP-${def.code}-${idx + 1}`],
                        dispatchCourier: 'Delhivery Surface Express',
                        trackingNumber: `TRK-IFP-${def.code}-${idx + 1}`,
                        deliveryStatus: 'DELIVERED'
                    },
                    {
                        hardwareId: hwOPS._id,
                        hardwareKey: 'OPS_I5',
                        itemName: 'OPS Windows 11 Pro i5 16GB/512GB PC',
                        allocatedQuantity: 1,
                        deliveredQuantity: 1,
                        isReceived: true,
                        readyForInstallation: 'YES',
                        serialNumbers: [`SN-OPS-${def.code}-${idx + 1}`],
                        dispatchCourier: 'Delhivery Surface Express',
                        trackingNumber: `TRK-OPS-${def.code}-${idx + 1}`,
                        deliveryStatus: 'DELIVERED'
                    },
                    {
                        hardwareId: hwPendrive._id,
                        hardwareKey: 'PENDRIVE_64',
                        itemName: 'High-Speed 64GB USB 3.2 Offline Curriculum Key',
                        allocatedQuantity: 2,
                        deliveredQuantity: 2,
                        isReceived: true,
                        readyForInstallation: 'YES',
                        serialNumbers: [`SN-PD-${def.code}-A${idx + 1}`, `SN-PD-${def.code}-B${idx + 1}`],
                        dispatchCourier: 'Delhivery Surface Express',
                        trackingNumber: `TRK-PD-${def.code}-${idx + 1}`,
                        deliveryStatus: 'DELIVERED'
                    },
                    {
                        hardwareId: hwMount._id,
                        hardwareKey: 'WALL_MOUNT',
                        itemName: 'Heavy Duty Wall Mount Bracket & Fasteners',
                        allocatedQuantity: 1,
                        deliveredQuantity: 1,
                        isReceived: true,
                        readyForInstallation: 'YES',
                        serialNumbers: [],
                        dispatchCourier: 'Delhivery Surface Express',
                        trackingNumber: `TRK-MT-${def.code}-${idx + 1}`,
                        deliveryStatus: 'DELIVERED'
                    }
                ],
                installation: {
                    status: isSchoolInstalled ? 'COMPLETED' : 'PENDING',
                    assignedEngineerId: empMap.empRahul._id,
                    scheduledDate: new Date('2026-03-12'),
                    completedDate: isSchoolInstalled ? new Date('2026-03-14T17:00:00.000Z') : null,
                    completionPhotos: [
                        'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80'
                    ],
                    signedChallanUrl: isSchoolInstalled ? `https://s3.digitoppers.com/challans/${def.code}_sch${idx + 1}.pdf` : '',
                    remarks: isSchoolInstalled ? 'IFP mounted securely, OPS booted, audio tested.' : 'Installation scheduled.'
                },
                training: {
                    status: isSchoolTrained ? 'COMPLETED' : 'PENDING',
                    assignedTrainerId: empMap.empNeha._id,
                    trainingDate: isSchoolTrained ? new Date('2026-03-18') : new Date('2026-03-25'),
                    trainingMode: 'OFFLINE',
                    teachersTrainedCount: isSchoolTrained ? 22 : 0,
                    attendanceSheetUrl: isSchoolTrained ? `https://s3.digitoppers.com/training/${def.code}_sch${idx + 1}.pdf` : '',
                    feedbackRating: isSchoolTrained ? 5 : null,
                    remarks: isSchoolTrained ? 'Teachers trained on DigiLMS & Interactive tools.' : 'Training pending.'
                },
                closure: {
                    status: isSchoolClosed ? 'COMPLETED' : 'PENDING',
                    signOffDate: isSchoolClosed ? new Date('2026-03-28') : null,
                    signOffDocumentUrl: isSchoolClosed ? `https://s3.digitoppers.com/signoffs/${def.code}_sch${idx + 1}.pdf` : '',
                    warrantyYears: 3,
                    remarks: isSchoolClosed ? '3-Year AMC active. All deliverables handed over.' : 'Closure pending.'
                }
            };
        });
        const createdSchools = await School.insertMany(schoolDocs);
        console.log(`   ðŸ« Created ${createdSchools.length} 360Â° School Documents.`);

        // C2. Canonical ProjectSchools Aggregator (1:1 with Project)
        const canonicalSchoolDeployments = createdSchools.map((s, idx) => {
            const isSchoolInstalled = isDone || (def.completedStagesCount >= 6 && idx === 0);
            const isSchoolTrained = isDone || (def.completedStagesCount >= 7 && idx === 0);
            const isSchoolDelivered = isDone || (def.completedStagesCount >= 5);

            const schoolHwItems = [
                {
                    hardwareKey: 'IFP_75',
                    itemName: '75" 4K UHD Interactive Flat Panel',
                    quantity: 1,
                    solutionName: 'Smart Shaala 4K Interactive Lab',
                    stockCheck: {
                        requiredQty: 1,
                        inStockQty: 1,
                        purchaseQty: 0,
                        stockStatus: 'IN_STOCK',
                        verifiedBy: empMap.empRahul._id,
                        verifiedAt: new Date('2026-02-18'),
                        remarks: 'Verified stock in regional warehouse'
                    },
                    poAndPi: {
                        vendorName: 'Maxhub India Pvt Ltd',
                        paymentStatus: isDone || def.completedStagesCount >= 4 ? 'PAID' : 'PENDING',
                        purchaseOrders: [
                            {
                                poNumber: `VPO-${def.code}-IFP-${idx + 1}`,
                                poDate: new Date('2026-02-20'),
                                poDocumentUrl: `https://s3.digitoppers.com/vpo/${def.code}_ifp_${idx + 1}.pdf`,
                                issuingOrganization: 'Digitoppers EdTech Pvt Ltd',
                                poAmount: 75000,
                                submittedByDept: 'OPS',
                                submittedBy: empMap.empRahul._id,
                                remarks: 'Procurement PO for IFP display'
                            }
                        ],
                        proformaInvoices: [
                            {
                                piNumber: `VPI-${def.code}-IFP-${idx + 1}`,
                                piDate: new Date('2026-02-22'),
                                ewayBillNumber: `EWB-VEND-${idx + 1}-9922`,
                                paymentStatus: isDone || def.completedStagesCount >= 4 ? 'PAID' : 'PENDING',
                                piDocumentUrl: `https://s3.digitoppers.com/vpi/${def.code}_ifp_${idx + 1}.pdf`,
                                paymentReferenceUTR: 'HDFC-UTR-88991122',
                                approvedByDept: 'FIN',
                                approvedBy: empMap.empSoumay._id,
                                remarks: '100% advance cleared by finance'
                            }
                        ]
                    },
                    consignmentTracking: {
                        courierName: 'Delhivery Surface Express',
                        trackingNumber: `TRK-IFP-${def.code}-${idx + 1}`,
                        dispatchDate: new Date('2026-02-25'),
                        expectedDeliveryDate: new Date('2026-03-02'),
                        actualDeliveryDate: isSchoolDelivered ? new Date('2026-03-01') : null,
                        deliveryStatus: isSchoolDelivered ? 'DELIVERED' : 'IN_TRANSIT',
                        proofOfDeliveryUrl: isSchoolDelivered ? `https://s3.digitoppers.com/pod/${def.code}_ifp_${idx + 1}.pdf` : ''
                    },
                    hardwareReady: {
                        received: isSchoolDelivered,
                        receivedQty: isSchoolDelivered ? 1 : 0,
                        damagedItems: 'None',
                        readyForInstallation: isSchoolDelivered ? 'YES' : 'PENDING',
                        deliveryDate: isSchoolDelivered ? new Date('2026-03-01') : null
                    }
                },
                {
                    hardwareKey: 'OPS_I5',
                    itemName: 'OPS Windows 11 Pro i5 16GB/512GB PC',
                    quantity: 1,
                    solutionName: 'Smart Shaala 4K Interactive Lab',
                    stockCheck: {
                        requiredQty: 1,
                        inStockQty: 1,
                        purchaseQty: 0,
                        stockStatus: 'IN_STOCK',
                        verifiedBy: empMap.empRahul._id,
                        verifiedAt: new Date('2026-02-18'),
                        remarks: 'In stock'
                    },
                    poAndPi: {
                        vendorName: 'Dell Commercial Solutions',
                        paymentStatus: isDone || def.completedStagesCount >= 4 ? 'PAID' : 'PENDING',
                        purchaseOrders: [
                            {
                                poNumber: `VPO-${def.code}-OPS-${idx + 1}`,
                                poDate: new Date('2026-02-20'),
                                poDocumentUrl: `https://s3.digitoppers.com/vpo/${def.code}_ops_${idx + 1}.pdf`,
                                issuingOrganization: 'Digitoppers EdTech Pvt Ltd',
                                poAmount: 35000,
                                submittedByDept: 'OPS',
                                submittedBy: empMap.empRahul._id,
                                remarks: 'i5 computing module'
                            }
                        ],
                        proformaInvoices: [
                            {
                                piNumber: `VPI-${def.code}-OPS-${idx + 1}`,
                                piDate: new Date('2026-02-22'),
                                ewayBillNumber: `EWB-VEND-${idx + 1}-3344`,
                                paymentStatus: isDone || def.completedStagesCount >= 4 ? 'PAID' : 'PENDING',
                                piDocumentUrl: `https://s3.digitoppers.com/vpi/${def.code}_ops_${idx + 1}.pdf`,
                                paymentReferenceUTR: 'HDFC-UTR-55443322',
                                approvedByDept: 'FIN',
                                approvedBy: empMap.empSoumay._id,
                                remarks: 'Payment cleared'
                            }
                        ]
                    },
                    consignmentTracking: {
                        courierName: 'Delhivery Surface Express',
                        trackingNumber: `TRK-OPS-${def.code}-${idx + 1}`,
                        dispatchDate: new Date('2026-02-25'),
                        expectedDeliveryDate: new Date('2026-03-02'),
                        actualDeliveryDate: isSchoolDelivered ? new Date('2026-03-01') : null,
                        deliveryStatus: isSchoolDelivered ? 'DELIVERED' : 'IN_TRANSIT',
                        proofOfDeliveryUrl: isSchoolDelivered ? `https://s3.digitoppers.com/pod/${def.code}_ops_${idx + 1}.pdf` : ''
                    },
                    hardwareReady: {
                        received: isSchoolDelivered,
                        receivedQty: isSchoolDelivered ? 1 : 0,
                        damagedItems: 'None',
                        readyForInstallation: isSchoolDelivered ? 'YES' : 'PENDING',
                        deliveryDate: isSchoolDelivered ? new Date('2026-03-01') : null
                    }
                }
            ];

            return {
                school: s._id,
                schoolId: s.schoolCode || `SCH-${idx + 1}`,
                schoolName: s.name,
                deploymentStatus: isSchoolInstalled ? 'COMPLETED' : (isSchoolDelivered ? 'INSTALLING' : (def.completedStagesCount >= 4 ? 'IN_TRANSIT' : 'SURVEY_PENDING')),
                siteSurvey: {
                    roomReady: true,
                    powerBackupAvailable: true,
                    networkAvailable: true,
                    classroomDimension: '24ft x 30ft',
                    surveyNotes: 'Classroom verified with 3-phase power and secure wall.',
                    surveyDate: new Date('2026-02-15'),
                    surveyor: empMap.empRahul._id
                },
                solutions: [
                    { solutionKey: 'SMART_SHAALA', solutionName: 'Smart Shaala 4K Interactive Lab', quantity: 1 }
                ],
                hardware: schoolHwItems,
                installation: {
                    status: isSchoolInstalled ? 'COMPLETED' : (def.completedStagesCount >= 6 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                    assignedEngineer: empMap.empRahul._id,
                    startedAt: new Date('2026-03-12'),
                    completedAt: isSchoolInstalled ? new Date('2026-03-14T17:00:00.000Z') : null,
                    signOffDocumentUrl: isSchoolInstalled ? `https://s3.digitoppers.com/challans/${def.code}_sch${idx + 1}.pdf` : '',
                    remarks: isSchoolInstalled ? 'Wall mounted, OPS configured and tested.' : 'Pending physical installation.'
                },
                training: {
                    status: isSchoolTrained ? 'COMPLETED' : (def.completedStagesCount >= 7 ? 'SCHEDULED' : 'NOT_STARTED'),
                    trainer: empMap.empNeha._id,
                    trainingDate: isSchoolTrained ? new Date('2026-03-18') : new Date('2026-03-25'),
                    teachersAttended: isSchoolTrained ? 22 : 0,
                    attendanceSheetUrl: isSchoolTrained ? `https://s3.digitoppers.com/training/${def.code}_sch${idx + 1}.pdf` : '',
                    feedbackRating: isSchoolTrained ? 5 : null
                }
            };
        });

        await ProjectSchools.create({
            project: project._id,
            projectId: def.code,
            projectName: def.title,
            orderRequirement: {
                solutionsSelected: [
                    { solutionKey: 'SMART_SHAALA', solutionName: 'Smart Shaala 4K Interactive Lab' },
                    { solutionKey: 'STEM_LAB', solutionName: 'STEM Innovation Lab' }
                ],
                totalSchoolsEnrolled: createdSchools.length,
                overallHardwareBOM: {
                    IFP_75: createdSchools.length,
                    OPS_I5: createdSchools.length,
                    PENDRIVE_64: createdSchools.length * 2,
                    WALL_MOUNT: createdSchools.length
                },
                submittedBy: empMap.empSoumay._id,
                submittedAt: new Date('2026-02-08')
            },
            schools: canonicalSchoolDeployments
        });
        console.log(`   ðŸ›ï¸ Created Canonical ProjectSchools Document with ${canonicalSchoolDeployments.length} School Deployments.`);
        // C3. Seed Master School Hardware Licenses with Hardware & Specs Foreign Keys
        for (let sIdx = 0; sIdx < createdSchools.length; sIdx++) {
            const sch = createdSchools[sIdx];
            const schCode = (sch.schoolCode || `SCH${100 + sIdx + 1}`).replace(/[^0-9A-Za-z]/g, '').slice(-6);

            const itemsToSeed = [
                { hw: hwIFP, count: 1 },
                { hw: hwOPS, count: 1 },
                { hw: hwPendrive, count: 2 },
                { hw: hwMount, count: 1 },
            ];

            for (const item of itemsToSeed) {
                const specsForHw = seededSpecs.filter(
                    (sp) => String(sp.hardwareId) === String(item.hw._id)
                );

                for (let u = 1; u <= item.count; u++) {
                    const unitStr = String(u).padStart(2, '0');
                    const cleanKey = item.hw.key.slice(0, 8);
                    const licenseKey = `LIC-${def.code.slice(0, 6)}-${schCode}-${cleanKey}-${unitStr}`;
                    const assignedSpec = specsForHw[(u - 1) % (specsForHw.length || 1)] || specsForHw[0];

                    const isRegistered = isDone || (def.completedStagesCount >= 6 && sIdx === 0);
                    const serialNo = `SN-${item.hw.key}-${schCode}-${unitStr}`;

                    // Standalone License document
                    const licDoc = await License.create({
                        licenseKey,
                        status: isRegistered ? 'registered' : 'active',
                        isRegistered,
                        registeredAt: isRegistered ? new Date('2026-03-15') : null,
                        registeredTo: isRegistered ? serialNo : null,
                        schoolId: sch._id,
                        projectId: project._id,
                    });

                    // SchoolHardwareLicense junction relation
                    await SchoolHardwareLicense.create({
                        projectId: project._id,
                        schoolId: sch._id,
                        schoolName: sch.name,
                        hardwareId: item.hw._id,
                        hardwareKey: item.hw.key,
                        hardwareName: item.hw.label || item.hw.name,
                        specId: assignedSpec ? assignedSpec._id : null,
                        specName: assignedSpec ? assignedSpec.name : '',
                        specKey: assignedSpec ? assignedSpec.code : '',
                        unitIndex: u,
                        licenseId: licDoc._id,
                        licenseKey,
                        status: isRegistered ? 'REGISTERED' : 'ALLOCATED',
                        isRegistered,
                        registeredAt: isRegistered ? new Date('2026-03-15') : null,
                        registeredTo: isRegistered ? serialNo : '',
                        allocatedAt: new Date('2026-02-10'),
                        remarks: assignedSpec ? assignedSpec.description : 'Standard hardware allocation',
                    });
                }
            }
        }
        console.log(`   🔑 Created School Hardware Licenses with Hardware & Spec Foreign Keys for ${createdSchools.length} schools.`);

        // Canonical 7 Stages state machine matching spec Section 7
        const canonicalStages = [
            {
                stageKey: 'STAGE_01_KICKOFF',
                stageName: 'Project Kickoff & Review',
                stageNumber: 1,
                order: 1,
                primaryDepartment: 'OPS',
                status: isDone || def.completedStagesCount >= 1 ? 'COMPLETED' : 'IN_PROGRESS',
                tasks: [
                    {
                        taskKey: 'CONTRACT_REVIEW',
                        taskName: 'Commercial Contract & Scope Sign-off',
                        order: 1,
                        departmentCode: 'OPS',
                        assignedTo: empMap.empSoumay._id,
                        scope: 'PROJECT_LEVEL',
                        isParallel: false,
                        dependsOn: [],
                        status: isDone || def.completedStagesCount >= 1 ? 'COMPLETED' : 'IN_PROGRESS',
                        completedAt: new Date('2026-02-02'),
                        completedBy: empMap.empSoumay._id
                    }
                ]
            },
            {
                stageKey: 'STAGE_02_CLIENT_PO',
                stageName: 'Client PO & Advance PI',
                stageNumber: 2,
                order: 2,
                primaryDepartment: 'FIN',
                status: isDone || def.completedStagesCount >= 2 ? 'COMPLETED' : (def.completedStagesCount === 1 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                tasks: [
                    {
                        taskKey: 'CLIENT_PO_UPLOAD',
                        taskName: 'Client Purchase Order Verification',
                        order: 1,
                        departmentCode: 'FIN',
                        assignedTo: empMap.empSoumay._id,
                        scope: 'PROJECT_LEVEL',
                        isParallel: false,
                        dependsOn: ['CONTRACT_REVIEW'],
                        status: isDone || def.completedStagesCount >= 2 ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-02-06'),
                        completedBy: empMap.empSoumay._id
                    },
                    {
                        taskKey: 'ADVANCE_PI_RAISE',
                        taskName: 'Issue Client Advance Proforma Invoice',
                        order: 2,
                        departmentCode: 'FIN',
                        assignedTo: empMap.empSoumay._id,
                        scope: 'PROJECT_LEVEL',
                        isParallel: false,
                        dependsOn: ['CLIENT_PO_UPLOAD'],
                        status: isDone || def.completedStagesCount >= 2 ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-02-10'),
                        completedBy: empMap.empSoumay._id
                    }
                ]
            },
            {
                stageKey: 'STAGE_03_ORDER_REQ',
                stageName: 'Requirements & School BOM',
                stageNumber: 3,
                order: 3,
                primaryDepartment: 'OPS',
                status: isDone || def.completedStagesCount >= 3 ? 'COMPLETED' : (def.completedStagesCount === 2 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                tasks: [
                    {
                        taskKey: 'SCHOOL_SURVEY',
                        taskName: 'School Infrastructure & Site Survey',
                        order: 1,
                        departmentCode: 'OPS',
                        assignedTo: empMap.empRahul._id,
                        scope: 'SCHOOL_LEVEL',
                        schoolProgressSummary: {
                            totalSchools: def.schools.length,
                            completedSchools: isDone || def.completedStagesCount >= 3 ? def.schools.length : 1,
                            progressText: `${isDone || def.completedStagesCount >= 3 ? def.schools.length : 1}/${def.schools.length} Schools Surveyed`
                        },
                        isParallel: true,
                        dependsOn: ['ADVANCE_PI_RAISE'],
                        status: isDone || def.completedStagesCount >= 3 ? 'COMPLETED' : (def.completedStagesCount === 2 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                        completedAt: new Date('2026-02-18'),
                        completedBy: empMap.empRahul._id
                    },
                    {
                        taskKey: 'BOM_FINALIZATION',
                        taskName: 'Solution & Hardware BOM Allocation',
                        order: 2,
                        departmentCode: 'TECH',
                        assignedTo: empMap.empShruti._id,
                        scope: 'PROJECT_LEVEL',
                        isParallel: true,
                        dependsOn: ['SCHOOL_SURVEY'],
                        status: isDone || def.completedStagesCount >= 3 ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-02-20'),
                        completedBy: empMap.empShruti._id
                    }
                ]
            },
            {
                stageKey: 'STAGE_04_EXECUTION',
                stageName: 'Hardware Execution & Dispatch',
                stageNumber: 4,
                order: 4,
                primaryDepartment: 'OPS',
                status: isDone || def.completedStagesCount >= 4 ? 'COMPLETED' : (def.completedStagesCount === 3 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                tasks: [
                    {
                        taskKey: 'STOCK_CHECK',
                        taskName: 'Warehouse Stock Availability Verification',
                        order: 1,
                        departmentCode: 'OPS',
                        assignedTo: empMap.empRahul._id,
                        scope: 'SCHOOL_LEVEL',
                        isParallel: true,
                        dependsOn: ['BOM_FINALIZATION'],
                        status: isDone || def.completedStagesCount >= 4 ? 'COMPLETED' : (def.completedStagesCount === 3 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                        completedAt: new Date('2026-02-22'),
                        completedBy: empMap.empRahul._id
                    },
                    {
                        taskKey: 'VENDOR_PO_ISSUE',
                        taskName: 'Issue Vendor Purchase Orders',
                        order: 2,
                        departmentCode: 'OPS',
                        assignedTo: empMap.empRahul._id,
                        scope: 'PROJECT_LEVEL',
                        isParallel: false,
                        dependsOn: ['STOCK_CHECK'],
                        status: isDone || def.completedStagesCount >= 4 ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-02-24'),
                        completedBy: empMap.empRahul._id
                    },
                    {
                        taskKey: 'VENDOR_PI_PAYMENT',
                        taskName: 'Clear Vendor Proforma Invoice Payments',
                        order: 3,
                        departmentCode: 'FIN',
                        assignedTo: empMap.empSoumay._id,
                        scope: 'PROJECT_LEVEL',
                        isParallel: false,
                        dependsOn: ['VENDOR_PO_ISSUE'],
                        status: isDone || def.completedStagesCount >= 4 ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-02-26'),
                        completedBy: empMap.empSoumay._id
                    },
                    {
                        taskKey: 'COURIER_DISPATCH',
                        taskName: 'Dispatch Consignments to Schools',
                        order: 4,
                        departmentCode: 'OPS',
                        assignedTo: empMap.empRahul._id,
                        scope: 'SCHOOL_LEVEL',
                        isParallel: true,
                        dependsOn: ['VENDOR_PI_PAYMENT'],
                        status: isDone || def.completedStagesCount >= 4 ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-03-01'),
                        completedBy: empMap.empRahul._id
                    },
                    {
                        taskKey: 'GATE_RECEPTION',
                        taskName: 'School Reception & Readiness Verification',
                        order: 5,
                        departmentCode: 'OPS',
                        assignedTo: empMap.empRahul._id,
                        scope: 'SCHOOL_LEVEL',
                        isParallel: true,
                        dependsOn: ['COURIER_DISPATCH'],
                        status: isDone || def.completedStagesCount >= 4 ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-03-05'),
                        completedBy: empMap.empRahul._id
                    }
                ]
            },
            {
                stageKey: 'STAGE_05_INSTALLATION',
                stageName: 'Site Installation Sign-off',
                stageNumber: 5,
                order: 5,
                primaryDepartment: 'OPS',
                status: isDone || def.completedStagesCount >= 6 ? 'COMPLETED' : (def.completedStagesCount >= 4 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                tasks: [
                    {
                        taskKey: 'PHYSICAL_INSTALLATION',
                        taskName: 'Wall Mounting, Cabling & Hardware Boot',
                        order: 1,
                        departmentCode: 'OPS',
                        assignedTo: empMap.empRahul._id,
                        scope: 'SCHOOL_LEVEL',
                        schoolProgressSummary: {
                            totalSchools: def.schools.length,
                            completedSchools: isDone ? def.schools.length : (def.completedStagesCount >= 6 ? 1 : 0),
                            progressText: `${isDone ? def.schools.length : (def.completedStagesCount >= 6 ? 1 : 0)}/${def.schools.length} Schools Installed`
                        },
                        isParallel: true,
                        dependsOn: ['GATE_RECEPTION'],
                        status: isDone || def.completedStagesCount >= 6 ? 'COMPLETED' : (def.completedStagesCount >= 5 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                        completedAt: new Date('2026-03-14'),
                        completedBy: empMap.empRahul._id
                    },
                    {
                        taskKey: 'INSTALLATION_SIGNOFF',
                        taskName: 'Signed Physical Installation Challan',
                        order: 2,
                        departmentCode: 'OPS',
                        assignedTo: empMap.empRahul._id,
                        scope: 'SCHOOL_LEVEL',
                        isParallel: true,
                        dependsOn: ['PHYSICAL_INSTALLATION'],
                        status: isDone || def.completedStagesCount >= 6 ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-03-15'),
                        completedBy: empMap.empRahul._id
                    }
                ]
            },
            {
                stageKey: 'STAGE_06_TRAINING',
                stageName: 'Teacher Training & Capacity Building',
                stageNumber: 6,
                order: 6,
                primaryDepartment: 'TRAINING',
                status: isDone || def.completedStagesCount >= 7 ? 'COMPLETED' : (def.completedStagesCount >= 6 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                tasks: [
                    {
                        taskKey: 'TEACHER_TRAINING',
                        taskName: 'Conduct Hands-on Interactive Pedagogy Training',
                        order: 1,
                        departmentCode: 'TRAINING',
                        assignedTo: empMap.empNeha._id,
                        scope: 'SCHOOL_LEVEL',
                        schoolProgressSummary: {
                            totalSchools: def.schools.length,
                            completedSchools: isDone ? def.schools.length : (def.completedStagesCount >= 7 ? 1 : 0),
                            progressText: `${isDone ? def.schools.length : (def.completedStagesCount >= 7 ? 1 : 0)}/${def.schools.length} Schools Trained`
                        },
                        isParallel: true,
                        dependsOn: ['INSTALLATION_SIGNOFF'],
                        status: isDone || def.completedStagesCount >= 7 ? 'COMPLETED' : (def.completedStagesCount >= 6 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                        completedAt: new Date('2026-03-20'),
                        completedBy: empMap.empNeha._id
                    },
                    {
                        taskKey: 'ATTENDANCE_AND_FEEDBACK',
                        taskName: 'Collect Attendance Sheets & Feedback Ratings',
                        order: 2,
                        departmentCode: 'TRAINING',
                        assignedTo: empMap.empNeha._id,
                        scope: 'SCHOOL_LEVEL',
                        isParallel: true,
                        dependsOn: ['TEACHER_TRAINING'],
                        status: isDone || def.completedStagesCount >= 7 ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-03-21'),
                        completedBy: empMap.empNeha._id
                    }
                ]
            },
            {
                stageKey: 'STAGE_07_CLOSURE',
                stageName: 'Handover & Final Warranty Closure',
                stageNumber: 7,
                order: 7,
                primaryDepartment: 'OPS',
                status: isDone ? 'COMPLETED' : 'NOT_STARTED',
                tasks: [
                    {
                        taskKey: 'FINAL_HANDOVER_LETTER',
                        taskName: 'Countersigned Handover & Acceptance Certificate',
                        order: 1,
                        departmentCode: 'OPS',
                        assignedTo: empMap.empSoumay._id,
                        scope: 'PROJECT_LEVEL',
                        isParallel: false,
                        dependsOn: ['ATTENDANCE_AND_FEEDBACK'],
                        status: isDone ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-03-28'),
                        completedBy: empMap.empSoumay._id
                    },
                    {
                        taskKey: 'WARRANTY_AMC_ACTIVATION',
                        taskName: '3-Year AMC & Warranty Activation in Portal',
                        order: 2,
                        departmentCode: 'TECH',
                        assignedTo: empMap.empShruti._id,
                        scope: 'PROJECT_LEVEL',
                        isParallel: false,
                        dependsOn: ['FINAL_HANDOVER_LETTER'],
                        status: isDone ? 'COMPLETED' : 'NOT_STARTED',
                        completedAt: new Date('2026-03-29'),
                        completedBy: empMap.empShruti._id
                    }
                ]
            }
        ];

        // F. Root Timeline Document
        const rootTimeline = await Timeline.create({
            project: project._id,
            projectId: def.code,
            projectName: def.title,
            email: project.email,
            phone: project.phone,
            address: project.address,
            numberOfSchools: def.schools.length,
            numberOfLicenses: def.schools.length * 2,
            country: 'India',
            projectManager: def.pmEmp._id,
            templateVersion: 'v1',
            status: isDone ? 'COMPLETED' : 'IN_PROGRESS',
            progressPercentage: isDone ? 100 : Math.round((def.completedStagesCount / 8) * 100),
            currentStageKey: isDone ? 'STAGE_07_CLOSURE' : (def.activeStageKey || 'STAGE_01_KICKOFF'),
            stages: canonicalStages
        });

        // G. Create and Populate All 42 Timeline Nodes
        // We instantiate Stage Nodes -> Task Nodes -> Nested Task Nodes
        const createdNodes = [];

        // Helper to evaluate task completion based on project definition
        const evaluateNodeStatus = (key, stageOrder) => {
            if (isDone) return 'COMPLETED';
            if (stageOrder <= def.completedStagesCount) return 'COMPLETED';
            if (stageOrder === def.completedStagesCount + 1) {
                // Active stage: complete the first task, set others in progress/pending
                if (key.includes('PLANNING') || key.includes('PREPARATION') || key.includes('REQ_AND_STOCK') || key.includes('CONFIG')) {
                    return 'COMPLETED';
                }
                return 'IN_PROGRESS';
            }
            return 'PENDING';
        };

        for (const stageDef of timelineConfig.stages) {
            const stageTaskStatus = evaluateNodeStatus(stageDef.key, stageDef.order);

            const stageNode = await TimelineNode.create({
                projectId: def.code,
                timeline: rootTimeline._id,
                parentNode: null,
                type: 'STAGE',
                key: stageDef.key,
                name: stageDef.name,
                order: stageDef.order,
                status: stageTaskStatus,
                assignedTo: def.pmEmp._id,
                formSchema: stageDef.formSchema || null,
                formData: generateNodeFormData(stageDef.key, def.code, def.title, createdSchools, empMap, isDone),
                dependencies: stageDef.dependencies || [],
                metadata: stageDef.metadata || {}
            });
            createdNodes.push(stageNode);

            if (stageDef.substages) {
                for (const subDef of stageDef.substages) {
                    const subTaskStatus = evaluateNodeStatus(subDef.key, stageDef.order);
                    let assignedEmp = empMap.empSoumay._id;
                    if (subDef.key.includes('TECH')) assignedEmp = empMap.empSandeep._id;
                    else if (subDef.key.includes('CONTENT')) assignedEmp = empMap.empKavita._id;
                    else if (subDef.key.includes('INSTALLATION') || subDef.key.includes('HARDWARE')) assignedEmp = empMap.empRahul._id;
                    else if (subDef.key.includes('TRAINING')) assignedEmp = empMap.empNeha._id;

                    const subTaskNode = await TimelineNode.create({
                        projectId: def.code,
                        timeline: rootTimeline._id,
                        parentNode: stageNode._id,
                        type: 'TASK',
                        key: subDef.key,
                        name: subDef.name,
                        order: subDef.order,
                        status: subTaskStatus,
                        assignedTo: assignedEmp,
                        formSchema: subDef.formSchema || null,
                        formData: generateNodeFormData(subDef.key, def.code, def.title, createdSchools, empMap, isDone),
                        metadata: subDef.metadata || {}
                    });
                    createdNodes.push(subTaskNode);

                    if (subDef.nested) {
                        for (const nestedDef of subDef.nested) {
                            const nestedStatus = evaluateNodeStatus(nestedDef.key, stageDef.order);

                            let nestedEmp = assignedEmp;
                            if (nestedDef.key.includes('QA') || nestedDef.key.includes('TESTING')) nestedEmp = empMap.empShruti._id;

                            const nestedNode = await TimelineNode.create({
                                projectId: def.code,
                                timeline: rootTimeline._id,
                                parentNode: subTaskNode._id,
                                type: 'TASK',
                                key: nestedDef.key,
                                name: nestedDef.name,
                                order: nestedDef.order,
                                status: nestedStatus,
                                assignedTo: nestedEmp,
                                formSchema: nestedDef.formSchema || null,
                                formData: generateNodeFormData(nestedDef.key, def.code, def.title, createdSchools, empMap, isDone),
                                metadata: {
                                    ...(nestedDef.metadata || {}),
                                    supportsConditional: nestedDef.supportsConditional || false,
                                    conditionalOnly: nestedDef.conditionalOnly || null
                                }
                            });
                            createdNodes.push(nestedNode);
                        }
                    }
                }
            }
        }

        // H. Sync Requirement document
        const schoolSurveyList = createdSchools.map(s => ({
            id: String(s._id),
            _id: String(s._id),
            schoolName: s.name,
            schoolCode: s.schoolCode || `SCH-${String(s._id).slice(-4)}`,
            address: s.address,
            principalName: s.contactPerson.name,
            pocName: s.survey.pocName,
            pocContact: s.survey.pocContact,
            ...(s.survey || {})
        }));

        const fullOrderReq = {
            ...schoolSurveyList[0],
            schoolName: schoolSurveyList.map(s => s.schoolName).join('; '),
            totalStudents: schoolSurveyList.reduce((acc, s) => acc + Number(s.totalStudents || 0), 0),
            schools: schoolSurveyList,
            remarks: `Complete verified survey for all ${schoolSurveyList.length} schools.`
        };

        // Build rich school requirement documents referencing projectId, schoolId, schoolName, and schoolBranch
        const schoolWiseSolMap = {};
        const schoolWiseHwMap = {};

        const schoolRequirementDocs = createdSchools.map((s, sIdx) => {
            const schIdStr = s.schoolId || `SCH-${def.code}-${sIdx + 1}`;
            const schBranchStr = s.schoolBranch || 'Main Campus';

            // School-wise solution map for Stage 3 form
            schoolWiseSolMap[schIdStr] = {
                SMART_SHAALA: {
                    solutionKey: 'SMART_SHAALA',
                    solutionName: 'Smart Shaala Classroom',
                    quantity: 1,
                    targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
                    board: s.board || 'CBSE',
                    notes: 'Primary Interactive Smart Room'
                },
                STEM_LAB: {
                    solutionKey: 'STEM_LAB',
                    solutionName: 'STEM Innovation Lab',
                    quantity: 1,
                    targetClasses: ['Class 6', 'Class 7', 'Class 8'],
                    board: s.board || 'CBSE',
                    notes: 'STEM & Robotics Lab'
                }
            };

            // School-wise hardware map for Stage 3 form
            schoolWiseHwMap[schIdStr] = {
                IFP_75: {
                    itemKey: 'IFP_75',
                    itemName: '75" 4K UHD Interactive Flat Panel',
                    quantity: 1,
                    specNotes: '4K resolution, 20-point touch, anti-glare toughened glass',
                    solutionKey: 'SMART_SHAALA',
                    solutionName: 'Smart Shaala Classroom'
                },
                OPS_I5: {
                    itemKey: 'OPS_I5',
                    itemName: 'OPS Windows 11 Pro i5 16GB/512GB PC',
                    quantity: 1,
                    specNotes: 'Intel Core i5 11th Gen, 16GB DDR4, 512GB NVMe SSD',
                    solutionKey: 'SMART_SHAALA',
                    solutionName: 'Smart Shaala Classroom'
                },
                PENDRIVE_64: {
                    itemKey: 'PENDRIVE_64',
                    itemName: 'Offline Curriculum USB 3.2 64GB',
                    quantity: 2,
                    specNotes: 'Pre-loaded offline multimedia repository',
                    solutionKey: 'STEM_LAB',
                    solutionName: 'STEM Innovation Lab'
                },
                WALL_MOUNT: {
                    itemKey: 'WALL_MOUNT',
                    itemName: 'Heavy Duty IFP Wall Mount Bracket',
                    quantity: 1,
                    specNotes: 'Reinforced steel wall mounting bracket',
                    solutionKey: 'STEM_LAB',
                    solutionName: 'STEM Innovation Lab'
                }
            };

            const hwList = [
                {
                    hardware: hwIFP._id,
                    hardwareKey: 'IFP_75',
                    itemName: '75" 4K UHD Interactive Flat Panel',
                    hardwareName: '75" 4K UHD Interactive Flat Panel',
                    quantity: 1,
                    qty: 1,
                    unit: 'Units',
                    specNotes: '4K resolution, 20-point touch, anti-glare toughened glass',
                    spec: '4K resolution, 20-point touch, anti-glare toughened glass',
                    serialNotes: `SN-IFP-${def.code}-${sIdx + 1}`,
                    solutionKey: 'SMART_SHAALA',
                    solutionName: 'Smart Shaala Classroom',
                    stockCheck: {
                        requiredQty: 1,
                        inStockQty: 1,
                        purchaseQty: 0,
                        stockStatus: 'IN_STOCK',
                        assignedTo: empMap.empVikas._id,
                        verifiedAt: new Date('2026-02-15')
                    }
                },
                {
                    hardware: hwOPS._id,
                    hardwareKey: 'OPS_I5',
                    itemName: 'OPS Windows 11 Pro i5 16GB/512GB PC',
                    hardwareName: 'OPS Windows 11 Pro i5 16GB/512GB PC',
                    quantity: 1,
                    qty: 1,
                    unit: 'Units',
                    specNotes: 'Intel Core i5 11th Gen, 16GB DDR4, 512GB NVMe SSD',
                    spec: 'Intel Core i5 11th Gen, 16GB DDR4, 512GB NVMe SSD',
                    serialNotes: `SN-OPS-${def.code}-${sIdx + 1}`,
                    solutionKey: 'SMART_SHAALA',
                    solutionName: 'Smart Shaala Classroom',
                    stockCheck: {
                        requiredQty: 1,
                        inStockQty: 1,
                        purchaseQty: 0,
                        stockStatus: 'IN_STOCK',
                        assignedTo: empMap.empVikas._id,
                        verifiedAt: new Date('2026-02-15')
                    }
                },
                {
                    hardware: hwPendrive._id,
                    hardwareKey: 'PENDRIVE_64',
                    itemName: 'Offline Curriculum USB 3.2 64GB',
                    hardwareName: 'Offline Curriculum USB 3.2 64GB',
                    quantity: 2,
                    qty: 2,
                    unit: 'Units',
                    specNotes: 'High-speed 64GB USB 3.2 Key with Offline Multimedia',
                    spec: 'High-speed 64GB USB 3.2 Key with Offline Multimedia',
                    serialNotes: `SN-PD-${def.code}-${sIdx + 1}`,
                    solutionKey: 'STEM_LAB',
                    solutionName: 'STEM Innovation Lab',
                    stockCheck: {
                        requiredQty: 2,
                        inStockQty: 2,
                        purchaseQty: 0,
                        stockStatus: 'IN_STOCK',
                        assignedTo: empMap.empVikas._id,
                        verifiedAt: new Date('2026-02-15')
                    }
                },
                {
                    hardware: hwMount._id,
                    hardwareKey: 'WALL_MOUNT',
                    itemName: 'Heavy Duty IFP Wall Mount Bracket',
                    hardwareName: 'Heavy Duty IFP Wall Mount Bracket',
                    quantity: 1,
                    qty: 1,
                    unit: 'Units',
                    specNotes: 'Reinforced steel wall mounting bracket',
                    spec: 'Reinforced steel wall mounting bracket',
                    serialNotes: '',
                    solutionKey: 'STEM_LAB',
                    solutionName: 'STEM Innovation Lab',
                    stockCheck: {
                        requiredQty: 1,
                        inStockQty: 1,
                        purchaseQty: 0,
                        stockStatus: 'IN_STOCK',
                        assignedTo: empMap.empVikas._id,
                        verifiedAt: new Date('2026-02-15')
                    }
                }
            ];

            const cntList = [
                {
                    contentKey: `CNT-${def.code}-K12`,
                    reqKey: `CNT-${def.code}-K12`,
                    title: 'CBSE K-12 Interactive Curriculum Package',
                    name: 'CBSE K-12 Interactive Curriculum Package',
                    board: s.board || 'CBSE',
                    languageName: 'English, Hindi',
                    gradeName: 'Class 1 to 12',
                    stream: 'Science & Commerce',
                    driveLink: 'https://drive.google.com/drive/folders/digitoppers-k12-curriculum',
                    sheetUrl: 'https://docs.google.com/spreadsheets/d/digitoppers-qa-checklist/edit',
                    solution: solutions[0]._id,
                    solutionKey: 'SMART_SHAALA',
                    status: 'CONFIGURED'
                },
                {
                    contentKey: `CNT-${def.code}-STEM`,
                    reqKey: `CNT-${def.code}-STEM`,
                    title: 'STEM Experiential Learning & Robotics Kit Guide',
                    name: 'STEM Experiential Learning & Robotics Kit Guide',
                    board: s.board || 'CBSE',
                    languageName: 'English',
                    gradeName: 'Class 6 to 10',
                    stream: 'Robotics & IoT',
                    driveLink: 'https://drive.google.com/drive/folders/stem-robotics-curriculum',
                    sheetUrl: 'https://docs.google.com/spreadsheets/d/stem-verification/edit',
                    solution: solutions[1]._id,
                    solutionKey: 'STEM_LAB',
                    status: 'CONFIGURED'
                }
            ];

            return {
                school: s._id,
                schoolId: schIdStr,
                schoolName: s.name,
                schoolBranch: schBranchStr,
                schoolBranchId: schBranchStr || schIdStr,
                order: s.order || (sIdx + 1),
                address: s.address || '',
                contactPerson: s.contactPerson?.name || s.principalName || '',
                phone: s.contactPerson?.phone || '',
                solutions: [
                    {
                        solution: solutions[0]._id,
                        solutionKey: 'SMART_SHAALA',
                        solutionName: 'Smart Shaala Classroom',
                        label: 'Smart Shaala',
                        quantity: 1,
                        description: 'Interactive flat panel display setup with multimedia curriculum',
                        remarks: 'Smart Classroom Hall 1',
                        hardware: [hwList[0], hwList[1]],
                        content: [cntList[0]]
                    },
                    {
                        solution: solutions[1]._id,
                        solutionKey: 'STEM_LAB',
                        solutionName: 'STEM Innovation Lab',
                        label: 'STEM Lab',
                        quantity: 1,
                        description: 'Hands-on experimentation kits and coding modules',
                        remarks: 'Robotics & STEM Wing',
                        hardware: [hwList[2], hwList[3]],
                        content: [cntList[1]]
                    }
                ],
                hardware: hwList,
                content: cntList,
                readyForInstallation: 'YES',
                allHardwareReceived: 'YES'
            };
        });

        await Requirement.create({
            projectId: def.code,
            project: project._id,
            currentStageKey: isDone ? 'STAGE_08_PROJECT_CLOSURE' : 'STAGE_03_ORDER_REQUIREMENT',
            currentSubstageKey: isDone ? 'PROJECT_CLOSURE' : 'CONTENT_CONFIGURATION',
            schools: schoolRequirementDocs,
            orderRequirement: {
                schools: schoolRequirementDocs,
                schoolInformation: fullOrderReq,
                solutionSelection: {
                    activeSolutionKeys: ['SMART_SHAALA', 'STEM_LAB'],
                    schoolWiseSolutions: schoolWiseSolMap,
                    assignedTechLead: empMap.empShruti._id,
                    assignedContentLead: empMap.empKavita._id,
                    remarks: 'Standard K-12 Interactive Lab Package'
                },
                hardwareRequirement: {
                    activeHardwareKeys: ['IFP_75', 'OPS_I5', 'PENDRIVE_64', 'WALL_MOUNT'],
                    schoolWiseHardware: schoolWiseHwMap,
                    assignedHardwareManager: empMap.empVikas._id,
                    remarks: '75-inch Display with i5 computing'
                },
                contentConfiguration: {
                    curriculumBoard: 'CBSE',
                    board: 'CBSE',
                    languages: ['English', 'Hindi'],
                    mediums: ['English', 'Hindi'],
                    classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
                    gradesConfigured: 'Class 1 to 12',
                    contents: ['Syllabus Content', 'Interactive Simulators', 'STEM Robotics'],
                    driveLink: 'https://drive.google.com/drive/folders/digitoppers-k12-curriculum',
                    sheetUrl: 'https://docs.google.com/spreadsheets/d/digitoppers-qa-checklist/edit'
                }
            },
            createdBy: empMap.empSoumay._id,
            updatedBy: empMap.empSoumay._id
        });

        // I. Activity Record
        await Activity.create({
            project: project._id,
            actor: empMap.empSoumay._id,
            actorName: 'Soumay Garg',
            actorEmail: 'soumay@digitoppers.com',
            action: isDone ? 'PROJECT_CLOSED' : 'STAGE_UPDATED',
            description: isDone
                ? `ðŸ† Project [${def.code}] marked 100% COMPLETED with all 8 stages, installation, training, and sign-offs finalized.`
                : `Execution roadmap active for Project [${def.code}] with ${createdSchools.length} school campuses.`,
            resourceType: 'Timeline',
            resourceId: rootTimeline._id,
            metadata: { isDone, stagesCompleted: isDone ? 8 : def.completedStagesCount }
        });

        // J. Notifications for Project Team (Sandeep Mudgal, Pawan Kumar, Soumay Garg)
        const notifRecipients = [empMap.empSandeep._id, empMap.empPawan._id];
        if (def.pmEmp._id.toString() !== empMap.empSandeep._id.toString() && def.pmEmp._id.toString() !== empMap.empPawan._id.toString()) {
            notifRecipients.push(def.pmEmp._id);
        }

        for (const recipientId of notifRecipients) {
            const isPM = recipientId.toString() === def.pmEmp._id.toString();

            if (isPM) {
                await Notification.create({
                    recipient: recipientId,
                    project: projectMongoId,
                    projectId: def.code,
                    title: `Assigned as Project Manager for ${def.code}`,
                    message: `You have been assigned as Project Manager for ${def.title} (${def.org}).`,
                    type: 'PROJECT_ASSIGNED',
                    metadata: {
                        projectId: def.code,
                        projectDatabaseId: projectMongoId,
                        projectName: def.title
                    },
                    isRead: false,
                    _skipSlack: true
                });
            }

            await Notification.create({
                recipient: recipientId,
                project: projectMongoId,
                projectId: def.code,
                title: isDone ? `Project [${def.code}] 100% Completed` : `Project [${def.code}] Stage Progress`,
                message: isDone
                    ? `All milestones, school installations, and sign-offs for ${def.title} are fully completed.`
                    : `Stage ${def.completedStagesCount} completed; Stage ${def.completedStagesCount + 1} (${def.activeStageKey || 'Active'}) is now in progress for ${def.title}.`,
                type: isDone ? 'UPDATE' : 'STAGE_UPDATED',
                metadata: {
                    projectId: def.code,
                    projectDatabaseId: projectMongoId,
                    projectName: def.title,
                    completedStages: isDone ? 8 : def.completedStagesCount
                },
                isRead: !isDone,
                _skipSlack: true
            });
        }

        console.log(`   ⚡ Created ${createdNodes.length} Timeline Nodes for ${def.code}.`);
    }

    // Ensure Project Requests
    console.log('\n📋 Ensuring Project Requests...');
    await ProjectRequest.deleteMany({});
    const projectRequests = [
        {
            requestId: 'REQ-2026-001',
            title: 'AI, Robotics & Space Innovation Labs Phase 2',
            projectName: 'AI, Robotics & Space Innovation Labs',
            email: 'robotics.mission@digitoppers.com',
            country: 'India',
            phone: '+91 120 4567890',
            address: 'Innovation Corridor, Sector 62, Noida, Uttar Pradesh',
            expectedProjectValue: 500000,
            requestedBy: empMap.empPawan._id,
            requestedTo: empMap.empSandeep._id,
            projectManager: empMap.empSoumay._id,
            status: 'APPROVED',
            reviewNotes: 'Approved for full implementation under DigiToppers Space & Robotics roadmap.',
            reviewedBy: empMap.empSandeep._id,
            reviewedAt: new Date('2026-02-01'),
            projectId: new mongoose.Types.ObjectId('6ae068ec20c692364d6c2c73'),
            dashboardProjectId: 'PRJ-ROBOTICS-AI-2026',
            remarks: 'AI, Robotics & Space Innovation Labs in 2 model institutions.'
        },
        {
            requestId: 'REQ-2026-002',
            title: 'STEM Robotics & AI Lab Initiative 2026',
            projectName: 'STEM Robotics & AI Lab Initiative 2026',
            email: 'stem.robotics@digitoppers.com',
            country: 'India',
            phone: '+91 9876543210',
            address: 'Institutional Area, Sector 62, Noida, UP',
            expectedProjectValue: 375000,
            requestedBy: empMap.empSoumay._id,
            requestedTo: empMap.empSandeep._id,
            projectManager: empMap.empSandeep._id,
            status: 'APPROVED',
            reviewNotes: 'Approved with CSR co-funding for model senior secondary schools in Gurugram.',
            reviewedBy: empMap.empSandeep._id,
            reviewedAt: new Date('2026-02-02'),
            projectId: new mongoose.Types.ObjectId('6ae044661f3aba518bcb271f'),
            dashboardProjectId: 'PRJ-STEM-ROBOTICS-2026',
            remarks: 'STEM & Robotics lab setup in Gurugram government schools.'
        },
        {
            requestId: 'REQ-2026-003',
            title: 'Smart Learning & STEM Initiative 2026',
            projectName: 'Smart Learning & STEM Initiative 2026',
            email: 'smartlearning@digitoppers.com',
            country: 'India',
            phone: '+91 9876543210',
            address: 'Plot 42, Institutional Area, South Delhi',
            expectedProjectValue: 400000,
            requestedBy: empMap.empPawan._id,
            requestedTo: empMap.empSandeep._id,
            projectManager: empMap.empSoumay._id,
            status: 'APPROVED',
            reviewNotes: 'Approved for smart learning and interactive lab setup in Delhi & Noida.',
            reviewedBy: empMap.empSandeep._id,
            reviewedAt: new Date('2026-02-03'),
            projectId: new mongoose.Types.ObjectId('6ae0345a68c707ead8e38223'),
            dashboardProjectId: 'PRJ-SMART-2026',
            remarks: 'Interactive smart class and STEM labs.'
        },
        {
            requestId: 'REQ-2026-004',
            title: 'Digital Astronomy & Space Science Hub 2026',
            projectName: 'Digital Astronomy & Space Science Hub 2026',
            email: 'director.schoolseduhry@nic.in',
            country: 'India',
            phone: '+91 98110 01103',
            address: 'Sector 5, Panchkula, Haryana',
            expectedProjectValue: 1500000,
            requestedBy: empMap.empPawan._id,
            requestedTo: empMap.empSandeep._id,
            projectManager: empMap.empSoumay._id,
            status: 'PENDING',
            remarks: 'Proposal submitted for 10 Astronomy and Telescope centers in PM SHRI schools across Haryana.'
        },
        {
            requestId: 'REQ-2026-005',
            title: 'Tribal Residential AI & Coding Labs',
            projectName: 'Tribal Residential AI & Coding Labs',
            email: 'tribal.dev@maharashtra.gov.in',
            country: 'India',
            phone: '+91 98110 01104',
            address: 'Gadchiroli & Nandurbar, Maharashtra',
            expectedProjectValue: 1200000,
            requestedBy: empMap.empSoumay._id,
            requestedTo: empMap.empSandeep._id,
            projectManager: empMap.empSoumay._id,
            status: 'PENDING',
            remarks: 'State tribal welfare department request for 8 remote residential schools with offline solar-backed IFP units.'
        },
        {
            requestId: 'REQ-2026-006',
            title: 'Virtual Language Lab Pilot Project',
            projectName: 'Virtual Language Lab Pilot Project',
            email: 'pilot@privateschoolconsortium.org',
            country: 'India',
            phone: '+91 98110 01105',
            address: 'Jaipur, Rajasthan',
            expectedProjectValue: 450000,
            requestedBy: empMap.empSoumay._id,
            requestedTo: empMap.empSandeep._id,
            projectManager: empMap.empSoumay._id,
            status: 'REJECTED',
            reviewNotes: 'Hardware specs did not meet minimum 4K IFP standard; advised to resubmit with DigiToppers OPS bundle.',
            reviewedBy: empMap.empSandeep._id,
            reviewedAt: new Date('2026-02-10'),
            remarks: 'Initial RFP for 2 pilot branches.'
        }
    ];
    await ProjectRequest.insertMany(projectRequests);
    console.log(`  ✅ ${projectRequests.length} Project Requests seeded (3 Approved, 2 Pending, 1 Rejected).`);

    // Additional Review Notifications for Sandeep Mudgal
    await Notification.create([
        {
            recipient: empMap.empSandeep._id,
            title: 'New Project Request Pending Review',
            message: 'REQ-2026-004 (Digital Astronomy & Space Science Hub 2026) submitted by Pawan Kumar is waiting for your review.',
            type: 'PROJECT_REQUEST_REVIEW',
            metadata: {
                requestId: 'REQ-2026-004',
                projectName: 'Digital Astronomy & Space Science Hub 2026',
                requestedBy: empMap.empPawan.name
            },
            isRead: false,
            _skipSlack: true
        },
        {
            recipient: empMap.empSandeep._id,
            title: 'New Project Request Pending Review',
            message: 'REQ-2026-005 (Tribal Residential AI & Coding Labs) submitted by Soumay Garg is waiting for your review.',
            type: 'PROJECT_REQUEST_REVIEW',
            metadata: {
                requestId: 'REQ-2026-005',
                projectName: 'Tribal Residential AI & Coding Labs',
                requestedBy: empMap.empSoumay.name
            },
            isRead: false,
            _skipSlack: true
        }
    ]);

    console.log('\n========================================================================');
    console.log('🎉 MASTER DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================================================');
    console.log('📊 Summary:');
    console.log('  • Total Projects Seeded: 4 (Targeting Core Backend Projects)');
    console.log('  • 🏆 100% COMPLETED Projects (1):');
    console.log('      1. PRJ-ROBOTICS-AI-2026 (AI, Robotics & Space Innovation Labs — 2 schools, PM: Soumay Garg)');
    console.log('  • ⏳ IN-PROGRESS Projects (3):');
    console.log('      2. PRJ-STEM-ROBOTICS-2026 (STEM Robotics & AI Lab — 75% Training active, PM: Sandeep Mudgal)');
    console.log('      3. PRJ-SMART-2026         (Smart Learning & STEM — 50% Testing active, PM: Soumay Garg)');
    console.log('      4. P1793013764468         (Project 26 Oct 1 — 25% Order Requirement active, PM: Sandeep Mudgal)');
    console.log('  • Total Schools: 11 (all with full 7-section surveys, hardware allocations & contacts)');
    console.log('  • Total Timeline Nodes: 156+ (fully linked with form data & assignees)');
    console.log('  • Total Project Requests: 6 (3 Approved, 2 Pending review, 1 Rejected)');
    console.log('  • Total Notifications: Seeded for Sandeep Mudgal (CTO/Admin), Pawan Kumar, & Soumay Garg');
    console.log('========================================================================\n');
    return true;
}

if (require.main === module) {
    seedMasterDatabase()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('âŒ Seeding error:', err);
            process.exit(1);
        });
}

module.exports = seedMasterDatabase;

