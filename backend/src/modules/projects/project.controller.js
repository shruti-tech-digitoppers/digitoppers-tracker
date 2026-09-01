const projectService = require('./project.service');

class ProjectController {
  async create(req, res, next) {
    try {
      const project = await projectService.createProject(req.body, req.employee._id);
      res.status(201).json({ success: true, data: project, message: 'Project initialized successfully' });
    } catch (err) { next(err); }
  }

  async getAll(req, res, next) {
    try {
      const projects = await projectService.getAllProjects(req.employee, req.query);
      res.status(200).json({ success: true, count: projects.length, data: projects });
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const project = await projectService.getProjectById(req.params.id);
      res.status(200).json({ success: true, data: project });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const project = await projectService.updateProject(req.params.id, req.body, req.employee._id);
      res.status(200).json({ success: true, data: project, message: 'Project updated successfully' });
    } catch (err) { next(err); }
  }

  async archive(req, res, next) {
    try {
      const project = await projectService.archiveProject(req.params.id, req.employee._id);
      res.status(200).json({ success: true, data: project, message: 'Project archived successfully' });
    } catch (err) { next(err); }
  }

  async getMembers(req, res, next) {
    try {
      const members = await projectService.getMembers(req.params.projectId);
      res.status(200).json({ success: true, count: members.length, data: members });
    } catch (err) { next(err); }
  }

  async upsertMember(req, res, next) {
    try {
      const { employeeId, designation } = req.body;
      const member = await projectService.addOrUpdateMember(req.params.projectId, employeeId, designation, req.employee._id);
      res.status(200).json({ success: true, data: member, message: 'Member assigned successfully' });
    } catch (err) { next(err); }
  }

  async removeMember(req, res, next) {
    try {
      const member = await projectService.removeMember(req.params.projectId, req.params.employeeId, req.employee._id);
      res.status(200).json({ success: true, data: member, message: 'Member removed successfully' });
    } catch (err) { next(err); }
  }
}

module.exports = new ProjectController();
