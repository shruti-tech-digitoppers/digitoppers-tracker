const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('./form-schemas.controller');

// Seed master schemas from config
router.post('/seed', (req, res, next) => controller.seed(req, res, next));

// Combined Schema + FormData values
router.get('/:nodeId/data', (req, res, next) => controller.getSchemaWithFormData(req, res, next));
router.put('/:nodeId/data', (req, res, next) => controller.saveFormData(req, res, next));
router.post('/:nodeId/data', (req, res, next) => controller.saveFormData(req, res, next));

// Schema definitions
router.get('/:nodeId', (req, res, next) => controller.getSchema(req, res, next));
router.put('/:nodeId', (req, res, next) => controller.saveOrUpdateSchema(req, res, next));
router.post('/:nodeId', (req, res, next) => controller.saveOrUpdateSchema(req, res, next));

// List / Create schemas
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.post('/', (req, res, next) => controller.saveOrUpdateSchema(req, res, next));

module.exports = router;
