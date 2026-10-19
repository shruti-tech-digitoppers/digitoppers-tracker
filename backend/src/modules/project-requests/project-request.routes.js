const express = require('express');
const router = express.Router();
const controller = require('./project-request.controller');
const { protect } = require('../../core/auth');
const { canCreateOrRequestProject } = require('../../core/authorization');

router.use(protect);

router.get('/next-id', controller.getNextRequestId);
router.get('/dashboard-projects', controller.getDashboardProjects);
router.post('/', canCreateOrRequestProject, controller.createRequest);
router.get('/', controller.getAllRequests);
router.get('/:id', controller.getRequestById);
router.post('/:id/approve', controller.approveRequest);
router.post('/:id/reject', controller.rejectRequest);

module.exports = router;
