const express = require('express');
const router = express.Router();
const departmentController = require('./department.controller');
const { protect, restrictTo } = require('../../core/auth');

router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);

// Protected mutation routes
router.use(protect);
router.post('/', restrictTo('ADMIN'), departmentController.createDepartment);
router.put('/:id', restrictTo('ADMIN'), departmentController.updateDepartment);

module.exports = router;
