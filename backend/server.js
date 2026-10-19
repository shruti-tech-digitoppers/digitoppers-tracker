const app = require('./src/app');
const connectDB = require('./src/config/database');
const { port } = require('./src/config/env');
const Employee = require('./src/modules/employees/employee.model');
const Project = require('./src/modules/projects/project.model');
const initMasterCatalogs = require('./src/utils/initMasterCatalogs');
let seedSingleProject, seedSecondProject, seedCompletedProject;
try { seedSingleProject = require('./src/utils/seedSingleProject'); } catch (e) {}
try { seedSecondProject = require('./src/utils/seedSecondProject'); } catch (e) {}
try { seedCompletedProject = require('./src/utils/seedCompletedProject'); } catch (e) {}

connectDB().then(async () => {
  try {
    console.log('📦 Ensuring master catalogs & real team directory...');
    if (typeof initMasterCatalogs === 'function') {
      await initMasterCatalogs();
    }
    const projCount = await Project.countDocuments();
    if (projCount === 0 && typeof seedSingleProject === 'function') {
      console.log('🌱 Seeding initial project for tracker demonstration...');
      await seedSingleProject();
    }
    if (typeof seedSecondProject === 'function') {
      const hasProjectTwo = await Project.findOne({ projectId: 'DL-NDMC-2026-002' });
      if (!hasProjectTwo) {
        console.log('🌱 Seeding second project (Delhi NDMC Phase 2)...');
        await seedSecondProject();
      }
    }
    if (typeof seedCompletedProject === 'function') {
      const hasProjectThree = await Project.findOne({ projectId: 'RJ-JAI-2026-003' });
      if (!hasProjectThree) {
        console.log('🌱 Seeding third 100% completed project (Rajasthan Jaipur Phase 1)...');
        await seedCompletedProject();
      }
    }
  } catch (err) {
    console.error('Master catalogs / project check error:', err);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Digitopper Tracker Backend running on port ${port} (0.0.0.0)`);
  });
});
