const app = require('./src/app');
const connectDB = require('./src/config/database');
const { port } = require('./src/config/env');
const Employee = require('./src/modules/employees/employee.model');
const Project = require('./src/modules/projects/project.model');
const initMasterCatalogs = require('./src/utils/initMasterCatalogs');

connectDB().then(async () => {
  try {
    console.log('📦 Ensuring master catalogs & real team directory...');
    if (typeof initMasterCatalogs === 'function') {
      await initMasterCatalogs();
    }
  } catch (err) {
    console.error('Master catalogs check error:', err);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Digitopper Tracker Backend running on port ${port} (0.0.0.0)`);
  });
});
