const rateLimit = require('express-rate-limit'); // Standard middleware handler
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const setupSecurityMiddleware = (app) => {
  app.use(helmet());
  app.use(cors({ origin: '*' }));
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
