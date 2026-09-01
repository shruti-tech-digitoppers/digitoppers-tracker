const express = require('express');
const router = express.Router();
const projectController = require('./project.controller');
const { protect } = require('../../core/auth');
const { restrictToGlobal, verifyProjectPermission } = require('../../core/authorization');
const { GLOBAL_ROLES, DESIGNATIONS } = require('../../core/constants');

router.use(protect);

router.route('/')
  .get(projectController.getAll)
  .post(restrictToGlobal(GLOBAL_ROLES.ADMIN), projectController.create);

router.route('/:id')
  .get(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER, DESIGNATIONS.CONTRIBUTOR, DESIGNATIONS.VIEWER]), projectController.getById)
  .patch(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER]), projectController.update);

router.patch('/:id/archive', restrictToGlobal(GLOBAL_ROLES.ADMIN), projectController.archive);

router.route('/:projectId/members')
  .get(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER, DESIGNATIONS.VIEWER]), projectController.getMembers)
  .post(verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER]), projectController.upsertMember);

router.delete('/:projectId/members/:employeeId', verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER]), projectController.removeMember);

module.exports = router;
