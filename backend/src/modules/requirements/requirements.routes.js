const express = require('express');
const requirementsController = require('./requirements.controller');
const { protect } = require('../../core/auth');

const router = express.Router();

router.route('/:projectId')
  .get(protect, requirementsController.getRequirements)
  .put(protect, requirementsController.saveRequirements);

module.exports = router;