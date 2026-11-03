const tasksService = require('./tasks.service');

class TasksController {
  async getTasks(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const tasks = await tasksService.getTasksByProject(projectId, req.query);
      res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
      next(err);
    }
  }

  async getTasksByPhase(req, res, next) {
    try {
      const tasks = await tasksService.getTasksByPhase(req.params.phaseId);
      res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (err) {
      next(err);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const task = await tasksService.getTaskById(req.params.id);
      res.status(200).json({ success: true, data: task });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const task = await tasksService.updateTaskStatus(req.params.id, req.body.status, req.employee);
      res.status(200).json({ success: true, data: task, message: 'Task status updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async assign(req, res, next) {
    try {
      const task = await tasksService.assignTask(req.params.id, req.body.employeeId);
      res.status(200).json({ success: true, data: task, message: 'Task assigned successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getForm(req, res, next) {
    try {
      const data = await tasksService.getTaskForm(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async saveForm(req, res, next) {
    try {
      const result = await tasksService.saveTaskForm(req.params.id, req.body, req.employee);
      res.status(200).json({ success: true, data: result, message: 'Form inputs saved successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TasksController();
