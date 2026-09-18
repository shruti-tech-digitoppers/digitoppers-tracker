const express = require('express');
const router = express.Router();
const projectController = require('./project.controller');
const { protect, optionalProtect } = require('../../core/auth');
const { restrictToGlobal, verifyProjectPermission, canCreateOrRequestProject } = require('../../core/authorization');
const { GLOBAL_ROLES, DESIGNATIONS } = require('../../core/constants');

// GET /api/v1/projects (public dashboard stats & project list)
router.get('/', optionalProtect, projectController.getAll);

// GET /api/v1/projects/:id (public project details for tracker view)
router.get('/:id', optionalProtect, projectController.getById);

// All other project management routes require authentication
router.use(protect);

router.route('/:id')
  .patch(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER]), projectController.update);

router.patch('/:id/archive', restrictToGlobal(GLOBAL_ROLES.ADMIN), projectController.archive);

router.route('/:projectId/members')
  .get(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER, DESIGNATIONS.VIEWER]), projectController.getMembers)
  .post(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER]), projectController.upsertMember);

router.delete('/:projectId/members/:employeeId', verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER]), projectController.removeMember);

module.exports = router;

