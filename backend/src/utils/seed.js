const seedFromDashboard = require('./seedFromDashboard');

const seedDatabase = async () => {
  return await seedFromDashboard();
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
