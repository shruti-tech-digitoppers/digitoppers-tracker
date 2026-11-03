const express = require('express');
const requirementsController = require('./requirements.controller');
const { protect } = require('../../core/auth');

const router = express.Router();

// School-specific requirement endpoints
router.route('/:projectId/schools')
  .get(protect, requirementsController.getProjectSchoolRequirements)
  .put(protect, requirementsController.updateProjectSchoolRequirements);

router.route('/:projectId/schools/:schoolId')
  .get(protect, requirementsController.checkSchoolRequirements);

// Project master requirement endpoints
router.route('/:projectId')
  .get(protect, requirementsController.getRequirements)
  .put(protect, requirementsController.saveRequirements);

module.exports = router;
