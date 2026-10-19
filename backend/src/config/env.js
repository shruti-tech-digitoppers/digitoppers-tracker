const dotenv = require('dotenv');
dotenv.config();

let rawMongoUri = process.env.MONGODB_URI || process.env.MONGO_URI_DEV || process.env.MONGO_URI_PROD;
if (!rawMongoUri && process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
  const user = process.env.MONGODB_USERNAME.trim();
  const pwd = encodeURIComponent(process.env.MONGODB_PASSWORD.trim());
  rawMongoUri = `mongodb+srv://${user}:${pwd}@cluster0.10i2tpq.mongodb.net/digitoppers_db?retryWrites=true&w=majority&appName=Cluster0`;
}
if (!rawMongoUri) {
  rawMongoUri = 'mongodb://localhost:27017/digitoppers_db';
}
const mongoUri = rawMongoUri ? rawMongoUri.trim().replace(/^["']|["']$/g, '') : rawMongoUri;
const jwtSecret = (process.env.JWT_SECRET || 'super_secret_jwt_key_digitoppers_core_2026').trim().replace(/^["']|["']$/g, '');
const jwtRefreshSecret = (process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_digitoppers_core_2026').trim().replace(/^["']|["']$/g, '');

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
