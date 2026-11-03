const mongoose = require('mongoose');
const TimelineData = require('./timeline-data.model');
const TimelineNodeStatic = require('../timeline-nodes/timeline-node.model');
const timelineNodesService = require('../timeline-nodes/timeline-nodes.service');
const FormSchema = require('../form-schemas/form-schema.model');
const formSchemasService = require('../form-schemas/form-schemas.service');
const Employee = require('../employees/employee.model');
const Activity = require('../activity/activity.model');
const Notification = require('../notifications/notifications.model');
const notificationService = require('../notifications/notifications.service');
const coreApi = require('../../services/core-api.service');
const Requirements = require('../requirements/requirements.model');
const School = require('../schools/school.model');
const ProjectSchools = require('../project-schools/project-schools.model');
const { NODE_STATUSES, GLOBAL_ROLES, DESIGNATIONS } = require('../../core/constants');
const { AppError } = require('../../core/errors');

class TimelineDataService {
  /**
   * Normalize projectId
   */
  _normalizeProjectId(projectId) {
    if (!projectId) return '';
    return String(projectId).toUpperCase().trim();
  }

  /**
   * Resolve any node identifier (custom ID 'TLD_...', MongoDB ObjectId, or static ID)
   * to its static clean key (e.g., 'PO_UPLOAD', 'PROJECT_REVIEWER')
   */
  async _resolveNodeKey(nodeId) {
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
   * Find project metadata from Core Backend or Tracker DB
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

    // Try Core Backend
    try {
      const coreP = await coreApi.getProjectById(idStr);
      if (coreP) {
        return {
          _id: String(coreP._id || idStr),
          projectId: (coreP.projectId || idStr).toUpperCase(),
          projectName: coreP.projectName || coreP.title || 'Project',
          projectManager: coreP.projectManager || null,
          schools: coreP.schools || [],
          source: 'CORE_BACKEND'
        };
      }
    } catch (_) {}

    // Fallback: check local MongoDB collection
    try {
      const localP = await mongoose.connection.collection('projects').findOne({
        $or: [
          mongoose.isValidObjectId(idStr) ? { _id: new mongoose.Types.ObjectId(idStr) } : null,
          { projectId: idStr },
          { projectId: idStr.toUpperCase() },
          { projectId: idStr.toLowerCase() }
        ].filter(Boolean)
      });
      if (localP) {
        return {
          _id: String(localP._id),
          projectId: (localP.projectId || idStr).toUpperCase(),
          projectName: localP.projectName || localP.title || 'Project',
          projectManager: localP.projectManager || null,
          schools: localP.schools || [],
          source: 'LOCAL'
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
   * Get all timeline data records for a project
   */
  async getByProject(projectId, filter = {}) {
    const projId = this._normalizeProjectId(projectId);
    const query = { projectId: projId };

    if (filter.status) {
      query.status = filter.status.toUpperCase();
    }
    if (filter.assignedTo) {
      query.assignedTo = filter.assignedTo;
    }
    if (filter.nodeId) {
      query.nodeId = filter.nodeId;
    }

    return await TimelineData.find(query)
      .populate('assignedTo', 'name email employeeCode designation')
      .populate('node', 'name title order parent_id has_substages formSchema')
      .sort({ createdAt: 1 })
      .lean();
  }

  /**
   * Get single node data for a project
   */
  async getNodeData(projectId, nodeId) {
    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this._resolveNodeKey(nodeId);
    return await TimelineData.findOne({ projectId: projId, nodeId: cleanKey })
      .populate('assignedTo', 'name email employeeCode designation')
      .populate('node')
      .lean();
  }

  /**
   * Initialize timeline_data records for a project based on all static timeline_nodes
   */
  async initializeProjectTimelineData(projectId, pmId = null, coreProject = null) {
    const projId = this._normalizeProjectId(projectId);
    if (!projId) {
      throw new Error('Project ID is required to initialize timeline data.');
    }

    const staticNodes = await TimelineNodeStatic.find().sort({ order: 1 }).lean();
    if (!staticNodes || staticNodes.length === 0) {
      await timelineNodesService.seedStaticTimelineNodes(false);
    }
    const nodes = await TimelineNodeStatic.find().sort({ order: 1 }).lean();

    const results = [];
    for (const node of nodes) {
      const customId = `TLD_${projId}_${node.id}`;
      const isFirstStage = node.id === 'PROJECT_REVIEWER' || (node.order === 1 && node.title === 'stage');
      const initialStatus = isFirstStage ? 'IN_PROGRESS' : 'NOT_STARTED';
      const assignedEmployee = (isFirstStage && pmId) ? pmId : null;

      const record = await TimelineData.findOneAndUpdate(
        { projectId: projId, nodeId: node.id },
        {
          $setOnInsert: {
            id: customId,
            nodeId: node.id,
            node: node._id,
            projectId: projId,
            project: coreProject?._id || coreProject || null,
            assignedTo: assignedEmployee,
            status: initialStatus,
            completionDate: null,
            remarks: '',
            formData: {},
            metadata: {}
          }
        },
        { upsert: true, new: true }
      );
      results.push(record);
    }

    return {
      success: true,
      projectId: projId,
      initializedCount: results.length
    };
  }

  /**
   * Get live project hierarchy tree by merging static blueprint with dynamic runtime timeline_data
   */
  async getProjectHierarchyTree(projectId) {
    const projId = this._normalizeProjectId(projectId);

    // 1. Fetch static hierarchy tree
    const staticTree = await timelineNodesService.getHierarchyTree();

    // 2. Fetch all runtime data for this project
    const runtimeRecords = await TimelineData.find({ projectId: projId })
      .populate('assignedTo', 'name email employeeCode designation')
      .lean();

    const runtimeMap = new Map();
    for (const r of runtimeRecords) {
      runtimeMap.set(r.nodeId, r);
    }

    // Auto-initialize if no records found
    if (runtimeRecords.length === 0) {
      await this.initializeProjectTimelineData(projId);
      return await this.getProjectHierarchyTree(projId);
    }

    // 3. Helper to attach runtime data to static node
    const attachRuntimeData = (staticNode) => {
      const runtime = runtimeMap.get(staticNode.id) || {
        id: `TLD_${projId}_${staticNode.id}`,
        nodeId: staticNode.id,
        projectId: projId,
        status: 'NOT_STARTED',
        assignedTo: null,
        completionDate: null,
        remarks: '',
        formData: {}
      };

      return {
        ...staticNode,
        runtimeId: runtime.id,
        status: runtime.status || 'NOT_STARTED',
        assignedTo: runtime.assignedTo || null,
        assignedEmployee: runtime.assignedTo || null,
        completionDate: runtime.completionDate || null,
        remarks: runtime.remarks || '',
        formData: runtime.formData || {},
        updatedAt: runtime.updatedAt || null
      };
    };

    // 4. Merge hierarchy
    const mergedTree = staticTree.map((stage) => {
      const mergedStage = attachRuntimeData(stage);

      if (stage.has_substages && stage.substages) {
        mergedStage.substages = stage.substages.map((sub) => {
          const mergedSub = attachRuntimeData(sub);
          if (sub.tasks) {
            mergedSub.tasks = sub.tasks.map((task) => attachRuntimeData(task));
          }
          return mergedSub;
        });
      } else if (stage.tasks) {
        mergedStage.tasks = stage.tasks.map((task) => attachRuntimeData(task));
      }

      return mergedStage;
    });

    return mergedTree;
  }

  /**
   * Complete unified timeline hierarchy method matching the frontend contract
   */
  async getTimelineHierarchy(projectId) {
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();

    // Ensure runtime records are initialized
    const existingCount = await TimelineData.countDocuments({ projectId: targetProjectId });
    if (existingCount === 0) {
      await this.initializeProjectTimelineData(targetProjectId, project?.projectManager, project);
    }

    // 1. Get raw hierarchy tree
    const rawTree = await this.getProjectHierarchyTree(targetProjectId);

    // 2. Fetch Form Schemas map
    const formSchemas = await FormSchema.find({
      $or: [{ projectId: targetProjectId }, { projectId: 'DEFAULT' }],
      isActive: true
    }).lean();

    const schemaMap = new Map();
    for (const fs of formSchemas) {
      if (!schemaMap.has(fs.nodeId) || fs.projectId === targetProjectId) {
        schemaMap.set(fs.nodeId, fs.fields);
      }
    }

    // 3. Fetch real DB schools for the project to auto-fill school nodes
    let canonicalSchools = [];
    try {
      const dbSchools = await School.find({
        $or: [
          project?._id && mongoose.isValidObjectId(project._id) ? { project: project._id } : null,
          targetProjectId ? { projectId: targetProjectId } : null
        ].filter(Boolean),
        isActive: true
      })
        .populate('installation.assignedEngineerId', 'name email phone')
        .populate('training.assignedTrainerId', 'name email phone')
        .lean();

      canonicalSchools = dbSchools.map((s) => ({
        id: String(s._id),
        _id: String(s._id),
        schoolId: s.schoolId || String(s._id),
        name: s.name,
        schoolName: s.name,
        address: s.address || '',
        principalName: s.survey?.principalName || s.contactPerson?.name || '',
        phone: s.contactPerson?.phone || s.survey?.pocContact || '',
        email: s.contactPerson?.email || s.survey?.email || '',
        installation: s.installation || {},
        training: s.training || {},
        survey: s.survey || {}
      }));
    } catch (_) {}

    // 4. Format into normalized tree structure
    let totalCount = 0;
    let completedCount = 0;

    const formatNode = (node, type, parentKey = null) => {
      totalCount++;
      const isCompleted = node.status === 'COMPLETED';
      if (isCompleted) completedCount++;

      let nodeFormData = node.formData || {};
      if (node.id === 'SCHOOL_ONBOARDING_INFORMATION' && canonicalSchools.length > 0) {
        nodeFormData = {
          ...nodeFormData,
          schools: canonicalSchools,
          schoolName: canonicalSchools[0]?.name || nodeFormData.schoolName
        };
      } else if (['INSTALLATION_PLANNING', 'INSTALLATION_EXECUTION', 'INSTALLATION_COMPLETED'].includes(node.id) && canonicalSchools.length > 0) {
        nodeFormData = {
          schools: canonicalSchools,
          ...nodeFormData
        };
      } else if (['TRAINING_PLANNING', 'TRAINING_EXECUTION', 'TRAINING_COMPLETED'].includes(node.id) && canonicalSchools.length > 0) {
        nodeFormData = {
          schools: canonicalSchools,
          ...nodeFormData
        };
      }

      const nodeFields = schemaMap.get(node.id) || (node.formSchema?.fields || node.formSchema) || null;

      return {
        _id: node.runtimeId || `TLD_${targetProjectId}_${node.id}`,
        id: node.id,
        key: node.id,
        name: node.name,
        type: type,
        order: node.order || 1,
        status: node.status || 'NOT_STARTED',
        assignedTo: node.assignedTo || null,
        assignedEmployee: node.assignedTo || null,
        completionDate: node.completionDate || null,
        remarks: node.remarks || '',
        formData: nodeFormData,
        formSchema: nodeFields ? (Array.isArray(nodeFields) ? { fields: nodeFields } : nodeFields) : null,
        parent: parentKey,
        dependencies: node.dependencies || [],
        metadata: node.metadata || {},
        children: []
      };
    };

    const tree = rawTree.map((stage) => {
      const stageFormatted = formatNode(stage, 'STAGE', null);

      if (stage.has_substages && stage.substages && stage.substages.length > 0) {
        stageFormatted.children = stage.substages.map((sub) => {
          const subFormatted = formatNode(sub, 'SUBSTAGE', stage.id);
          if (sub.tasks && sub.tasks.length > 0) {
            subFormatted.children = sub.tasks.map((task) => formatNode(task, 'TASK', sub.id));
          }
          return subFormatted;
        });
      } else if (stage.tasks && stage.tasks.length > 0) {
        stageFormatted.children = stage.tasks.map((task) => formatNode(task, 'TASK', stage.id));
      }

      return stageFormatted;
    });

    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const timeline = {
      _id: project?._id || targetProjectId,
      project: project?._id || targetProjectId,
      projectId: targetProjectId,
      projectName: project?.projectName || project?.title || 'Project',
      status: progressPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
      progressPercentage,
      projectManager: project?.projectManager || null,
      stages: tree
    };

    return { timeline, structure: tree, nodes: tree };
  }

  /**
   * Get single node detail with form schema and runtime values
   */
  async getNodeById(projectId, nodeId) {
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();

    const cleanKey = await this._resolveNodeKey(nodeId);
    const staticNode = cleanKey ? await TimelineNodeStatic.findOne({ id: cleanKey }).lean() : null;

    let runtimeRecord = await TimelineData.findOne({
      projectId: targetProjectId,
      $or: [
        cleanKey ? { nodeId: cleanKey } : null,
        { id: nodeId },
        mongoose.isValidObjectId(nodeId) ? { _id: nodeId } : null
      ].filter(Boolean)
    }).populate('assignedTo', 'name email employeeCode designation').lean();

    if (!runtimeRecord && cleanKey) {
      await this.saveNodeData({
        projectId: targetProjectId,
        nodeId: cleanKey,
        status: 'NOT_STARTED'
      });
      runtimeRecord = await TimelineData.findOne({
        projectId: targetProjectId,
        nodeId: cleanKey
      }).populate('assignedTo', 'name email employeeCode designation').lean();
    }

    const dynamicSchema = cleanKey ? await formSchemasService.getSchema(cleanKey, targetProjectId) : null;
    const effectiveKey = cleanKey || runtimeRecord?.nodeId || nodeId;

    const nodeFields = dynamicSchema?.fields || (staticNode?.formSchema?.fields || staticNode?.formSchema);
    const nodeObj = {
      _id: runtimeRecord?.id || `TLD_${targetProjectId}_${effectiveKey}`,
      id: effectiveKey,
      key: effectiveKey,
      name: staticNode?.name || effectiveKey,
      type: (staticNode?.title || 'stage').toUpperCase(),
      order: staticNode?.order || 1,
      status: runtimeRecord?.status || 'NOT_STARTED',
      assignedTo: runtimeRecord?.assignedTo || null,
      assignedEmployee: runtimeRecord?.assignedTo || null,
      completionDate: runtimeRecord?.completionDate || null,
      remarks: runtimeRecord?.remarks || '',
      formData: runtimeRecord?.formData || {},
      formSchema: nodeFields ? (Array.isArray(nodeFields) ? { fields: nodeFields } : nodeFields) : null,
      parent: staticNode?.parent_id || null,
      parentNode: staticNode?.parent_id || null,
      dependencies: staticNode?.dependencies || [],
      metadata: runtimeRecord?.metadata || {},
      children: []
    };

    // Attach children
    const staticChildren = await TimelineNodeStatic.find({ parent_id: effectiveKey }).sort({ order: 1 }).lean();
    if (staticChildren.length > 0) {
      const childKeys = staticChildren.map((c) => c.id);
      const childRuntimes = await TimelineData.find({
        projectId: targetProjectId,
        nodeId: { $in: childKeys }
      }).populate('assignedTo', 'name email employeeCode designation').lean();

      const childRuntimeMap = new Map();
      for (const cr of childRuntimes) {
        childRuntimeMap.set(cr.nodeId, cr);
      }

      nodeObj.children = staticChildren.map((sc) => {
        const cr = childRuntimeMap.get(sc.id);
        return {
          _id: cr?.id || `TLD_${targetProjectId}_${sc.id}`,
          id: sc.id,
          key: sc.id,
          name: sc.name,
          title: sc.title,
          type: (sc.title || 'tasks').toUpperCase(),
          order: sc.order || 1,
          status: cr?.status || 'NOT_STARTED',
          assignedTo: cr?.assignedTo || null,
          assignedEmployee: cr?.assignedTo || null,
          completionDate: cr?.completionDate || null,
          remarks: cr?.remarks || '',
          formData: cr?.formData || {},
          formSchema: sc.formSchema ? { fields: sc.formSchema.fields || sc.formSchema } : null,
          parent: sc.parent_id,
          dependencies: sc.dependencies || [],
          children: []
        };
      });
    }

    return nodeObj;
  }

  /**
   * Get children of a node
   */
  async getChildren(projectId, nodeId) {
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();

    const cleanKey = await this._resolveNodeKey(nodeId);
    const staticChildren = await TimelineNodeStatic.find({ parent_id: cleanKey }).sort({ order: 1 }).lean();

    if (staticChildren.length === 0) return [];

    const childKeys = staticChildren.map((c) => c.id);
    const childRuntimes = await TimelineData.find({
      projectId: targetProjectId,
      nodeId: { $in: childKeys }
    }).populate('assignedTo', 'name email employeeCode designation').lean();

    const childRuntimeMap = new Map();
    for (const cr of childRuntimes) {
      childRuntimeMap.set(cr.nodeId, cr);
    }

    return staticChildren.map((sc) => {
      const cr = childRuntimeMap.get(sc.id);
      return {
        _id: cr?.id || `TLD_${targetProjectId}_${sc.id}`,
        id: sc.id,
        key: sc.id,
        name: sc.name,
        title: sc.title,
        type: (sc.title || 'tasks').toUpperCase(),
        order: sc.order || 1,
        status: cr?.status || 'NOT_STARTED',
        assignedTo: cr?.assignedTo || null,
        assignedEmployee: cr?.assignedTo || null,
        completionDate: cr?.completionDate || null,
        remarks: cr?.remarks || '',
        formData: cr?.formData || {},
        formSchema: sc.formSchema ? { fields: sc.formSchema.fields || sc.formSchema } : null,
        parent: sc.parent_id,
        dependencies: sc.dependencies || []
      };
    });
  }

  /**
   * Save or update runtime node data
   */
  async saveNodeData(payload) {
    const {
      id,
      projectId,
      nodeId,
      project,
      assignedTo,
      status,
      completionDate,
      remarks,
      formData,
      metadata
    } = payload;

    if (!projectId || !nodeId) {
      throw new Error("Both 'projectId' and 'nodeId' are required.");
    }

    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this._resolveNodeKey(nodeId);
    const customId = id || `TLD_${projId}_${cleanKey}`;

    const staticNode = await TimelineNodeStatic.findOne({ id: cleanKey }).lean();

    const updateFields = {};
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo || null;
    if (status !== undefined) updateFields.status = String(status).toUpperCase();
    if (completionDate !== undefined) updateFields.completionDate = completionDate;
    if (remarks !== undefined) updateFields.remarks = String(remarks || '').trim();
    if (formData !== undefined) updateFields.formData = formData;
    if (metadata !== undefined) updateFields.metadata = metadata;
    if (project !== undefined) updateFields.project = project;
    if (staticNode) updateFields.node = staticNode._id;

    if (updateFields.status === 'COMPLETED' && !updateFields.completionDate) {
      updateFields.completionDate = new Date();
    } else if (updateFields.status && updateFields.status !== 'COMPLETED') {
      updateFields.completionDate = null;
    }

    const record = await TimelineData.findOneAndUpdate(
      { projectId: projId, nodeId: cleanKey },
      {
        $set: updateFields,
        $setOnInsert: { id: customId, projectId: projId, nodeId: cleanKey }
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email employeeCode designation')
      .populate('node');

    return record;
  }

  /**
   * Update node status with permissions and dependency checks
   */
  async updateNodeStatus(projectId, nodeId, newStatus, comment, employee, projectMembership) {
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();
    const cleanKey = await this._resolveNodeKey(nodeId);

    // Dependency Gate Check: Stage 04 (EXECUTION requires Stage 03 ORDER_REQUIREMENT to be COMPLETED)
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
    if (execKeys.includes(cleanKey) && (newStatus === 'IN_PROGRESS' || newStatus === 'COMPLETED')) {
      const orderReq = await TimelineData.findOne({
        projectId: targetProjectId,
        nodeId: 'ORDER_REQUIREMENT'
      }).lean();
      if (orderReq && orderReq.status !== 'COMPLETED') {
        throw new AppError('Order Requirement stage (Stage 03) must be completed before Execution phase (Stage 04) can start.', 422, 'ORDER_REQUIREMENT_NOT_COMPLETED');
      }
    }

    const previousDoc = await TimelineData.findOne({ projectId: targetProjectId, nodeId: cleanKey }).lean();
    const previousStatus = previousDoc?.status || 'NOT_STARTED';

    const updatedRuntime = await this.saveNodeData({
      projectId: targetProjectId,
      nodeId: cleanKey,
      status: newStatus,
      remarks: comment !== undefined ? comment : (previousDoc?.remarks || '')
    });

    // Activity log
    await Activity.create({
      project: project?._id || targetProjectId,
      actor: employee?._id || null,
      action: 'STATUS_CHANGED',
      resourceType: 'TimelineData',
      resourceId: updatedRuntime._id,
      metadata: { previousStatus, newStatus, comment }
    }).catch(() => {});

    // Notification
    try {
      const staticNode = await TimelineNodeStatic.findOne({ id: cleanKey }).lean();
      const nodeName = staticNode?.name || cleanKey;
      const readableStatus = String(newStatus).replace(/_/g, ' ');
      await notificationService.notifyWithAdminsAndPMs({
        assignedTo: updatedRuntime.assignedTo,
        projectId: project?._id || targetProjectId,
        title: `Stage Updated: ${nodeName} (${readableStatus})`,
        message: `${employee?.name || 'Team member'} updated "${nodeName}" status to "${readableStatus}" in project ${targetProjectId}.`,
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

    return await this.getNodeById(targetProjectId, cleanKey);
  }

  /**
   * Assign a node to an employee
   */
  async assignNode(projectId, nodeId, employeeId, actorId = null) {
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();
    const cleanKey = await this._resolveNodeKey(nodeId);

    const validEmpId = (employeeId && employeeId !== 'null' && employeeId !== 'undefined' && mongoose.Types.ObjectId.isValid(employeeId))
      ? employeeId
      : null;

    let updatedRuntime = await this.saveNodeData({
      projectId: targetProjectId,
      nodeId: cleanKey,
      assignedTo: validEmpId
    });

    if (validEmpId && (updatedRuntime.status === 'NOT_STARTED' || updatedRuntime.status === 'PENDING')) {
      updatedRuntime = await this.saveNodeData({
        projectId: targetProjectId,
        nodeId: cleanKey,
        status: 'IN_PROGRESS'
      });
    }

    // Activity & Notification
    await Activity.create({
      project: project?._id || targetProjectId,
      actor: actorId || null,
      action: 'CONTRIBUTOR_ASSIGNED',
      resourceType: 'TimelineData',
      resourceId: updatedRuntime._id,
      metadata: { nodeId: cleanKey, employeeId: validEmpId }
    }).catch(() => {});

    if (validEmpId) {
      try {
        const staticNode = await TimelineNodeStatic.findOne({ id: cleanKey }).lean();
        const nodeName = staticNode?.name || cleanKey;
        await Notification.create({
          recipient: validEmpId,
          project: project?._id || targetProjectId,
          title: `Task Assigned: ${nodeName}`,
          message: `You have been assigned to "${nodeName}" in project ${targetProjectId}.`,
          type: 'TASK_ASSIGNED',
          metadata: {
            nodeId: updatedRuntime._id,
            nodeName: nodeName,
            nodeKey: cleanKey,
            projectId: targetProjectId
          }
        });
      } catch (_) {}
    }

    return await this.getNodeById(targetProjectId, cleanKey);
  }

  /**
   * Update formData and remarks for a node
   */
  async updateNodeForm(projectId, nodeId, formData, employee, projectMembership) {
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();
    const cleanKey = await this._resolveNodeKey(nodeId);

    const existingDoc = await TimelineData.findOne({ projectId: targetProjectId, nodeId: cleanKey }).lean();
    const mergedFormData = { ...(existingDoc?.formData || {}), ...formData };

    const remarksToSave = formData.remarks !== undefined ? formData.remarks : (existingDoc?.remarks || '');

    const updatedRuntime = await this.saveNodeData({
      projectId: targetProjectId,
      nodeId: cleanKey,
      formData: mergedFormData,
      remarks: remarksToSave
    });

    // Also update form_schemas collection
    await formSchemasService.saveFormData(cleanKey, targetProjectId, mergedFormData, employee);

    // Auto-complete Stage 1 if confirmed
    if (['PROJECT_CREATED', 'LEAD_CREATION', 'PROJECT_REVIEWER'].includes(cleanKey)) {
      if (formData.confirmed === 'YES' || formData.pmReviewStatus === 'APPROVED' || formData.projectReviewed === 'YES' || formData.projectCreated === 'YES' || formData.autoComplete === true) {
        await this.saveNodeData({
          projectId: targetProjectId,
          nodeId: cleanKey,
          status: 'COMPLETED'
        });
      }
    }

    // Activity log
    await Activity.create({
      project: project?._id || targetProjectId,
      actor: employee?._id || null,
      action: 'FORM_UPDATED',
      resourceType: 'TimelineData',
      resourceId: updatedRuntime._id,
      metadata: { nodeId: cleanKey, keys: Object.keys(formData) }
    }).catch(() => {});

    return await this.getNodeById(targetProjectId, cleanKey);
  }

  /**
   * Reset timeline data for a project (re-creates clean state from static blueprint)
   */
  async resetTimelineForProject(projectId) {
    const targetProjectId = this._normalizeProjectId(projectId);
    await TimelineData.deleteMany({ projectId: targetProjectId });
    await this.initializeProjectTimelineData(targetProjectId);
    return await this.getTimelineHierarchy(targetProjectId);
  }

  /**
   * Quick update status
   */
  async updateStatus(projectId, nodeId, status, completionDate = null) {
    return await this.saveNodeData({
      projectId,
      nodeId,
      status,
      completionDate
    });
  }

  /**
   * Quick update formData
   */
  async updateFormData(projectId, nodeId, formData) {
    return await this.saveNodeData({
      projectId,
      nodeId,
      formData
    });
  }

  /**
   * Quick update remarks
   */
  async updateRemarks(projectId, nodeId, remarks) {
    return await this.saveNodeData({
      projectId,
      nodeId,
      remarks
    });
  }
}

module.exports = new TimelineDataService();
