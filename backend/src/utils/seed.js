const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Employee = require('../modules/employees/employee.model');
const ProjectService = require('../modules/projects/project.service');
const ProjectMember = require('../modules/projects/project-member.model');
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
    await Timeline.deleteMany({});
    await TimelineNode.deleteMany({});
    await mongoose.connection.collection('activities').deleteMany({});
    await mongoose.connection.collection('requirements').deleteMany({});
    await mongoose.connection.collection('notifications').deleteMany({});
    console.log('✅ Cleared all collections');

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
      projectCode: 'PRJ-2026-001',
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
      projectCode: 'PRJ-2026-002',
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
      projectCode: 'PRJ-2026-003',
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
      projectCode: 'PRJ-2025-021',
      title: 'Hyderabad Private School — Science Learning Kit',
      description: 'Science Learning Lab setup completed for Hyderabad International School. All stages from lead to closure done.',
      client: 'Hyderabad International School',
      projectManager: pm2._id,
      status: 'COMPLETED'
    }, admin._id);

    await ProjectService.addOrUpdateMember(project4._id, contrib3._id, DESIGNATIONS.CONTRIBUTOR, admin._id);
    await ProjectService.addOrUpdateMember(project4._id, viewer2._id, DESIGNATIONS.VIEWER, admin._id);
    console.log('✅ Project 4 created: PRJ-2025-021');

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
    console.log('Projects:');
    console.log('  PRJ-2026-001  Delhi Public School Smart Classrooms   [ACTIVE]');
    console.log('  PRJ-2026-002  Kendriya Vidyalaya Astronomy & Robotics [ACTIVE]');
    console.log('  PRJ-2026-003  Maharashtra ePathshala Rollout          [ON_HOLD]');
    console.log('  PRJ-2025-021  Hyderabad Science Learning Kit          [COMPLETED]');
    console.log('──────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
