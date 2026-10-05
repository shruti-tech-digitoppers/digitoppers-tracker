const app = require('./src/app');
const connectDB = require('./src/config/database');
const { port } = require('./src/config/env');
const Employee = require('./src/modules/employees/employee.model');
const seedDatabase = require('./src/utils/seed');

connectDB().then(async () => {
  try {
    const empCount = await Employee.countDocuments();
    if (empCount === 0) {
      console.log('🌱 Database is empty, initializing seed data...');
      await seedDatabase();
    }
  } catch (err) {
    console.error('Seeding check error:', err);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Digitopper Tracker Backend running on port ${port} (0.0.0.0)`);
  });
});
