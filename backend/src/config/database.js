const mongoose = require('mongoose');
const { mongoUri } = require('./env');

let memoryServer = null;

const connectDB = async () => {
  try {
    const masked = mongoUri ? mongoUri.replace(/\/\/([^:]+):([^@]+)@/, (match, user) => `//${user}:****@`) : 'NONE';
    console.log(`📡 Attempting MongoDB connection to: ${masked}`);
    
    // First try connecting to configured URI
    let connected = false;
    if (mongoUri && !mongoUri.includes('placeholder')) {
      try {
        const conn = await mongoose.connect(mongoUri, {
          autoIndex: true,
          family: 4,
          serverSelectionTimeoutMS: 6000
        });
        console.log(`✅ MongoDB Connected to Remote/Primary: ${conn.connection.host}`);
        connected = true;
      } catch (remoteErr) {
        // If auth failed and authSource wasn't specified, try with authSource=admin
        if (mongoUri.startsWith('mongodb+srv://') && !mongoUri.includes('authSource=')) {
          const separator = mongoUri.includes('?') ? '&' : '?';
          const adminAuthUri = `${mongoUri}${separator}authSource=admin`;
          try {
            console.log('🔄 Retrying MongoDB connection with authSource=admin...');
            const conn = await mongoose.connect(adminAuthUri, {
              autoIndex: true,
              family: 4,
              serverSelectionTimeoutMS: 6000
            });
            console.log(`✅ MongoDB Connected to Remote/Primary with authSource=admin: ${conn.connection.host}`);
            connected = true;
          } catch (retryErr) {
            console.warn(`⚠️ authSource=admin retry failed: ${retryErr.message}`);
          }
        }
        if (!connected) {
          console.warn(`⚠️ Primary MongoDB connection failed (${remoteErr.message}). Switching to Embedded Memory Server...`);
        }
      }
    }

    if (!connected) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ CRITICAL PRODUCTION ERROR: Primary MongoDB connection failed. Memory-server fallback is disabled in production.');
        console.error('👉 Please verify your MONGODB_URI and ensure 0.0.0.0/0 (or your server IP) is allowed in MongoDB Atlas Network Access.');
        process.exit(1);
      }
      const { MongoMemoryReplSet } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      const memUri = memoryServer.getUri();
      console.log(`🚀 Starting Embedded MongoDB Replica Set at: ${memUri}`);
      
      const conn = await mongoose.connect(memUri, {
        autoIndex: true,
        family: 4
      });
      console.log(`✅ MongoDB Connected to Embedded Local Engine: ${conn.connection.host}`);
    }

    // Connection Event Listeners

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB runtime error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected.');
    });
  } catch (error) {
    console.error(`❌ Critical Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
