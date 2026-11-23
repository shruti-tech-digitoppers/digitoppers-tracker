const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('./timeline-data.controller');
const nodeStatusController = require('./node-status.controller');
const { protect, optionalProtect } = require('../../core/auth');
const { verifyProjectPermission } = require('../../core/authorization');
const { DESIGNATIONS } = require('../../core/constants');

// 1. Timeline Hierarchy & Roadmap (Read-only GETs accessible with optional auth)
router.get('/', optionalProtect, (req, res, next) => {
  if (req.query.format === 'raw' || req.query.list === 'true') {
    return controller.getByProject(req, res, next);
  }
  return controller.getTimeline(req, res, next);
});

router.get('/roadmap', optionalProtect, (req, res, next) => controller.getRoadmap(req, res, next));
router.get('/tree', optionalProtect, (req, res, next) => controller.getHierarchyTree(req, res, next));

// Node detail, children & form schema (Read-only GETs accessible with optional auth)
router.get('/nodes/:nodeId', optionalProtect, (req, res, next) => controller.getNode(req, res, next));
router.get('/nodes/:nodeId/children', optionalProtect, (req, res, next) => controller.getChildren(req, res, next));
router.get('/nodes/:nodeId/form', optionalProtect, (req, res, next) => controller.getForm(req, res, next));
router.get('/nodes/:nodeId/dependencies', optionalProtect, (req, res, next) => nodeStatusController.checkDependencies(req, res, next));
router.get('/nodes/:nodeId/status-check', optionalProtect, (req, res, next) => nodeStatusController.checkEligibility(req, res, next));

// 2. Protected routes for node mutations (updates, assigns, form submissions)
router.use(protect);

// Initialize project timeline
router.post('/initialize', (req, res, next) => controller.initialize(req, res, next));

// Node assignment (supports both /assignment and /assign)
router.patch('/nodes/:nodeId/assignment', (req, res, next) => controller.assignNode(req, res, next));
router.patch('/nodes/:nodeId/assign', (req, res, next) => controller.assignNode(req, res, next));

// Node status update
router.patch('/nodes/:nodeId/status', (req, res, next) => nodeStatusController.updateStatus(req, res, next));

// Node form submissions & updates
router.put('/nodes/:nodeId/form', (req, res, next) => controller.updateForm(req, res, next));
router.patch('/nodes/:nodeId/form-data', (req, res, next) => controller.updateFormData(req, res, next));
router.patch('/nodes/:nodeId/due-date', (req, res, next) => controller.updateDueDate(req, res, next));
router.patch('/nodes/:nodeId/remarks', (req, res, next) => controller.updateRemarks(req, res, next));

// Generic save
router.put('/nodes/:nodeId', (req, res, next) => controller.saveNodeData(req, res, next));
router.post('/nodes/:nodeId', (req, res, next) => controller.saveNodeData(req, res, next));

// Reset timeline
router.delete('/reset', (req, res, next) => controller.resetTimeline(req, res, next));

module.exports = router;
