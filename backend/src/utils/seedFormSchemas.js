const mongoose = require('mongoose');
const formSchemasService = require('../modules/form-schemas/form-schemas.service');

async function seedFormSchemas(force = false) {
  console.log('\n========================================================');
  console.log('📋 SEEDING MASTER FORM SCHEMAS (form_schemas collection)');
  console.log('========================================================');

  try {
    const result = await formSchemasService.seedMasterFormSchemas(force);
    console.log('✅ Seed result:', JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.error('❌ Failed to seed master form schemas:', err.message);
    throw err;
  }
}

// Allow direct CLI execution: node backend/src/utils/seedFormSchemas.js [--force]
if (require.main === module) {
  const connectDB = require('../config/database');

  connectDB()
    .then(async () => {
      const forceReset = process.argv.includes('--force');
      await seedFormSchemas(forceReset);
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = { seedFormSchemas };
