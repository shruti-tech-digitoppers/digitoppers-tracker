const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { AppError } = require('./errors');
const Employee = require('../modules/employees/employee.model');

const generateToken = (employee) => {
  return jwt.sign(
    { 
      id: employee._id, 
      email: employee.email, 
      globalRole: employee.globalRole,
      name: employee.name,
      employeeCode: employee.employeeCode
    },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError('Not authenticated. Please log in to access this resource.', 401, 'UNAUTHORIZED');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Your session has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token. Please log in again.', 401, 'INVALID_TOKEN');
    }

    const employee = await Employee.findById(decoded.id);
    if (!employee) {
      throw new AppError('The user belonging to this session no longer exists.', 401, 'USER_NOT_FOUND');
    }

    if (!employee.isActive) {
      throw new AppError('Your account has been deactivated. Please contact administrator.', 403, 'ACCOUNT_INACTIVE');
    }

    req.employee = employee;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.employee || !roles.includes(req.employee.globalRole)) {
      return next(new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'));
    }
    next();
  };
};

module.exports = { generateToken, protect, restrictTo };
