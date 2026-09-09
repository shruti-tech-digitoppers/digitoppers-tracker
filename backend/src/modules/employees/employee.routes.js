const express = require('express');
const router = express.Router();
const employeeController = require('./employee.controller');
const { protect } = require('../../core/auth');
const { restrictToGlobal } = require('../../core/authorization');
const { GLOBAL_ROLES } = require('../../core/constants');

router.use(protect);

router.route('/')
  .get(employeeController.getAll)
  .post(restrictToGlobal(GLOBAL_ROLES.ADMIN), employeeController.create);

router.route('/:id')
  .get(employeeController.getById)
  .patch(restrictToGlobal(GLOBAL_ROLES.ADMIN), employeeController.update);

router.patch('/:id/status', restrictToGlobal(GLOBAL_ROLES.ADMIN), employeeController.updateStatus);

module.exports = router;
