const app = require('./src/app');
const connectDB = require('./src/config/database');
const { port } = require('./src/config/env');

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Digitopper Tracker Backend running on port ${port}`);
  });
});
