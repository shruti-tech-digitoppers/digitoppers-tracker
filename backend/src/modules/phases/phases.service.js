const mongoose = require('mongoose');
const Phase = require('./phase.model');
const Task = require('../tasks/task.model');
const Employee = require('../employees/employee.model');
const { AppError } = require('../../core/errors');
const { NODE_STATUSES } = require('../../core/constants');

class PhasesService {
  async getPhasesByProject(projectId) {
    if (!projectId) {
      throw new AppError('Project ID is required', 400, 'PROJECT_ID_REQUIRED');
    }

    const idStr = String(projectId).trim();
    const isObjectId = mongoose.isValidObjectId(idStr) && idStr.length === 24;

    const query = {
      $or: [
        { projectId: idStr.toUpperCase() },
        isObjectId ? { project: new mongoose.Types.ObjectId(idStr) } : null
      ].filter(Boolean)
    };

    const phases = await Phase.find(query)
      .populate('assignedTo', 'name email employeeCode designation globalRole')
      .sort({ order: 1 });

    return phases;
  }

  async getPhaseById(phaseId) {
    if (!phaseId) {
      throw new AppError('Phase ID is required', 400, 'PHASE_ID_REQUIRED');
    }

    const phase = await Phase.findById(phaseId)
      .populate('assignedTo', 'name email employeeCode designation globalRole')
      .populate({
        path: 'tasks',
        populate: [
          { path: 'assignedTo', select: 'name email employeeCode designation' },
          { path: 'formData' }
        ]
      });

    if (!phase) {
      throw new AppError('Phase not found', 404, 'PHASE_NOT_FOUND');
    }

    return phase;
  }

  async updatePhaseStatus(phaseId, status, employee) {
    if (!Object.values(NODE_STATUSES).includes(status)) {
      throw new AppError(`Invalid status '${status}'`, 400, 'INVALID_STATUS');
    }

    const phase = await Phase.findById(phaseId);
    if (!phase) {
      throw new AppError('Phase not found', 404, 'PHASE_NOT_FOUND');
    }

    phase.status = status;
    if (status === NODE_STATUSES.COMPLETED) {
      phase.progressPercentage = 100;
      phase.endDate = phase.endDate || new Date();
    } else if (status === NODE_STATUSES.IN_PROGRESS && !phase.startDate) {
      phase.startDate = new Date();
    }

    await phase.save();
    return phase;
  }

  async assignPhase(phaseId, employeeId) {
    const phase = await Phase.findById(phaseId);
    if (!phase) {
      throw new AppError('Phase not found', 404, 'PHASE_NOT_FOUND');
    }

    if (employeeId) {
      const emp = await Employee.findById(employeeId);
      if (!emp) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }
      phase.assignedTo = emp._id;
    } else {
      phase.assignedTo = null;
    }

    await phase.save();
    return await Phase.findById(phaseId).populate('assignedTo', 'name email employeeCode designation');
  }

  async recalculatePhaseProgress(phaseId) {
    const phase = await Phase.findById(phaseId);
    if (!phase) return;

    const tasks = await Task.find({ phase: phase._id });
    if (!tasks || tasks.length === 0) return;

    const completed = tasks.filter(t => t.status === NODE_STATUSES.COMPLETED).length;
    const progress = Math.round((completed / tasks.length) * 100);

    phase.progressPercentage = progress;
    if (progress === 100 && phase.status !== NODE_STATUSES.COMPLETED) {
      phase.status = NODE_STATUSES.COMPLETED;
      phase.endDate = phase.endDate || new Date();
    } else if (progress > 0 && progress < 100 && phase.status === NODE_STATUSES.PENDING) {
      phase.status = NODE_STATUSES.IN_PROGRESS;
      phase.startDate = phase.startDate || new Date();
    }

    await phase.save();
    return phase;
  }
}

module.exports = new PhasesService();
