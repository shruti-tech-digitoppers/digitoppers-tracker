const mongoose = require('mongoose');
const TimelineData = require('./timeline-data.model');
const TimelineNodeStatic = require('../timeline-nodes/timeline-node.model');
const Activity = require('../activity/activity.model');
const notificationService = require('../notifications/notifications.service');
const { AppError } = require('../../core/errors');

class TimelineDependencyService {
  /**
   * Normalize projectId
   */
  _normalizeProjectId(projectId) {
    if (!projectId) return '';
    return String(projectId).trim();
  }

  /**
   * Resolve any node identifier to its static clean key (e.g. 'PO_UPLOAD', 'EXECUTION')
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
   * Check if all predecessors defined in 'dependentOn' are COMPLETED for a node.
   * Also enforces special business guard: Execution stage & its sub-nodes require
   * Stage 03 (ORDER_REQUIREMENT) & Task 5 (SCHOOL_AND_LICENSE_CREATION) to be COMPLETED.
   *
   * @param {string} nodeId - Key or ObjectId
   * @param {string} projectId
   * @returns {Promise<{ valid: boolean, isLocked: boolean, unmetDependencies: Array, error: string|null, code: string|null }>}
   */
  async checkNodeDependencies(nodeId, projectId) {
    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this.resolveNodeKey(nodeId);

    if (!cleanKey) {
      return { valid: true, isLocked: false, unmetDependencies: [], error: null, code: null };
    }

    // 1. Fetch static node definition from timeline_nodes
    const staticNode = await TimelineNodeStatic.findOne({ id: cleanKey }).lean();
    if (!staticNode) {
      return { valid: true, isLocked: false, unmetDependencies: [], error: null, code: null };
    }

    const unmetDependencies = [];

    // 2. Check explicit dependentOn nodes stored in timeline_nodes
    const rawDeps = staticNode.dependentOn || [];
    if (Array.isArray(rawDeps) && rawDeps.length > 0) {
      for (const depId of rawDeps) {
        if (!depId) continue;

        // Resolve dependent static node
        let depStatic = null;
        if (mongoose.isValidObjectId(depId)) {
          depStatic = await TimelineNodeStatic.findById(depId).lean();
        }
        if (!depStatic) {
          depStatic = await TimelineNodeStatic.findOne({ id: depId }).lean();
        }
        if (!depStatic) continue;

        // Fetch runtime status for this project
        const depRuntime = await TimelineData.findOne({
          projectId: projId,
          nodeId: depStatic.id
        }).lean();

        const depStatus = depRuntime?.status || 'NOT_STARTED';
        if (depStatus !== 'COMPLETED') {
          unmetDependencies.push({
            id: depStatic.id,
            _id: String(depStatic._id),
            name: depStatic.name || depStatic.id,
            status: depStatus
          });
        }
      }
    }

    // 3. Execution Phase Guard:
    // If this node is 'EXECUTION' or any node within Execution, Stage 3 (ORDER_REQUIREMENT)
    // and specifically Task 5 (SCHOOL_AND_LICENSE_CREATION) MUST be COMPLETED.
    const execKeys = [
      'EXECUTION',
      'HARDWARE_STREAM',
      'TECH_STREAM',
      'CONTENT_STREAM',
      'REQ_AND_STOCK_CHECK',
      'PURCHASE_IF_NEEDED',
      'CONSIGNMENT_TRACKING',
      'HARDWARE_READY',
      'PROJECT_CONFIG_AND_IMPLEMENTATION',
      'TECH_TESTING',
      'CONTENT_REVIEW_QA',
      'SHEET_READINESS',
      'DUMP_READINESS',
      'CONTENT_READY'
    ];

    if (execKeys.includes(cleanKey)) {
      // 3a. Check School & License Creation (Task 5)
      const licenseNode = await TimelineData.findOne({
        projectId: projId,
        nodeId: 'SCHOOL_AND_LICENSE_CREATION'
      }).lean();

      if (!licenseNode || licenseNode.status !== 'COMPLETED') {
        const alreadyInList = unmetDependencies.some(d => d.id === 'SCHOOL_AND_LICENSE_CREATION');
        if (!alreadyInList) {
          unmetDependencies.push({
            id: 'SCHOOL_AND_LICENSE_CREATION',
            name: 'School & License Creation (Stage 03 - Task 5)',
            status: licenseNode?.status || 'NOT_STARTED'
          });
        }
      }

      // 3b. Check Order Requirement Stage overall
      const orderReqNode = await TimelineData.findOne({
        projectId: projId,
        nodeId: 'ORDER_REQUIREMENT'
      }).lean();

      if (orderReqNode && orderReqNode.status !== 'COMPLETED') {
        const alreadyInList = unmetDependencies.some(d => d.id === 'ORDER_REQUIREMENT');
        if (!alreadyInList) {
          unmetDependencies.push({
            id: 'ORDER_REQUIREMENT',
            name: 'Order Requirement (Stage 03)',
            status: orderReqNode.status
          });
        }
      }
    }

    const isLocked = unmetDependencies.length > 0;
    const errorMsg = isLocked
      ? `Cannot activate task: Required prerequisite (${unmetDependencies.map(d => d.name).join(', ')}) must be COMPLETED first.`
      : null;

    return {
      valid: !isLocked,
      isLocked,
      unmetDependencies,
      error: errorMsg,
      code: isLocked ? 'DEPENDENCY_LOCKED' : null
    };
  }

