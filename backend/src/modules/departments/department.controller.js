const Department = require('./department.model');
const { AppError } = require('../../core/errors');

// GET /api/v1/departments
exports.getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/departments/:id
exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return next(new AppError('Department not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/departments
exports.createDepartment = async (req, res, next) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/departments/:id
exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!department) {
      return next(new AppError('Department not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};
