import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from './config/env.js';
import { Employee } from './modules/employees/employee.model.js';
import { Project } from './modules/projects/project.model.js';
import { ProjectMember } from './modules/projects/project-member.model.js';
import { Requirement } from './modules/requirements/requirements.model.js';
import { Activity } from './modules/activity/activity.model.js';
import { GLOBAL_ROLES, PROJECT_DESIGNATIONS } from './core/constants.js';

const seedDatabase = async () => {
  try {
    console.log('[Seeder] Connecting to MongoDB Atlas...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('[Seeder] Connected successfully. Cleaning existing collections...');

    await Employee.deleteMany({});
    await Project.deleteMany({});
    await ProjectMember.deleteMany({});
    await Requirement.deleteMany({});
    await Activity.deleteMany({});

    console.log('[Seeder] Creating Employees...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const admin = await Employee.create({
      name: 'System Admin',
      email: 'admin@digitopper.com',
      passwordHash: hashedPassword,
      globalRole: GLOBAL_ROLES.ADMIN,
      employeeCode: 'EMP001'
    });

    const rahulPM = await Employee.create({
      name: 'Rahul Sharma (PM)',
      email: 'rahul.pm@digitopper.com',
      passwordHash: hashedPassword,
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP002'
    });

    const priyaContributor = await Employee.create({
      name: 'Priya Verma (Contributor)',
      email: 'priya.contributor@digitopper.com',
      passwordHash: hashedPassword,
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP003'
    });

    const amitViewer = await Employee.create({
      name: 'Amit Viewer',
      email: 'amit.viewer@digitopper.com',
      passwordHash: hashedPassword,
      globalRole: GLOBAL_ROLES.EMPLOYEE,
      employeeCode: 'EMP004'
    });

    console.log('[Seeder] Creating Projects & Initializing Requirements...');
    
    const projectA = await Project.create({
      projectCode: 'PRJ-2026-001',
      title: 'Delhi Public School Smart Class Rollout',
      description: 'Full hardware, tech stack, and content rollout for 40 classrooms.',
      client: 'DPS Society',
      status: 'IN_PROGRESS',
      projectManager: rahulPM._id,
      createdBy: admin._id
    });

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await ProjectMember.create([
        { project: projectA._id, employee: rahulPM._id, designation: PROJECT_DESIGNATIONS.PROJECT_MANAGER, assignedBy: admin._id },
        { project: projectA._id, employee: priyaContributor._id, designation: PROJECT_DESIGNATIONS.CONTRIBUTOR, assignedBy: rahulPM._id },
        { project: projectA._id, employee: amitViewer._id, designation: PROJECT_DESIGNATIONS.VIEWER, assignedBy: rahulPM._id }
      ], { session });

      // Seeding Initial Unified Requirements with Solutions & School Details
      await Requirement.create([{
        project: projectA._id,
        selectedSolutions: ['STEM_LAB', 'ROBOTICS', 'SMART_SHAALA'],
        schoolDetails: {
          schoolName: 'DPS Mathura Road',
          address: 'Mathura Road, New Delhi',
          contactPerson: 'Mr. Sharma',
          phone: '9876543210',
          studentCount: 500,
          infrastructureNotes: 'Ready for smart class installation and lab setup.'
        },
        hardwareDetails: {
          items: [
            { itemName: 'Smartboard 75 inch', quantity: 40, status: 'PENDING' },
            { itemName: 'Robotics Kit', quantity: 10, status: 'PENDING' }
          ],
          notes: 'Deliver before next month start.'
        },
        techAndContentDetails: {
          techRequirements: 'Standard Android 13 Interactive Panels integration',
          contentModulesSelected: ['STEM Class 6-10', 'Robotics Basic'],
          customizations: 'None'
        },
        status: 'IN_PROGRESS',
        updatedBy: rahulPM._id
      }], { session });

      await Activity.create([{
        project: projectA._id,
        actor: admin._id,
        action: 'PROJECT_CREATED',
        resourceType: 'Project',
        resourceId: projectA._id,
        metadata: { seeded: true }
      }], { session });

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

    console.log('[Seeder] Database seeding completed successfully!');
    console.log('\n--- TEST CREDENTIALS ---');
    console.log('Admin: admin@digitopper.com / Password123!');
    console.log('Project Manager: rahul.pm@digitopper.com / Password123!');
    console.log('Contributor: priya.contributor@digitopper.com / Password123!');
    console.log('Viewer: amit.viewer@digitopper.com / Password123!');
    console.log('------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
};

seedDatabase();