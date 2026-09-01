const Employee = require('./employee.model');
const { AppError } = require('../../core/errors');

class EmployeeService {
  async createEmployee(employeeData) {
    const existing = await Employee.findOne({ $or: [{ email: employeeData.email }, { employeeCode: employeeData.employeeCode }] });
    if (existing) {
      throw new AppError('Employee with this email or employee code already exists.', 409, 'DUPLICATE_EMPLOYEE');
    }
    const employee = await Employee.create(employeeData);
    employee.passwordHash = undefined;
    return employee;
  }

  async getAllEmployees(query = {}) {
    const filter = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.globalRole) filter.globalRole = query.globalRole;
    return await Employee.find(filter).select('-passwordHash').sort({ createdAt: -1 });
  }

  async getEmployeeById(id) {
    const employee = await Employee.findById(id).select('-passwordHash');
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  }

  async updateEmployee(id, updateData) {
    delete updateData.passwordHash; // Handled separately if needed
    const employee = await Employee.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-passwordHash');
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  }

  async updateStatus(id, isActive) {
    const employee = await Employee.findByIdAndUpdate(id, { isActive }, { new: true }).select('-passwordHash');
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  }
}

module.exports = new EmployeeService();
