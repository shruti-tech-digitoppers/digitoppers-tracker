const mongoose = require('mongoose');
const TimelineData = require('./timeline-data.model');
const TimelineNodeStatic = require('../timeline-nodes/timeline-node.model');
const formSchemasService = require('../form-schemas/form-schemas.service');
const Activity = require('../activity/activity.model');
const Notification = require('../notifications/notifications.model');
const notificationService = require('../notifications/notifications.service');
const coreApi = require('../../services/core-api.service');
const timelineDependencyService = require('./timeline-dependency.service');
const { AppError } = require('../../core/errors');

class NodeStatusService {
  /**
   * Normalize projectId
   */
  _normalizeProjectId(projectId) {
    if (!projectId) return '';
    return String(projectId).toUpperCase().trim();
  }

  /**
   * Resolve any node identifier to its static clean key
   */
  async resolveNodeKey(nodeId) {
    if (!nodeId) return null;
    let raw = String(nodeId).trim();
    if (raw.startsWith('TLD_')) {
      const parts = raw.split('_');
      if (parts.length >= 3) {
        return parts.slice(2).join('_');
      }
    }

    const staticNode = await TimelineNodeStatic.findOne({ id: raw }).lean();
    if (staticNode) return staticNode.id;

    if (mongoose.isValidObjectId(raw)) {
      const td = await TimelineData.findById(raw).lean();
      if (td && td.nodeId) return td.nodeId;
      const ts = await TimelineNodeStatic.findById(raw).lean();
      if (ts && ts.id) return ts.id;
    }

    return raw;
  }

  /**
   * Find project metadata
   */
  async _findProject(projectId) {
    if (!projectId) return null;
    if (typeof projectId === 'object' && (projectId.projectName || projectId.title)) {
      return projectId;
    }
    const idStr = String(typeof projectId === 'object' && projectId._id ? projectId._id : projectId).trim();
    if (!idStr || idStr === '[object Object]' || idStr === 'undefined' || idStr === 'null') {
      return null;
    }

    try {
      const coreP = await coreApi.getProjectById(idStr);
      if (coreP) {
        return {
          _id: String(coreP._id || idStr),
          projectId: (coreP.projectId || idStr).toUpperCase(),
          projectName: coreP.projectName || coreP.title || 'Project',
          projectManager: coreP.projectManager || null
        };
      }
    } catch (_) {}

    return {
      _id: idStr,
      projectId: idStr.toUpperCase(),
      projectName: 'Project'
    };
  }

  /**
   * 1. Check Stage & Substage Phase Dependencies
   * Example: Stage 04 (EXECUTION) requires Stage 03 (ORDER_REQUIREMENT) to be COMPLETED
   */
  async validateStageDependencies(cleanKey, projectId, newStatus) {
    return await timelineDependencyService.validateNodeActivation(cleanKey, projectId, newStatus);
  }

