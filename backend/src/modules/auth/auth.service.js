const Employee = require('../employees/employee.model');
const { generateToken } = require('../../core/auth');
const { AppError } = require('../../core/errors');

class AuthService {
  async login(email, password) {
    if (!email || !password) {
      throw new AppError('Please provide email and password.', 400, 'MISSING_CREDENTIALS');
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // Enforce official @digitoppers.com domain
    if (!cleanEmail.endsWith('@digitoppers.com')) {
      throw new AppError('Invalid email domain. Only official @digitoppers.com email addresses are allowed.', 400, 'INVALID_EMAIL_DOMAIN');
    }

    // Direct lookup by email only
    const employee = await Employee.findOne({ email: cleanEmail }).select('+passwordHash');
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
