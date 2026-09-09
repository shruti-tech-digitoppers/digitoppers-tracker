const employeeService = require('./employee.service');

class EmployeeController {
  async create(req, res, next) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      res.status(201).json({ success: true, data: employee, message: 'Employee created successfully' });
    } catch (err) { next(err); }
  }

  async getAll(req, res, next) {
    try {
      const employees = await employeeService.getAllEmployees(req.query);
      res.status(200).json({ success: true, count: employees.length, data: employees });
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      res.status(200).json({ success: true, data: employee });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      res.status(200).json({ success: true, data: employee, message: 'Employee updated successfully' });
    } catch (err) { next(err); }
  }

  async updateStatus(req, res, next) {
    try {
      const employee = await employeeService.updateStatus(req.params.id, req.body.isActive);
      res.status(200).json({ success: true, data: employee, message: 'Employee status updated successfully' });
    } catch (err) { next(err); }
  }
}

module.exports = new EmployeeController();