  /**
   * 2. Validate Form Required Fields
   * Inspects all fields where required: true. If any required field is empty, return missing fields.
   */
  async validateRequiredFields(cleanKey, projectId, formData = null, project = null) {
    const schema = await formSchemasService.getSchema(cleanKey, projectId);
    if (!schema || !Array.isArray(schema.fields) || schema.fields.length === 0) {
      return { valid: true, missingFields: [] };
    }

    let data = formData;
    if (!data) {
      const doc = await TimelineData.findOne({ projectId, nodeId: cleanKey }).lean();
      data = doc?.formData || {};
    }

    const missingFields = [];
    for (const field of schema.fields) {
      if (field.required) {
        const k = field.key || field.name;
        // Project title / headline virtual check
        if ((k === 'projectName' || k === 'projectTitle') && (project?.projectName || project?.title)) {
          continue;
        }

        const val = data[k];
        const isEmpty =
          val === undefined ||
          val === null ||
          (typeof val === 'string' && val.trim() === '') ||
          (Array.isArray(val) && val.length === 0);

        if (isEmpty) {
          missingFields.push(field.label || k);
        }
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * 3. Validate Child Subtasks
   * If this node is a parent stage or substage, all child tasks must be COMPLETED.
   */
  async validateChildSubtasks(cleanKey, projectId) {
    const childStaticNodes = await TimelineNodeStatic.find({ parent_id: cleanKey }).lean();
    if (!childStaticNodes || childStaticNodes.length === 0) {
      return { valid: true, incompleteTasks: [] };
    }

    const childKeys = childStaticNodes.map((c) => c.id);
    const childRuntimes = await TimelineData.find({
      projectId,
      nodeId: { $in: childKeys }
    }).lean();

    const childRuntimeMap = new Map();
    for (const cr of childRuntimes) {
      childRuntimeMap.set(cr.nodeId, cr);
    }

    const incompleteTasks = [];
    for (const c of childStaticNodes) {
      const cr = childRuntimeMap.get(c.id);
      if (!cr || cr.status !== 'COMPLETED') {
        incompleteTasks.push(c.name || c.id);
      }
    }

    return {
      valid: incompleteTasks.length === 0,
      incompleteTasks
    };
  }

  /**
   * Check full completion eligibility for a node
   * Returns whether it can be marked COMPLETED, or what blocks it
   */
  async checkEligibility(projectId, nodeId) {
    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this.resolveNodeKey(nodeId);
    const project = await this._findProject(projId);

    const depCheck = await this.validateStageDependencies(cleanKey, projId, 'COMPLETED');
    const fieldCheck = await this.validateRequiredFields(cleanKey, projId, null, project);
    const childCheck = await this.validateChildSubtasks(cleanKey, projId);

    const canComplete = depCheck.valid && fieldCheck.valid && childCheck.valid;

    return {
      nodeId: cleanKey,
      projectId: projId,
      canComplete,
      dependenciesValid: depCheck.valid,
      dependencyError: depCheck.error || null,
      missingRequiredFields: fieldCheck.missingFields,
      incompleteSubtasks: childCheck.incompleteTasks
    };
  }

  /**
   * Core Status Controller Logic:
   * Enforces validation before updating node status.
   * If required fields are missing or children are incomplete, status remains IN_PROGRESS.
   */
  async updateNodeStatus(projectId, nodeId, newStatus, comment, employee, projectMembership) {
    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this.resolveNodeKey(nodeId);
    const project = await this._findProject(projId);

    const timelineDataService = require('./timeline-data.service');

    // 1. Dependency Gate Check
    const depCheck = await this.validateStageDependencies(cleanKey, projId, newStatus);
    if (!depCheck.valid) {
      throw new AppError(depCheck.error, 422, depCheck.code);
    }

    // 2. Completed Status Enforcement
    if (newStatus === 'COMPLETED') {
      // 2a. Check required fields
      const fieldCheck = await this.validateRequiredFields(cleanKey, projId, null, project);
      if (!fieldCheck.valid) {
        // Enforce IN_PROGRESS status in DB
        await timelineDataService.saveNodeData({
          projectId: projId,
          nodeId: cleanKey,
          status: 'IN_PROGRESS'
        });
        throw new AppError(
          `Cannot mark as Completed: Mandatory fields must be filled (${fieldCheck.missingFields.join(', ')}). Status remains IN_PROGRESS.`,
          400,
          'COMPULSORY_FIELDS_MISSING'
        );
      }

      // 2b. Check child tasks
      const childCheck = await this.validateChildSubtasks(cleanKey, projId);
      if (!childCheck.valid) {
        await timelineDataService.saveNodeData({
          projectId: projId,
          nodeId: cleanKey,
          status: 'IN_PROGRESS'
        });
        throw new AppError(
          `Cannot mark as Completed: All subtasks (${childCheck.incompleteTasks.join(', ')}) must be completed first. Status remains IN_PROGRESS.`,
          400,
          'CHILD_TASKS_INCOMPLETE'
        );
      }
    }

    // 3. Save Node Data
    const previousDoc = await TimelineData.findOne({ projectId: projId, nodeId: cleanKey }).lean();
    const previousStatus = previousDoc?.status || 'NOT_STARTED';

    const updatedRuntime = await timelineDataService.saveNodeData({
      projectId: projId,
      nodeId: cleanKey,
      status: newStatus,
      remarks: comment !== undefined ? comment : (previousDoc?.remarks || '')
    });

    // 3b. Trigger cascading activation & completion in separate dependency service
    if (newStatus === 'COMPLETED') {
      try {
        await timelineDependencyService.handleNodeCompletionCascade(cleanKey, projId, employee);
      } catch (cascadeErr) {
        console.error('[DependencyCascade] Error in cascade handler:', cascadeErr.message);
      }
    }

    // 4. Log Activity
    await Activity.create({
      project: project?._id || projId,
      actor: employee?._id || null,
      action: 'STATUS_CHANGED',
      resourceType: 'TimelineData',
      resourceId: updatedRuntime._id,
      metadata: { previousStatus, newStatus, comment }
    }).catch(() => {});

    // 5. Trigger Notifications
    try {
      const staticNode = await TimelineNodeStatic.findOne({ id: cleanKey }).lean();
      const nodeName = staticNode?.name || cleanKey;
      const readableStatus = String(newStatus).replace(/_/g, ' ');
      await notificationService.notifyWithAdminsAndPMs({
        assignedTo: updatedRuntime.assignedTo,
        projectId: project?._id || projId,
        title: `Stage Updated: ${nodeName} (${readableStatus})`,
        message: `${employee?.name || 'Team member'} updated "${nodeName}" status to "${readableStatus}" in project ${projId}.`,
        type: 'STAGE_UPDATED',
        metadata: {
          nodeId: updatedRuntime._id,
          nodeKey: cleanKey,
          previousStatus,
          newStatus,
          updatedBy: employee?._id
        },
        excludeUserIds: employee?._id ? [employee._id] : []
      });
    } catch (_) {}

    return await timelineDataService.getNodeById(projId, cleanKey);
  }
}

module.exports = new NodeStatusService();

