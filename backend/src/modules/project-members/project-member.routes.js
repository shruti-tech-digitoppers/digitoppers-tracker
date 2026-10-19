const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('./project-member.controller');
const { protect } = require('../../core/auth');

router.get('/project/:projectId', controller.getProjectMembersByProject);
router.get('/', controller.getAllProjectMembers);
router.get('/:id', controller.getProjectMemberById);

// Protected routes
router.use(protect);
router.post('/project/:projectId', controller.addProjectMember);
router.post('/', controller.addProjectMember);
router.patch('/:id', controller.updateProjectMember);
router.put('/:id', controller.updateProjectMember);
router.delete('/:id', controller.removeProjectMember);

module.exports = router;
