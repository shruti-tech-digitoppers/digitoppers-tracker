const mongoose = require('mongoose');
const connectDB = require('../src/config/database');

async function inspectDatabase() {
  try {
    await connectDB();

    console.log('\n======================================================');
    console.log('🔍 MONGODB DATABASE INSPECTION — DIGITOPPERS DB');
    console.log('======================================================\n');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Total Active Collections in MongoDB: ${collections.length}\n`);

    const summary = [];
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      summary.push({ name: col.name, count });
    }

    summary.sort((a, b) => b.count - a.count);

    let totalDocs = 0;
    summary.forEach((item, index) => {
      totalDocs += item.count;
      console.log(`  ${String(index + 1).padStart(2, ' ')}. [${item.name.padEnd(22)}] → ${String(item.count).padStart(4, ' ')} Documents`);
    });

    console.log('\n------------------------------------------------------');
    console.log(`📊 Total Documents Across All Collections: ${totalDocs}`);
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Inspection error:', err);
    process.exit(1);
  }
}

inspectDatabase();
