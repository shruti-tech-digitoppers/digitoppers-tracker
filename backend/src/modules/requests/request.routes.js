const express = require('express');
const router = express.Router();
const requestController = require('./request.controller');
const { protect } = require('../../core/auth');
const { canCreateOrRequestProject } = require('../../core/authorization');

router.use(protect);

router.get('/next-id', requestController.getNextRequestId);
router.get('/dashboard-projects', requestController.getDashboardProjects);
router.post('/', canCreateOrRequestProject, requestController.createRequest);
router.get('/', requestController.getAllRequests);
router.get('/:id', requestController.getRequestById);
router.post('/:id/approve', requestController.approveRequest);
router.post('/:id/reject', requestController.rejectRequest);

module.exports = router;
