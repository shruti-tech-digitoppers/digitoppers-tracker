const phasesService = require('./phases.service');

class PhasesController {
  async getPhases(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const phases = await phasesService.getPhasesByProject(projectId);
      res.status(200).json({ success: true, count: phases.length, data: phases });
    } catch (err) {
      next(err);
    }
  }

  async getPhaseById(req, res, next) {
    try {
      const phase = await phasesService.getPhaseById(req.params.id);
      res.status(200).json({ success: true, data: phase });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const phase = await phasesService.updatePhaseStatus(req.params.id, req.body.status, req.employee);
      res.status(200).json({ success: true, data: phase, message: 'Phase status updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async assign(req, res, next) {
    try {
      const phase = await phasesService.assignPhase(req.params.id, req.body.employeeId);
      res.status(200).json({ success: true, data: phase, message: 'Phase assigned successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PhasesController();
