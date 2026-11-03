const mongoose = require('mongoose');
const Task = require('./task.model');
const TaskFormData = require('./task-form-data.model');
const Phase = require('../phases/phase.model');
const Employee = require('../employees/employee.model');
const phasesService = require('../phases/phases.service');
const { AppError } = require('../../core/errors');
const { NODE_STATUSES } = require('../../core/constants');

class TasksService {
  async getTasksByProject(projectId, query = {}) {
    if (!projectId) {
      throw new AppError('Project ID is required', 400, 'PROJECT_ID_REQUIRED');
    }

    const idStr = String(projectId).trim();
    const isObjectId = mongoose.isValidObjectId(idStr) && idStr.length === 24;

    const filter = {
      $or: [
        { projectId: idStr.toUpperCase() },
        isObjectId ? { project: new mongoose.Types.ObjectId(idStr) } : null
      ].filter(Boolean)
    };

    if (query.phaseId) {
      filter.phase = query.phaseId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.streamType) {
      filter.streamType = query.streamType;
    }

    const tasks = await Task.find(filter)
      .populate('phase', 'phaseKey title order status')
      .populate('assignedTo', 'name email employeeCode designation')
      .populate('formData')
      .sort({ order: 1 });

    return tasks;
  }

  async getTasksByPhase(phaseId) {
    if (!phaseId) {
      throw new AppError('Phase ID is required', 400, 'PHASE_ID_REQUIRED');
    }

    const tasks = await Task.find({ phase: phaseId })
      .populate('assignedTo', 'name email employeeCode designation')
      .populate('formData')
      .sort({ order: 1 });

    return tasks;
  }

  async getTaskById(taskId) {
    if (!taskId) {
      throw new AppError('Task ID is required', 400, 'TASK_ID_REQUIRED');
    }

    const task = await Task.findById(taskId)
      .populate('phase', 'phaseKey title order status assignedTo')
      .populate('parentTask', 'taskKey title status')
      .populate('assignedTo', 'name email employeeCode designation globalRole')
      .populate('subTasks')
      .populate('formData');

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    return task;
  }

  async updateTaskStatus(taskId, status, employee) {
    if (!Object.values(NODE_STATUSES).includes(status)) {
      throw new AppError(`Invalid status '${status}'`, 400, 'INVALID_STATUS');
    }

    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    task.status = status;
    await task.save();

    // Recalculate parent phase progress
    if (task.phase) {
      await phasesService.recalculatePhaseProgress(task.phase);
    }

    // Keep legacy TimelineNode in sync if linked
    if (task.timelineNodeId) {
      try {
        const TimelineNode = require('../timeline/timeline-node.model');
        await TimelineNode.findByIdAndUpdate(task.timelineNodeId, { status });
      } catch (_) {}
    }

    return await this.getTaskById(taskId);
  }

  async assignTask(taskId, employeeId) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    if (employeeId) {
      const emp = await Employee.findById(employeeId);
      if (!emp) {
        throw new AppError('Employee not found', 404, 'EMPLOYEE_NOT_FOUND');
      }
      task.assignedTo = emp._id;
    } else {
      task.assignedTo = null;
    }

    await task.save();

    // Keep legacy TimelineNode in sync if linked
    if (task.timelineNodeId) {
      try {
        const TimelineNode = require('../timeline/timeline-node.model');
        await TimelineNode.findByIdAndUpdate(task.timelineNodeId, { assignedTo: task.assignedTo });
      } catch (_) {}
    }

    return await this.getTaskById(taskId);
  }

  async getTaskForm(taskId) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const formDataDoc = await TaskFormData.findOne({ task: task._id })
      .populate('submittedBy', 'name email designation')
      .populate('references.schools', 'name schoolId address contactPerson')
      .populate('references.hardwareItems.hardware', 'name key category')
      .populate('references.solutions.solution', 'name key');

    return {
      task: {
        _id: task._id,
        taskKey: task.taskKey,
        title: task.title,
        status: task.status,
        formKey: task.formKey
      },
      formSchema: task.formSchema,
      formData: formDataDoc ? formDataDoc.inputs : {},
      references: formDataDoc ? formDataDoc.references : {}
    };
  }

  async saveTaskForm(taskId, payload, employee) {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const formValues = (payload && typeof payload.formData === 'object') ? payload.formData : (payload || {});
    const references = payload && payload.references ? payload.references : {};

    let formDataDoc = await TaskFormData.findOne({ task: task._id });
    if (formDataDoc) {
      formDataDoc.inputs = { ...(formDataDoc.inputs || {}), ...formValues };
      if (Object.keys(references).length > 0) {
        formDataDoc.references = { ...(formDataDoc.references || {}), ...references };
      }
      formDataDoc.submittedBy = employee ? employee._id : formDataDoc.submittedBy;
      formDataDoc.version += 1;
      await formDataDoc.save();
    } else {
      formDataDoc = await TaskFormData.create({
        project: task.project,
        projectId: task.projectId,
        phase: task.phase,
        task: task._id,
        taskKey: task.taskKey,
        submittedBy: employee ? employee._id : null,
        inputs: formValues,
        references: references,
        version: 1
      });
    }

    // Auto-advance task status if form is completed
    if (formValues.autoComplete === true || formValues.completed === 'YES' || formValues.status === 'COMPLETED') {
      task.status = NODE_STATUSES.COMPLETED;
      await task.save();
      await phasesService.recalculatePhaseProgress(task.phase);
    }

    // Keep legacy TimelineNode in sync if linked
    if (task.timelineNodeId) {
      try {
        const TimelineNode = require('../timeline/timeline-node.model');
        await TimelineNode.findByIdAndUpdate(task.timelineNodeId, {
          formData: formDataDoc.inputs,
          status: task.status
        });
      } catch (_) {}
    }

    return {
      success: true,
      task: await this.getTaskById(taskId),
      formData: formDataDoc.inputs,
      references: formDataDoc.references
    };
  }
}

module.exports = new TasksService();
