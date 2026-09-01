const Employee = require('../employees/employee.model');
const { generateToken } = require('../../core/auth');
const { AppError } = require('../../core/errors');

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      throw new AppError('Please provide email and password.', 400, 'MISSING_CREDENTIALS');
    }

    const employee = await Employee.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!employee) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (!employee.isActive) {
      throw new AppError('Your account has been deactivated. Please contact admin.', 403, 'ACCOUNT_INACTIVE');
    }

    const token = generateToken(employee);
    employee.passwordHash = undefined;
    return { token, employee };
  }
}

module.exports = new AuthService();