const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('./project-schools.controller');
const { protect } = require('../../core/auth');

router.get('/project/:projectId/summary', controller.getProjectSchoolsSummary);
router.get('/project/:projectId', controller.getProjectSchoolsByProject);
router.get('/', controller.getAllProjectSchools);
router.get('/:id', controller.getProjectSchoolsById);

// Protected update routes
router.use(protect);
router.patch('/project/:projectId/school/:schoolId', controller.updateSchoolDeployment);

module.exports = router;