  /**
   * Validate before status transition
   * Throws or returns validation failure if user tries to activate a locked node.
   *
   * @param {string} nodeId
   * @param {string} projectId
   * @param {string} newStatus
   */
  async validateNodeActivation(nodeId, projectId, newStatus) {
    // Only transitions to IN_PROGRESS or COMPLETED require predecessors to be complete
    if (newStatus !== 'IN_PROGRESS' && newStatus !== 'COMPLETED') {
      return { valid: true };
    }

    const check = await this.checkNodeDependencies(nodeId, projectId);
    if (!check.valid) {
      return {
        valid: false,
        error: check.error,
        code: check.code,
        unmetDependencies: check.unmetDependencies
      };
    }

    return { valid: true };
  }

  /**
   * Cascading completion & auto-activation handler:
   * Called whenever a node is marked COMPLETED.
   *
   * 1. If child tasks of a stage/substage are now all COMPLETED, auto-completes parent.
   * 2. Checks all downstream nodes that depend on this node (or its parent).
   *    If all their dependencies are now satisfied, auto-activates them (NOT_STARTED -> IN_PROGRESS).
   *
   * @param {string} completedNodeId
   * @param {string} projectId
   * @param {Object} [actor]
   * @returns {Promise<{ autoCompleted: Array, autoActivated: Array }>}
   */
  async handleNodeCompletionCascade(completedNodeId, projectId, actor = null) {
    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this.resolveNodeKey(completedNodeId);
    if (!cleanKey) return { autoCompleted: [], autoActivated: [] };

    const autoCompleted = [];
    const autoActivated = [];

    // Helper: update runtime status
    const setStatus = async (nodeKey, status) => {
      const updateData = { status };
      if (status === 'COMPLETED') updateData.completionDate = new Date();
      if (status === 'IN_PROGRESS') updateData.completionDate = null;

      await TimelineData.findOneAndUpdate(
        { projectId: projId, nodeId: nodeKey },
        { $set: updateData },
        { upsert: true }
      );
    };

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Check Parent Stage / Substage Auto-Completion
    // ─────────────────────────────────────────────────────────────
    const staticNode = await TimelineNodeStatic.findOne({ id: cleanKey }).lean();
    if (staticNode && staticNode.parent_id) {
      const parentKey = staticNode.parent_id;

      // Check all sibling tasks under this parent
      const siblings = await TimelineNodeStatic.find({ parent_id: parentKey }).lean();
      if (siblings.length > 0) {
        const siblingKeys = siblings.map(s => s.id);
        const siblingRuntimes = await TimelineData.find({
          projectId: projId,
          nodeId: { $in: siblingKeys }
        }).lean();

        const siblingMap = new Map();
        for (const sr of siblingRuntimes) {
          siblingMap.set(sr.nodeId, sr.status);
        }

        const allSiblingsCompleted = siblingKeys.every(k => siblingMap.get(k) === 'COMPLETED');
        if (allSiblingsCompleted) {
          const parentRuntime = await TimelineData.findOne({ projectId: projId, nodeId: parentKey }).lean();
          if (parentRuntime?.status !== 'COMPLETED') {
            await setStatus(parentKey, 'COMPLETED');
            autoCompleted.push(parentKey);

            // Recursively trigger cascade for completed parent
            await this.handleNodeCompletionCascade(parentKey, projId, actor);
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Auto-Activate Downstream Dependent Nodes
    // ─────────────────────────────────────────────────────────────
    // Find all static nodes where dependentOn contains this node's _id or this node's key
    const targetObjId = staticNode?._id;
    const query = {
      $or: [
        { dependentOn: cleanKey },
        ...(targetObjId ? [{ dependentOn: targetObjId }] : [])
      ]
    };

    // Also: If cleanKey === 'SCHOOL_AND_LICENSE_CREATION' or 'ORDER_REQUIREMENT',
    // check EXECUTION and its child streams!
    const downstreamStatic = await TimelineNodeStatic.find(query).lean();

    const candidateKeys = new Set(downstreamStatic.map(n => n.id));
    if (cleanKey === 'SCHOOL_AND_LICENSE_CREATION' || cleanKey === 'ORDER_REQUIREMENT') {
      candidateKeys.add('EXECUTION');
      candidateKeys.add('HARDWARE_STREAM');
      candidateKeys.add('TECH_STREAM');
      candidateKeys.add('CONTENT_STREAM');
      candidateKeys.add('REQ_AND_STOCK_CHECK');
      candidateKeys.add('PROJECT_CONFIG_AND_IMPLEMENTATION');
      candidateKeys.add('CONTENT_REVIEW_QA');
    }

    for (const downstreamKey of candidateKeys) {
      const runtime = await TimelineData.findOne({
        projectId: projId,
        nodeId: downstreamKey
      }).lean();

      // Only activate if currently NOT_STARTED or PENDING
      const currentStatus = runtime?.status || 'NOT_STARTED';
      if (currentStatus === 'NOT_STARTED' || currentStatus === 'PENDING') {
        const check = await this.checkNodeDependencies(downstreamKey, projId);
        if (check.valid && !check.isLocked) {
          await setStatus(downstreamKey, 'IN_PROGRESS');
          autoActivated.push(downstreamKey);
        }
      }
    }

    return { autoCompleted, autoActivated };
  }
}

module.exports = new TimelineDependencyService();

