const connectDB = require('../config/database');
const mongoose = require('mongoose');

async function check() {
  await connectDB();
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('--- Collections in DB ---');
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  ${c.name}: ${count}`);
  }

  const projects = await mongoose.connection.collection('projects').find({}).toArray();
  console.log('\n--- Projects List ---');
  projects.forEach((p) => {
    console.log(`  code/projectId: ${p.projectId || p.code || p.id || p._id} | name: ${p.projectName || p.title || p.name}`);
  });

  await mongoose.disconnect();
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});

