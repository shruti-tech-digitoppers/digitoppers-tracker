const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Project = require('../modules/projects/project.model');

async function setStatus() {
  try {
    await connectDB();
    console.log('Connected to DB');

    // Find project PRJ-DASH-002 or PRJ-DASH-003 and update to ON_HOLD
    const updated = await Project.findOneAndUpdate(
      { $or: [{ projectId: 'PRJ-DASH-002' }, { projectId: 'PRJ-DASH-003' }] },
      { $set: { status: 'ON_HOLD' } },
      { new: true }
    );

    if (updated) {
      console.log(`✅ Project ${updated.projectId} (${updated.projectName}) status set to ON_HOLD!`);
    } else {
      // Fallback to any second project
      const anyProject = await Project.findOne();
      if (anyProject) {
        anyProject.status = 'ON_HOLD';
        await anyProject.save();
        console.log(`✅ Project ${anyProject.projectId} status set to ON_HOLD!`);
      }
    }

    const projects = await Project.find({}, 'projectId projectName status');
    console.log('\n📊 Current Projects Status Summary:');
    projects.forEach(p => console.log(` - [${p.status}] ${p.projectId}: ${p.projectName}`));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

setStatus();
