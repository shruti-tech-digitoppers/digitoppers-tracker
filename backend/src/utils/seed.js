const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Employee = require('../modules/employees/employee.model');
const ProjectService = require('../modules/projects/project.service');
const ProjectMember = require('../modules/projects/project-member.model');
const ProjectRequest = require('../modules/requests/project-request.model');
const Timeline = require('../modules/timeline/timeline.model');
const TimelineNode = require('../modules/timeline/timeline-node.model');
const { GLOBAL_ROLES, DESIGNATIONS } = require('../core/constants');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting fresh seed...\n');

    // ──────────────────────────────────────────────
    // CLEAN ALL COLLECTIONS
    // ──────────────────────────────────────────────
    await Employee.deleteMany({});
    await mongoose.connection.collection('projects').deleteMany({});
    await ProjectMember.deleteMany({});
    await ProjectRequest.deleteMany({});
    await Timeline.deleteMany({});
    await TimelineNode.deleteMany({});
    await mongoose.connection.collection('activities').deleteMany({});
    await mongoose.connection.collection('requirements').deleteMany({});
    await mongoose.connection.collection('notifications').deleteMany({});
    console.log('✅ Cleared all collections (including Project Requests)');

    // ──────────────────────────────────────────────
    // 1. CREATE EMPLOYEES
    // ──────────────────────────────────────────────

    // Admin (no project-level authority — only manages users & projects)
    const admin = await Employee.create({
      name: 'System Admin',
      email: 'admin@digitopper.com',
      passwordHash: 'Admin@123',
      globalRole: GLOBAL_ROLES.ADMIN,
      employeeCode: 'EMP001'
    });

    // Project Managers
    const pm1 = await Employee.create({
      name: 'Rahul Sharma',
      email: 'rahul.pm@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP002'
    });

    const pm2 = await Employee.create({
      name: 'Sneha Kulkarni',
      email: 'sneha.pm@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP003'
    });

    // Contributors
    const contrib1 = await Employee.create({
      name: 'Amit Verma',
      email: 'amit.contrib@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP004'
    });

    const contrib2 = await Employee.create({
      name: 'Divya Nair',
      email: 'divya.contrib@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP005'
    });

    const contrib3 = await Employee.create({
      name: 'Rajan Mehta',
      email: 'rajan.contrib@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP006'
    });

    // Viewers
    const viewer1 = await Employee.create({
      name: 'Priya Iyer',
      email: 'priya.viewer@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP007'
    });

    const viewer2 = await Employee.create({
      name: 'Karan Bose',
      email: 'karan.viewer@digitopper.com',
      passwordHash: 'Password@123',
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP008'
    });

    console.log('✅ Created 8 employees');

    // ──────────────────────────────────────────────
    // 2. CREATE 4 PROJECTS (each gets its own full timeline from config)
    //    Admin creates them, PM manages them, Contributor/Viewer added as members
    //    Admin has NO project-level timeline authority
    // ──────────────────────────────────────────────

    // PROJECT 1 — DPS Smart Classrooms (Active, In Progress)
    const project1 = await ProjectService.createProject({
      projectId: 'PRJ-2026-001',
      projectName: 'Delhi Public School — Smart Classrooms',
      title: 'Delhi Public School — Smart Classrooms',
      description: 'Full STEM Lab + Smart Shaala setup for DPS RK Puram. Includes hardware procurement, content onboarding, and teacher training.',
      client: 'DPS Society, New Delhi',
      projectManager: pm1._id,
      status: 'ACTIVE'
    }, admin._id);

    await ProjectService.addOrUpdateMember(project1._id, contrib1._id, DESIGNATIONS.CONTRIBUTOR, admin._id);
    await ProjectService.addOrUpdateMember(project1._id, contrib2._id, DESIGNATIONS.CONTRIBUTOR, admin._id);
    await ProjectService.addOrUpdateMember(project1._id, viewer1._id, DESIGNATIONS.VIEWER, admin._id);
    console.log('✅ Project 1 created: PRJ-2026-001');

    // PROJECT 2 — Kendriya Vidyalaya (Active, Early Stage)
    const project2 = await ProjectService.createProject({
      projectId: 'PRJ-2026-002',
      projectName: 'Kendriya Vidyalaya — Astronomy & Robotics Lab',
      title: 'Kendriya Vidyalaya — Astronomy & Robotics Lab',
      description: 'Astronomy Lab + Robotics solution deployment for KV Sector 8, Dwarka. Content and tech track running in parallel.',
      client: 'KVS Regional Office, Delhi',
      projectManager: pm1._id,
      status: 'ACTIVE'
    }, admin._id);

    await ProjectService.addOrUpdateMember(project2._id, contrib1._id, DESIGNATIONS.CONTRIBUTOR, admin._id);
    await ProjectService.addOrUpdateMember(project2._id, viewer1._id, DESIGNATIONS.VIEWER, admin._id);
    console.log('✅ Project 2 created: PRJ-2026-002');

    // PROJECT 3 — Maharashtra Government Schools (On Hold)
    const project3 = await ProjectService.createProject({
      projectId: 'PRJ-2026-003',
      projectName: 'Maharashtra Govt. Schools — ePathshala Rollout',
      title: 'Maharashtra Govt. Schools — ePathshala Rollout',
      description: 'State-wide ePathshala digital content rollout across 12 government schools in Pune district. Currently on hold pending PO.',
      client: 'Maharashtra Education Dept.',
      projectManager: pm2._id,
      status: 'ON_HOLD'
    }, admin._id);

    await ProjectService.addOrUpdateMember(project3._id, contrib2._id, DESIGNATIONS.CONTRIBUTOR, admin._id);
    await ProjectService.addOrUpdateMember(project3._id, contrib3._id, DESIGNATIONS.CONTRIBUTOR, admin._id);
    await ProjectService.addOrUpdateMember(project3._id, viewer2._id, DESIGNATIONS.VIEWER, admin._id);
    console.log('✅ Project 3 created: PRJ-2026-003');

    // PROJECT 4 — Private School Hyderabad (Completed)
    const project4 = await ProjectService.createProject({
      projectId: 'PRJ-2025-021',
      projectName: 'Hyderabad Private School — Science Learning Kit',
      title: 'Hyderabad Private School — Science Learning Kit',
      description: 'Science Learning Lab setup completed for Hyderabad International School. All stages from lead to closure done.',
      client: 'Hyderabad International School',
      projectManager: pm2._id,
      status: 'COMPLETED'
    }, admin._id);

    await ProjectService.addOrUpdateMember(project4._id, contrib3._id, DESIGNATIONS.CONTRIBUTOR, admin._id);
    await ProjectService.addOrUpdateMember(project4._id, viewer2._id, DESIGNATIONS.VIEWER, admin._id);
    console.log('✅ Project 4 created: PRJ-2025-021');

    // ──────────────────────────────────────────────
    // 3. SEED INITIAL REQUESTS (Demo Flow)
    // ──────────────────────────────────────────────
    console.log('\n📥 Seeding Project Requests (with Dashboard Integration)...');

    // Approved Request 1 -> Linked to PRJ-2026-001
    await ProjectRequest.create({
      requestId: 'REQ-2026-001',
      title: 'Delhi Public School — Smart Classrooms',
      projectName: 'Delhi Public School — Smart Classrooms',
      client: 'DPS Society, New Delhi',
      expectedProjectValue: 4500000,
      requestedBy: contrib1._id,
      requestedTo: admin._id,
      projectManager: pm1._id,
      status: 'APPROVED',
      dashboardProjectId: 'PRJ-2026-001',
      confirmedProjectId: project1._id,
      isManualDashboardCreated: true,
      reviewNotes: 'Manually verified on Dashboard and approved for full rollout.',
      reviewedBy: admin._id,
      reviewedAt: new Date()
    });

    // Approved Request 2 -> Linked to PRJ-2026-002
    await ProjectRequest.create({
      requestId: 'REQ-2026-002',
      title: 'Kendriya Vidyalaya — Astronomy & Robotics Lab',
      projectName: 'Kendriya Vidyalaya — Astronomy & Robotics Lab',
      client: 'KVS Regional Office, Delhi',
      expectedProjectValue: 3200000,
      requestedBy: contrib1._id,
      requestedTo: admin._id,
      projectManager: pm1._id,
      status: 'APPROVED',
      dashboardProjectId: 'PRJ-2026-002',
      confirmedProjectId: project2._id,
      isManualDashboardCreated: true,
      reviewNotes: 'Dashboard project created and linked to tracker timeline.',
      reviewedBy: admin._id,
      reviewedAt: new Date()
    });

    // Pending Request 3 -> Ready for Approver to test "Confirm Request" with Dashboard ID
    await ProjectRequest.create({
      requestId: 'REQ-2026-003',
      title: 'Karnataka State STEM Shaala Network',
      projectName: 'Karnataka State STEM Shaala Network',
      client: 'Karnataka Dept. of Primary & Secondary Education',
      expectedProjectValue: 4800000,
      requestedBy: contrib2._id,
      requestedTo: admin._id,
      projectManager: pm1._id,
      status: 'PENDING',
      description: 'Rollout of 35 STEM Shaalas with IFPs and Student Tablets across Bengaluru and Mysuru divisions.'
    });

    // Pending Request 4 -> Assigned to PM Sneha
    await ProjectRequest.create({
      requestId: 'REQ-2026-004',
      title: 'Tamil Nadu Smart Classroom Initiative',
      projectName: 'Tamil Nadu Smart Classroom Initiative',
      client: 'Samagra Shiksha Tamil Nadu',
      expectedProjectValue: 3600000,
      requestedBy: contrib3._id,
      requestedTo: admin._id,
      projectManager: pm2._id,
      status: 'PENDING',
      description: 'Phase 1 implementation for 20 model higher secondary schools in Chennai.'
    });

    // Rejected Request 5
    await ProjectRequest.create({
      requestId: 'REQ-2026-005',
      title: 'Private Pilot Setup - North Zone',
      projectName: 'Private Pilot Setup - North Zone',
      client: 'Alpha Global Academy',
      expectedProjectValue: 1200000,
      requestedBy: contrib3._id,
      requestedTo: admin._id,
      projectManager: pm1._id,
      status: 'REJECTED',
      reviewNotes: 'Budget allocation deferred to next fiscal quarter.',
      reviewedBy: admin._id,
      reviewedAt: new Date()
    });

    console.log('✅ Created 5 project requests (2 Approved with Dashboard IDs, 2 Pending Action, 1 Rejected)');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('──────────────────────────────────────────');
    console.log('Logins:');
    console.log('  Admin       : admin@digitopper.com      / Admin@123');
    console.log('  PM (Rahul)  : rahul.pm@digitopper.com   / Password@123');
    console.log('  PM (Sneha)  : sneha.pm@digitopper.com   / Password@123');
    console.log('  Contrib     : amit.contrib@digitopper.com / Password@123');
    console.log('  Contrib     : divya.contrib@digitopper.com / Password@123');
    console.log('  Viewer      : priya.viewer@digitopper.com / Password@123');
    console.log('──────────────────────────────────────────');
    console.log('Requests & Projects:');
    console.log('  REQ-2026-001  -> PRJ-2026-001 (DPS Smart Classrooms)          [APPROVED]');
    console.log('  REQ-2026-002  -> PRJ-2026-002 (KV Astronomy & Robotics)       [APPROVED]');
    console.log('  REQ-2026-003  Karnataka State STEM Shaala Network             [PENDING]');
    console.log('  REQ-2026-004  Tamil Nadu Smart Classroom Initiative           [PENDING]');
    console.log('  REQ-2026-005  Private Pilot Setup                             [REJECTED]');
    console.log('──────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
