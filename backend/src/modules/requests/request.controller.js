const requestService = require('./request.service');

class RequestController {
  async getNextRequestId(req, res, next) {
    try {
      const nextId = await requestService.generateNextRequestId();
      res.status(200).json({
        success: true,
        data: { nextRequestId: nextId }
      });
    } catch (err) {
      next(err);
    }
  }

  async createRequest(req, res, next) {
    try {
      const employeeId = req.employee?._id || req.employee?.id || req.user?.id;
      const request = await requestService.createRequest(req.body, employeeId);
      res.status(201).json({
        success: true,
        message: 'Project request submitted successfully.',
        data: { request }
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllRequests(req, res, next) {
    try {
      const requests = await requestService.getAllRequests(req.employee, req.query);
      res.status(200).json({
        success: true,
        data: { requests, total: requests.length }
      });
    } catch (err) {
      next(err);
    }
  }

  async getRequestById(req, res, next) {
    try {
      const request = await requestService.getRequestById(req.params.id);
      res.status(200).json({
        success: true,
        data: { request }
      });
    } catch (err) {
      next(err);
    }
  }

  async approveRequest(req, res, next) {
    try {
      const employeeId = req.employee?._id || req.employee?.id || req.user?.id;
      const result = await requestService.approveRequest(req.params.id, employeeId, req.body);
      res.status(200).json({
        success: true,
        message: 'Project request confirmed and initialized successfully!',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async rejectRequest(req, res, next) {
    try {
      const employeeId = req.employee?._id || req.employee?.id || req.user?.id;
      const request = await requestService.rejectRequest(req.params.id, employeeId, req.body);
      res.status(200).json({
        success: true,
        message: 'Project request rejected.',
        data: { request }
      });
    } catch (err) {
      next(err);
    }
  }

  async getDashboardProjects(req, res, next) {
    try {
      const projects = await requestService.getAvailableDashboardProjects();
      res.status(200).json({
        success: true,
        data: { projects, total: projects.length }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RequestController();
