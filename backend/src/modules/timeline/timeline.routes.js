const express = require('express');
const router = express.Router({ mergeParams: true });
const timelineController = require('./timeline.controller');
const { protect, optionalProtect } = require('../../core/auth');
const { verifyProjectPermission } = require('../../core/authorization');
const { DESIGNATIONS } = require('../../core/constants');

// View timeline hierarchy (publicly viewable on dashboard)
router.get('/', optionalProtect, timelineController.getTimeline);

// All other timeline node inspections and updates require authentication & permissions
router.use(protect);

// Get / update individual node
router.route('/nodes/:nodeId')
  .get(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER, DESIGNATIONS.CONTRIBUTOR, DESIGNATIONS.VIEWER]), timelineController.getNode);

// Node children
router.get('/nodes/:nodeId/children', verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER, DESIGNATIONS.CONTRIBUTOR, DESIGNATIONS.VIEWER]), timelineController.getChildren);

// Assignment — PM only
router.patch('/nodes/:nodeId/assignment', verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER]), timelineController.assignNode);

// Status update — PM and Contributor
router.patch('/nodes/:nodeId/status', verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER, DESIGNATIONS.CONTRIBUTOR]), timelineController.updateStatus);

// Form get / update — PM and Contributor can update, Viewer can read
router.route('/nodes/:nodeId/form')
  .get(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER, DESIGNATIONS.CONTRIBUTOR, DESIGNATIONS.VIEWER]), timelineController.getForm)
  .put(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER, DESIGNATIONS.CONTRIBUTOR]), timelineController.updateForm);

// Reset timeline — PM only (re-initializes all nodes from current config)
router.delete('/reset', verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER]), timelineController.resetTimeline);

module.exports = router;
