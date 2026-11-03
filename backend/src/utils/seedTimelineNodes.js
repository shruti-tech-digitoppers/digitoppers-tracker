const mongoose = require('mongoose');
const timelineNodesService = require('../modules/timeline-nodes/timeline-nodes.service');

async function seedTimelineNodes(force = false) {
  console.log('\n========================================================');
  console.log('📌 SEEDING STATIC TIMELINE NODES (timeline_nodes collection)');
  console.log('========================================================');

  try {
    const result = await timelineNodesService.seedStaticTimelineNodes(force);
    console.log('✅ Seed result:', JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.error('❌ Failed to seed static timeline nodes:', err.message);
    throw err;
  }
}

// Allow direct CLI execution: node backend/src/utils/seedTimelineNodes.js [--force]
if (require.main === module) {
  const connectDB = require('../config/database');

  connectDB()
    .then(async () => {
      const forceReset = process.argv.includes('--force');
      await seedTimelineNodes(forceReset);
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = { seedTimelineNodes };
