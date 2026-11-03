const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('./phases.controller');
const { protect, optionalProtect } = require('../../core/auth');

// Public/optional read for roadmap view
router.get('/', optionalProtect, controller.getPhases);
router.get('/:id', optionalProtect, controller.getPhaseById);

// Protected actions
router.use(protect);
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id/assignment', controller.assign);

module.exports = router;
