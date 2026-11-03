const express = require('express');
const router = express.Router();
const controller = require('./timeline-nodes.controller');

// Hierarchical tree view of static timeline nodes
router.get('/tree', (req, res, next) => controller.getTree(req, res, next));

// Seed static catalog into 'timeline_nodes' collection
router.post('/seed', (req, res, next) => controller.seed(req, res, next));

// Check if a stage has substages
router.get('/:id/has-substages', (req, res, next) => controller.checkHasSubstages(req, res, next));

// Standard CRUD endpoints
router.get('/', (req, res, next) => controller.getAll(req, res, next));
router.get('/:id', (req, res, next) => controller.getById(req, res, next));
router.post('/', (req, res, next) => controller.create(req, res, next));
router.put('/:id', (req, res, next) => controller.update(req, res, next));
router.delete('/:id', (req, res, next) => controller.delete(req, res, next));

module.exports = router;

