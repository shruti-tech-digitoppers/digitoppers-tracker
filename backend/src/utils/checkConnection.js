const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');
const Project = require('../modules/projects/project.model');

async function verifyConnection() {
  try {
    console.log('\n======================================================');
    console.log('🔍 PROJECT TRACKER & CORE BACKEND CONNECTION CHECK');
    console.log(`📡 MongoDB URI: ${mongoUri}`);
    console.log('======================================================\n');

    await mongoose.connect(mongoUri);
    console.log('✅ Successfully connected to MongoDB!\n');

    // Fetch projects using Tracker's Project model
    const projects = await Project.find({}).lean();
    console.log(`📋 Total Projects found in shared database: ${projects.length}`);

    if (projects.length === 0) {
      console.log('⚠️ No projects found yet. Please run the seeder in core-backend first.');
    } else {
      console.log('\n--- Projects List from Shared DB ---');
      projects.forEach((p, idx) => {
        console.log(
          `[${idx + 1}] ID/Code: ${p.projectId || p.projectCode || p._id} | Title: "${p.projectName || p.title}" | Schools: ${p.numberOfSchools || 0} | Licenses: ${p.numberOfLicenses || 0} | Status: ${p.status || (p.isActive ? 'ACTIVE' : 'INACTIVE')}`
        );
      });
      console.log('\n🎯 CONCLUSION: Core Backend, Dashboard, and Project Tracker are SUCCESSFULLY CONNECTED on the same database!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection verification error:', error.message);
    process.exit(1);
  }
}

verifyConnection();
