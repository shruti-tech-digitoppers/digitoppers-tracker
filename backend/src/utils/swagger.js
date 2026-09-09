const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Digitopper Project Tracker API',
    version: '1.0.0',
    description: 'API Documentation for Digitopper Project Tracker Backend'
  },
  servers: [{ url: 'http://localhost:5000/api/v1' }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Employee Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { email: { type: 'string' }, password: { type: 'string' } }
              }
            }
          }
        },
        responses: { '200': { description: 'Successful login' } }
      }
    }
  }
};

module.exports = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
