const express = require('express');
const router = express.Router();
const employeeController = require('./employee.controller');
const { protect } = require('../../core/auth');
const { restrictToGlobal } = require('../../core/authorization');
const { GLOBAL_ROLES } = require('../../core/constants');

router.use(protect, restrictToGlobal(GLOBAL_ROLES.ADMIN));

router.route('/')
  .get(employeeController.getAll)
  .post(employeeController.create);

router.route('/:id')
  .get(employeeController.getById)
  .patch(employeeController.update);

router.patch('/:id/status', employeeController.updateStatus);

module.exports = router;
