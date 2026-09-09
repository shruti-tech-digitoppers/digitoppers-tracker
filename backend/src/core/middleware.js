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

  // Development & localhost bypass check
  const isDevOrLocal = (req) => {
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) return true;
    if (req.method === 'OPTIONS') return true;
    const clientIp = req.ip || req.connection?.remoteAddress || '';
    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp.includes('localhost')) {
      return true;
    }
    return false;
  };

  // 1. Strict Limiter for Auth / Login endpoints (Anti-Brute Force)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Up to 100 login attempts per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    skip: isDevOrLocal,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_AUTH_ATTEMPTS',
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
      }
    }
  });

  // 2. High-throughput Limiter for general operational API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // 5000 requests per 15 mins for rich dashboard / timeline operations
    standardHeaders: true,
    legacyHeaders: false,
    skip: isDevOrLocal,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please slow down your requests.'
      }
    }
  });

  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/', apiLimiter);
};

module.exports = { setupSecurityMiddleware };
