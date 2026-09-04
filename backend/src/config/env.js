const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI_DEV || process.env.MONGO_URI_PROD || 'mongodb://localhost:27017/digitoppers_db';
const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_digitoppers_core_2026';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_digitoppers_core_2026';

if (!mongoUri) {
  console.error('FATAL ERROR: MongoDB connection URI is missing.');
  process.exit(1);
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongoUri,
  coreBackendUrl: process.env.CORE_BACKEND_URL || 'http://localhost:3000',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshSecret,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};
