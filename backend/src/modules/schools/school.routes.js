const express = require('express');
const router = express.Router({ mergeParams: true });
const schoolController = require('./school.controller');
const { protect } = require('../../core/auth');

// Public/Read-Only routes
router.get('/', schoolController.getSchools);
router.get('/summary', schoolController.getProjectSchoolProgress);
router.get('/execution', schoolController.getProjectSchoolsExecution);
router.get('/engineer/:engineerId', schoolController.getFieldEngineerSchools);
router.get('/:id', schoolController.getSchoolById);

// Protected mutation routes
router.use(protect);
router.post('/', schoolController.createSchool);
router.post('/bulk', schoolController.bulkCreateSchools);
router.put('/:id', schoolController.updateSchool);
router.patch('/:id/installation', schoolController.updateSchoolInstallation);
router.patch('/:id/training', schoolController.updateSchoolTraining);
router.post('/:schoolId/hardware/:hardwareKey/vendor-po', schoolController.raiseVendorPO);
router.post('/:schoolId/hardware/:hardwareKey/vendor-pi', schoolController.clearVendorPI);

module.exports = router;
