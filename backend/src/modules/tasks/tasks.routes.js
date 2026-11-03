const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('./tasks.controller');
const { protect, optionalProtect } = require('../../core/auth');

// Public/optional read for queries & inspections
router.get('/', optionalProtect, controller.getTasks);
router.get('/:id', optionalProtect, controller.getTaskById);
router.get('/:id/form', optionalProtect, controller.getForm);

// Protected actions
router.use(protect);
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id/assignment', controller.assign);
router.put('/:id/form', controller.saveForm);

module.exports = router;
