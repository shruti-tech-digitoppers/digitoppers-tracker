/**
 * Master Employees Seeder
 * Ensures all standard DigiToppers team members and logins exist in MongoDB.
 * Preserves existing accounts and passwords if already present.
 */

const bcrypt = require('bcryptjs');
const Employee = require('../modules/employees/employee.model');

async function seedRealEmployees() {
  console.log('\n👥 Checking Master Employees directory...');
  const defaultPassword = await bcrypt.hash('Digitoppers@123', 10);

  const masterEmployees = [
    {
      name: 'Pawan Kumar',
      email: 'growth@digitoppers.com',
      passwordHash: defaultPassword,
      employeeCode: 'EMP001',
      designation: 'CEO',
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
      employeeCode: 'EMP003',
      designation: 'CTO',
      globalRole: 'ADMIN',
      phone: '9811001102',
      isActive: true,
      canRequestNewProject: true,
      permissions: { canRequestNewProject: true }
    },
    {
      name: 'Soumay Garg',
      email: 'soumay@digitoppers.com',
      passwordHash: defaultPassword,
      employeeCode: 'EMP005',
      designation: 'Project Manager',
      globalRole: 'EMPLOYEE',
      phone: '9811001103',
      isActive: true,
      canRequestNewProject: true,
      permissions: { canRequestNewProject: true }
    },
    {
      name: 'Shruti',
      email: 'shruti@digitoppers.com',
      passwordHash: defaultPassword,
      employeeCode: 'EMP013',
      designation: 'Tech Intern',
      globalRole: 'EMPLOYEE',
      phone: '9811001104',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Rahul Yadav',
      email: 'rahul@digitoppers.com',
      passwordHash: defaultPassword,
      employeeCode: 'EMP014',
      designation: 'Field Engineer',
      globalRole: 'EMPLOYEE',
      phone: '9811001105',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Vikas Singh',
      email: 'vikas@digitoppers.com',
      passwordHash: defaultPassword,
      employeeCode: 'EMP015',
      designation: 'Field Engineer',
      globalRole: 'EMPLOYEE',
      phone: '9811001106',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Neha Gupta',
      email: 'neha@digitoppers.com',
      passwordHash: defaultPassword,
      employeeCode: 'EMP016',
      designation: 'Academic Trainer',
      globalRole: 'EMPLOYEE',
      phone: '9811001107',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Pooja Mishra',
      email: 'pooja@digitoppers.com',
      passwordHash: defaultPassword,
      employeeCode: 'EMP017',
      designation: 'Academic Trainer',
      globalRole: 'EMPLOYEE',
      phone: '9811001108',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Rohan Mehta',
      email: 'rohan@digitoppers.com',
      passwordHash: defaultPassword,
      employeeCode: 'EMP018',
      designation: 'Software Engineer',
      globalRole: 'EMPLOYEE',
      phone: '9811001109',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    },
    {
      name: 'Kavita Rao',
      email: 'kavita@digitoppers.com',
      passwordHash: defaultPassword,
      employeeCode: 'EMP019',
      designation: 'Content Lead',
      globalRole: 'EMPLOYEE',
      phone: '9811001110',
      isActive: true,
      canRequestNewProject: false,
      permissions: { canRequestNewProject: false }
    }
  ];

  let addedCount = 0;
  for (const emp of masterEmployees) {
    const existing = await Employee.findOne({
      $or: [
        { email: emp.email.toLowerCase().trim() },
        { employeeCode: emp.employeeCode.toUpperCase().trim() }
      ]
    });

    if (!existing) {
      await Employee.create(emp);
      addedCount++;
    }
  }

  const totalEmployees = await Employee.countDocuments();
  if (addedCount > 0) {
    console.log(`  ✅ Added ${addedCount} missing Master Employees (Total: ${totalEmployees}).`);
  } else {
    console.log(`  ✅ ${totalEmployees} Master Employees already present.`);
  }

  return totalEmployees;
}

module.exports = { seedRealEmployees };

if (require.main === module) {
  const connectDB = require('../config/database');
  connectDB()
    .then(() => seedRealEmployees())
    .then(() => {
      console.log('Employee seeding complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Employee seeding error:', err);
      process.exit(1);
    });
}

