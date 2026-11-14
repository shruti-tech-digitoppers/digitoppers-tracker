/**
 * Master Employees Seeder
 * Uploads official DigiToppers team members matching company records.
 */

const bcrypt = require('bcryptjs');
const { DEFAULT_TEST_PASSWORD } = require('../config/testCredentials');
const Employee = require('../modules/employees/employee.model');

async function seedRealEmployees(clearExisting = true) {
  console.log('\n========================================================');
  console.log('👥 SEEDING DIGITOPPERS MASTER EMPLOYEES');
  console.log('========================================================');

  if (clearExisting) {
    console.log('🗑️ Clearing existing employees collection as requested...');
    const deleted = await Employee.deleteMany({});
    console.log(`  ✅ Cleared ${deleted.deletedCount} old employee records.`);
  }

  const defaultPassword = await bcrypt.hash(DEFAULT_TEST_PASSWORD, 10);

  const masterEmployees = [
    // --- Leadership & Administration (DIGI000001 - DIGI000003) ---
    {
      name: 'Pawan Kumar',
      email: 'growth@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'CEO',
      department: 'Leadership & Management',
      globalRole: 'ADMIN',
      phone: '9811001101',
      isActive: true,
      canRequestNewProject: true,
      permissions: { canRequestNewProject: true }
    },
    {
      name: 'Sandeep Mudgal',
      email: 'tech@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'CTO',
      department: 'Product & Technology',
      globalRole: 'ADMIN',
      phone: '9811001102',
      isActive: true,
      canRequestNewProject: true,
      permissions: { canRequestNewProject: true }
    },
    {
      name: 'Admin Digitopper',
      email: 'admin@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'System Administrator',
      department: 'Administration',
      globalRole: 'ADMIN',
      phone: '9811001100',
      isActive: true,
      canRequestNewProject: true,
      permissions: { canRequestNewProject: true }
    },

    // --- Official Team Directory (DIGI000004 - DIGI000017 from Sheet) ---
    {
      name: 'Manoj Kumar Accounts',
      email: 'manoj@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Accounts Executive',
      department: 'Accounts & Finance',
      globalRole: 'EMPLOYEE',
      phone: '9811001104',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Dharam Prakash',
      email: 'dharam@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Content Head',
      department: 'Academic & Content',
      globalRole: 'EMPLOYEE',
      phone: '9811001105',
      isActive: true,
      canRequestNewProject: true,
      permissions: { canRequestNewProject: true }
    },
    {
      name: 'Soumay Garg',
      email: 'soumay@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Associate Project Manager',
      department: 'Operations',
      globalRole: 'EMPLOYEE',
      phone: '9811001106',
      isActive: true,
      canRequestNewProject: true,
      permissions: { canRequestNewProject: true }
    },
    {
      name: 'Praveen',
      email: 'praveen@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Operations Executive',
      department: 'Operations',
      globalRole: 'EMPLOYEE',
      phone: '9811001107',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Kashish Jain',
      email: 'kashish@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Social Media Executive',
      department: 'Marketing',
      globalRole: 'EMPLOYEE',
      phone: '9811001108',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Bhavna Yadav',
      email: 'bhavna@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Business Development Manager',
      department: 'Sales & Business Development',
      globalRole: 'EMPLOYEE',
      phone: '9811001109',
      isActive: true,
      canRequestNewProject: true,
      permissions: { canRequestNewProject: true }
    },
    {
      name: 'Pratham kumar yadav',
      email: 'pratham@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Content Intern',
      department: 'Academic & Content',
      globalRole: 'EMPLOYEE',
      phone: '9811001110',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Ajay Punia',
      email: 'ajay@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Operations Intern',
      department: 'Operations',
      globalRole: 'EMPLOYEE',
      phone: '9811001111',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Rishab Sharma',
      email: 'rishab@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Accounts Intern',
      department: 'Accounts & Finance',
      globalRole: 'EMPLOYEE',
      phone: '9811001112',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Dheeraj Mokhria',
      email: 'dheeraj@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Marketing Intern',
      department: 'Marketing',
      globalRole: 'EMPLOYEE',
      phone: '9811001113',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Shruti',
      email: 'shruti@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Technical Intern',
      department: 'Product & Technology',
      globalRole: 'EMPLOYEE',
      phone: '9811001114',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Sachin kumar',
      email: 'sachin@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Flutter Developer',
      department: 'Product & Technology',
      globalRole: 'EMPLOYEE',
      phone: '9811001115',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Anjali Thakraan',
      email: 'anjali@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Business Development Intern',
      department: 'Sales & Business Development',
      globalRole: 'EMPLOYEE',
      phone: '9811001116',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Nidhi kharb',
      email: 'nidhi@digitoppers.com',
      passwordHash: defaultPassword,
      designation: 'Data Analyst Intern',
      department: 'Research and Impact',
      globalRole: 'EMPLOYEE',
      phone: '9811001117',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    }
  ];

  const enrichedEmployees = masterEmployees.map((e, idx) => ({
    ...e,
    employeeCode: e.employeeCode || `DIGI${String(idx + 1).padStart(6, '0')}`
  }));

  const inserted = await Employee.insertMany(enrichedEmployees);
  console.log(`✅ Successfully seeded ${inserted.length} Master Employees into employees collection.`);

  return inserted.length;
}

module.exports = { seedRealEmployees };

if (require.main === module) {
  const connectDB = require('../config/database');
  const mongoose = require('mongoose');

  connectDB()
    .then(() => seedRealEmployees(true))
    .then(() => {
      console.log('Employee seeding complete.');
      return mongoose.disconnect();
    })
    .then(() => {
      console.log('🔌 Disconnected from MongoDB.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Employee seeding error:', err);
      process.exit(1);
    });
}
