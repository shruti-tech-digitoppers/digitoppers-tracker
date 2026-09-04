const rateLimit = require('express-rate-limit'); // Standard middleware handler
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const setupSecurityMiddleware = (app) => {
  app.use(helmet({ contentSecurityPolicy: false }));
  
  const extraOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [];
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4400', 'http://localhost:5000'];
  const whitelist = [...defaultOrigins, ...extraOrigins];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin) || process.env.CORS_ORIGIN === '*' || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP, please try again later.' } }
  });
  app.use('/api/', limiter);
};

module.exports = { setupSecurityMiddleware };
