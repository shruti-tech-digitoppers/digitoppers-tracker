const mongoose = require('mongoose');
const { mongoUri } = require('./env');

let memoryServer = null;

const connectDB = async () => {
  try {
    console.log('📡 Attempting MongoDB connection...');
    
    // First try connecting to configured URI
    let connected = false;
    if (mongoUri && !mongoUri.includes('placeholder')) {
      try {
        const conn = await mongoose.connect(mongoUri, {
          autoIndex: true,
          family: 4,
          serverSelectionTimeoutMS: 3500
        });
        console.log(`✅ MongoDB Connected to Remote/Primary: ${conn.connection.host}`);
        connected = true;
      } catch (remoteErr) {
        console.warn(`⚠️ Primary MongoDB connection failed (${remoteErr.message}). Switching to Embedded Memory Server...`);
      }
    }

    if (!connected) {
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
