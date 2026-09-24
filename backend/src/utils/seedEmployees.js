const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Employee = require('../modules/employees/employee.model');
const Project = require('../modules/projects/project.model');
const ProjectMember = require('../modules/projects/project-member.model');
const ProjectRequest = require('../modules/requests/project-request.model');
const Timeline = require('../modules/timeline/timeline.model');
const TimelineNode = require('../modules/timeline/timeline-node.model');
const { GLOBAL_ROLES } = require('../core/constants');

const UNIFIED_PASSWORD = 'Digitoppers@123';

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

async function seedEmployees() {
  try {
    await connectDB();
    console.log('\n🧹 Removing all previous employees...');
    await Employee.deleteMany({});
    console.log('✅ Previous employees removed.');

    console.log(`\n🌱 Seeding ${EMPLOYEES_DATA.length} employees with password: "${UNIFIED_PASSWORD}"...\n`);

    const createdEmployees = [];
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
      createdEmployees.push(emp);
      console.log(`  ✓ Created [${emp.employeeCode}] ${emp.name} (${emp.designation}) - ${emp.email} [Role: ${emp.globalRole}]`);
    }

    // Assign Soumay Garg or Pawan Kumar as PM on any existing unassigned projects
    const defaultPm = createdEmployees.find(e => e.email === 'soumay@digitoppers.com') || createdEmployees[0];
    if (defaultPm) {
      console.log(`\n🔗 Linking existing projects to default PM (${defaultPm.name})...`);
      await Project.updateMany(
        { $or: [{ projectManager: null }, { projectManager: { $exists: false } }] },
        { $set: { projectManager: defaultPm._id } }
      );
      await Timeline.updateMany(
        { $or: [{ projectManager: null }, { projectManager: { $exists: false } }] },
        { $set: { projectManager: defaultPm._id } }
      );
    }

    console.log(`\n🎉 Successfully seeded ${createdEmployees.length} employees!`);
    console.log(`🔑 Unified Password for all employees: ${UNIFIED_PASSWORD}\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedEmployees();
