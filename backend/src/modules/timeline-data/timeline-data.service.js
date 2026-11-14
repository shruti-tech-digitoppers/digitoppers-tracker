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
    } catch (_) { }



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
      .populate('assignedTo', 'name email designation')
      .populate('node', 'name title order parent_id has_substages dependentOn formSchema')
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
      .populate('assignedTo', 'name email designation')
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
      const isFirstStage = node.id === 'PROJECT_REVIEWER' || (node.order === 1 && node.title === 'stage');
      const initialStatus = isFirstStage ? 'IN_PROGRESS' : 'NOT_STARTED';
      const assignedEmployee = (isFirstStage && pmId) ? pmId : null;

      const record = await TimelineData.findOneAndUpdate(
        { projectId: projId, nodeId: node.id },
        {
          $setOnInsert: {
            nodeId: node.id,
            node: node._id,
            projectId: projId,
            project: coreProject?._id || coreProject || null,
            assignedTo: assignedEmployee,
            status: initialStatus,
            completionDate: null,
            dueDate: null,
            remarks: '',
            formData: {},
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
   * Compatibility alias for createTimelineForProject
   */
  async createTimelineForProject(project, pmId = null) {
    const projId = project?.projectId || (typeof project === 'string' ? project : '');
    const managerId = pmId || project?.projectManager || null;
    return await this.initializeProjectTimelineData(projId, managerId, project);
  }

  /**
   * Compatibility alias for syncSchoolProgressToTimeline
   */
  async syncSchoolProgressToTimeline(projectId) {
    return Promise.resolve();
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
      .populate('assignedTo', 'name email designation')
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
        nodeId: staticNode.id,
        projectId: projId,
        status: 'NOT_STARTED',
        assignedTo: null,
        completionDate: null,
            dueDate: null,
            remarks: '',
            formData: {}
      };

      return {
        ...staticNode,
        runtimeId: runtime._id ? String(runtime._id) : staticNode.id,
        status: runtime.status || 'NOT_STARTED',
        assignedTo: runtime.assignedTo || null,
        assignedEmployee: runtime.assignedTo || null,
        completionDate: runtime.completionDate || null,
        dueDate: runtime.dueDate || null,
        remarks: runtime.remarks || '',
        formData: runtime.formData || {},
        dependentOn: staticNode.dependentOn || [],
        dependencies: staticNode.dependentOn || staticNode.dependencies || [],
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
    } catch (_) { }

    // 4. Format into normalized tree structure
    const formatNode = (node, type, parentKey = null) => {
      let nodeFormData = node.formData || {};
      if (['SCHOOL_ONBOARDING_INFORMATION', 'SCHOOL_AND_LICENSE_CREATION'].includes(node.id) && canonicalSchools.length > 0) {
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
      let effectiveStatus = node.status || 'NOT_STARTED';

      // Validation check: If node is marked COMPLETED, verify all required form fields are filled
      if (effectiveStatus === 'COMPLETED' && Array.isArray(nodeFields)) {
        for (const f of nodeFields) {
          if (f.required) {
            const k = f.key || f.name;
            if (k === 'projectName' || k === 'projectTitle') continue;
            const val = nodeFormData[k];
            const isEmpty = val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);
            if (isEmpty) {
              effectiveStatus = 'IN_PROGRESS';
              break;
            }
          }
        }
      }

      return {
        _id: node.runtimeId || node.id,
        id: node.id,
        key: node.id,
        name: node.name,
        type: type,
        order: node.order || 1,
        status: effectiveStatus,
        assignedTo: node.assignedTo || null,
        assignedEmployee: node.assignedTo || null,
        completionDate: effectiveStatus === 'COMPLETED' ? (node.completionDate || new Date()) : null,
        dueDate: node.dueDate || null,
        remarks: node.remarks || '',
        formData: nodeFormData,
        formSchema: nodeFields ? (Array.isArray(nodeFields) ? { fields: nodeFields } : nodeFields) : null,
        parent: parentKey,
        dependentOn: node.dependentOn || [],
        dependencies: node.dependentOn || node.dependencies || [],
        children: []
      };
    };

    let totalCount = 0;
    let completedCount = 0;

    const countNode = (node) => {
      totalCount++;
      if (node.status === 'COMPLETED') completedCount++;
    };

    const tree = rawTree.map((stage) => {
      const stageFormatted = formatNode(stage, 'STAGE', null);

      if (stage.has_substages && stage.substages && stage.substages.length > 0) {
        stageFormatted.children = stage.substages.map((sub) => {
          const subFormatted = formatNode(sub, 'SUBSTAGE', stage.id);
          if (sub.tasks && sub.tasks.length > 0) {
            subFormatted.children = sub.tasks.map((task) => {
              const taskFormatted = formatNode(task, 'TASK', sub.id);
              countNode(taskFormatted);
              return taskFormatted;
            });
            // If any child task is not COMPLETED, substage cannot be COMPLETED
            const hasIncompleteTasks = subFormatted.children.some((c) => c.status !== 'COMPLETED');
            if (hasIncompleteTasks && subFormatted.status === 'COMPLETED') {
              subFormatted.status = 'IN_PROGRESS';
            }
          }
          countNode(subFormatted);
          return subFormatted;
        });

        // If any substage or child task is not COMPLETED, stage cannot be COMPLETED
        const hasIncompleteSubs = stageFormatted.children.some((c) => c.status !== 'COMPLETED');
        if (hasIncompleteSubs && stageFormatted.status === 'COMPLETED') {
          stageFormatted.status = 'IN_PROGRESS';
        }
      } else if (stage.tasks && stage.tasks.length > 0) {
        stageFormatted.children = stage.tasks.map((task) => {
          const taskFormatted = formatNode(task, 'TASK', stage.id);
          countNode(taskFormatted);
          return taskFormatted;
        });
        const hasIncompleteTasks = stageFormatted.children.some((c) => c.status !== 'COMPLETED');
        if (hasIncompleteTasks && stageFormatted.status === 'COMPLETED') {
          stageFormatted.status = 'IN_PROGRESS';
        }
      }

      countNode(stageFormatted);
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
    }).populate('assignedTo', 'name email designation').lean();

    if (!runtimeRecord && cleanKey) {
      await this.saveNodeData({
        projectId: targetProjectId,
        nodeId: cleanKey,
        status: 'NOT_STARTED'
      });
      runtimeRecord = await TimelineData.findOne({
        projectId: targetProjectId,
        nodeId: cleanKey
      }).populate('assignedTo', 'name email designation').lean();
    }

    const dynamicSchema = cleanKey ? await formSchemasService.getSchema(cleanKey, targetProjectId) : null;
    const effectiveKey = cleanKey || runtimeRecord?.nodeId || nodeId;

    const nodeFields = dynamicSchema?.fields || (staticNode?.formSchema?.fields || staticNode?.formSchema);
    const nodeObj = {
      _id: runtimeRecord?._id ? String(runtimeRecord._id) : effectiveKey,
      id: effectiveKey,
      key: effectiveKey,
      name: staticNode?.name || effectiveKey,
      type: (staticNode?.title || 'stage').toUpperCase(),
      order: staticNode?.order || 1,
      status: runtimeRecord?.status || 'NOT_STARTED',
      assignedTo: runtimeRecord?.assignedTo || null,
      assignedEmployee: runtimeRecord?.assignedTo || null,
      completionDate: runtimeRecord?.completionDate || null,
      dueDate: runtimeRecord?.dueDate || null,
      remarks: runtimeRecord?.remarks || '',
      formData: runtimeRecord?.formData || {},
      formSchema: nodeFields ? (Array.isArray(nodeFields) ? { fields: nodeFields } : nodeFields) : null,
      parent: staticNode?.parent_id || null,
      parentNode: staticNode?.parent_id || null,
      dependentOn: staticNode?.dependentOn || [],
      dependencies: staticNode?.dependentOn || staticNode?.dependencies || [],
      children: []
    };

    // Attach children
    const staticChildren = await TimelineNodeStatic.find({ parent_id: effectiveKey }).sort({ order: 1 }).lean();
    if (staticChildren.length > 0) {
      const childKeys = staticChildren.map((c) => c.id);
      const childRuntimes = await TimelineData.find({
        projectId: targetProjectId,
        nodeId: { $in: childKeys }
      }).populate('assignedTo', 'name email designation').lean();

      const childRuntimeMap = new Map();
      for (const cr of childRuntimes) {
        childRuntimeMap.set(cr.nodeId, cr);
      }

      nodeObj.children = staticChildren.map((sc) => {
        const cr = childRuntimeMap.get(sc.id);
        return {
          _id: cr?._id ? String(cr._id) : sc.id,
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
          dueDate: cr?.dueDate || null,
          remarks: cr?.remarks || '',
          formData: cr?.formData || {},
          formSchema: sc.formSchema ? { fields: sc.formSchema.fields || sc.formSchema } : null,
          parent: sc.parent_id,
          dependentOn: sc.dependentOn || [],
          dependencies: sc.dependentOn || sc.dependencies || [],
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
    }).populate('assignedTo', 'name email designation').lean();

    const childRuntimeMap = new Map();
    for (const cr of childRuntimes) {
      childRuntimeMap.set(cr.nodeId, cr);
    }

    return staticChildren.map((sc) => {
      const cr = childRuntimeMap.get(sc.id);
      return {
        _id: cr?._id ? String(cr._id) : sc.id,
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
          dueDate: cr?.dueDate || null,
        remarks: cr?.remarks || '',
        formData: cr?.formData || {},
        formSchema: sc.formSchema ? { fields: sc.formSchema.fields || sc.formSchema } : null,
        parent: sc.parent_id,
        dependentOn: sc.dependentOn || [],
        dependencies: sc.dependentOn || sc.dependencies || []
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
      dueDate,
      remarks,
      formData,
    } = payload;

    if (!projectId || !nodeId) {
      throw new Error("Both 'projectId' and 'nodeId' are required.");
    }

    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this._resolveNodeKey(nodeId);

    const staticNode = await TimelineNodeStatic.findOne({ id: cleanKey }).lean();

    const updateFields = {};
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo || null;
    if (status !== undefined) updateFields.status = String(status).toUpperCase();
    if (completionDate !== undefined) updateFields.completionDate = completionDate;
    if (dueDate !== undefined) updateFields.dueDate = dueDate ? new Date(dueDate) : null;
    if (remarks !== undefined) updateFields.remarks = String(remarks || '').trim();
    if (formData !== undefined) updateFields.formData = formData;
    if (project !== undefined) updateFields.project = project;
    if (staticNode) updateFields.node = staticNode._id;

    // Enforce required fields check: A subtask/stage CANNOT be COMPLETED if required fields are missing
    if (updateFields.status === 'COMPLETED') {
      const nodeStatusService = require('./node-status.service');
      const fieldCheck = await nodeStatusService.validateRequiredFields(cleanKey, projId, updateFields.formData);
      const childCheck = await nodeStatusService.validateChildSubtasks(cleanKey, projId);

      if (!fieldCheck.valid || !childCheck.valid) {
        updateFields.status = 'IN_PROGRESS';
        updateFields.completionDate = null;
      }
    }

    if (updateFields.status === 'COMPLETED' && !updateFields.completionDate) {
      updateFields.completionDate = new Date();
    } else if (updateFields.status && updateFields.status !== 'COMPLETED') {
      updateFields.completionDate = null;
    }

    const record = await TimelineData.findOneAndUpdate(
      { projectId: projId, nodeId: cleanKey },
      {
        $set: updateFields,
        $setOnInsert: { projectId: projId, nodeId: cleanKey }
      },
      { upsert: true, new: true, runValidators: true }
    )
            .populate('assignedTo', 'name email designation')
      .populate('node');

    if (updateFields.status === 'COMPLETED') {
      try {
        const timelineDependencyService = require('./timeline-dependency.service');
        await timelineDependencyService.handleNodeCompletionCascade(cleanKey, projId);
      } catch (cascadeErr) {
        console.error('[DependencyCascade] Error in cascade handler:', cascadeErr.message);
      }
    }

    return record;
  }

  /**
   * Update node status with permissions and dependency checks
   */
  async updateNodeStatus(projectId, nodeId, newStatus, comment, employee, projectMembership) {
    const nodeStatusService = require('./node-status.service');
    return await nodeStatusService.updateNodeStatus(
      projectId,
      nodeId,
      newStatus,
      comment,
      employee,
      projectMembership
    );
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
    }).catch(() => { });

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
      } catch (_) { }
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

    // Validate compulsory fields and contact number fields against node schema
    const schema = await formSchemasService.getSchema(cleanKey, targetProjectId);
    const missingRequiredFields = [];

    if (schema && Array.isArray(schema.fields)) {
      for (const field of schema.fields) {
        const k = field.key || field.name;
        const val = mergedFormData[k];

        // 1. Mandatory / Compulsory fields check
        if (field.required) {
          if ((k === 'projectName' || k === 'projectTitle') && (project?.projectName || project?.title)) {
            // headline project title is auto-provided
          } else {
            const isEmpty = val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);
            if (isEmpty) {
              missingRequiredFields.push(field.label || k);
            }
          }
        }

        // 2. Contact / Phone number fields validation: only numbers, strictly NO alphabets
        const isContact = (
          (field.type === 'tel' || field.type === 'phone' || /(phone|mobile|tel|contactno|contactnumber|poccontact|supportingorgcontact)/i.test(k) || /\b(phone|mobile|contact\s*no|contact\s*number)\b/i.test(field.label || '')) &&
          !/(person|address|name)/i.test(k) &&
          !/(person|address|name)/i.test(field.label || '') &&
          field.type !== 'textarea'
        );

        if (isContact && val !== undefined && val !== null && String(val).trim() !== '') {
          const strVal = String(val).trim();
          if (/[a-zA-Z]/.test(strVal)) {
            throw new AppError(`Field '${field.label || k}' must contain only numbers, no alphabets are allowed.`, 400, 'INVALID_CONTACT_NUMBER');
          }
        }
      }
    }

    const remarksToSave = formData.remarks !== undefined ? formData.remarks : (existingDoc?.remarks || '');

    // Determine status: If any required field is missing, status MUST NOT be COMPLETED — it must be IN_PROGRESS
    let calculatedStatus = existingDoc?.status || 'IN_PROGRESS';
    if (missingRequiredFields.length > 0) {
      calculatedStatus = 'IN_PROGRESS';
    } else if (['PROJECT_CREATED', 'LEAD_CREATION', 'PROJECT_REVIEWER'].includes(cleanKey)) {
      if (formData.confirmed === 'YES' || formData.pmReviewStatus === 'APPROVED' || formData.projectReviewed === 'YES' || formData.projectCreated === 'YES' || formData.autoComplete === true) {
        calculatedStatus = 'COMPLETED';
      }
    } else if (calculatedStatus === 'NOT_STARTED') {
      calculatedStatus = 'IN_PROGRESS';
    }

    const updatedRuntime = await this.saveNodeData({
      projectId: targetProjectId,
      nodeId: cleanKey,
      formData: mergedFormData,
      status: calculatedStatus,
      remarks: remarksToSave
    });

    // Also update form_schemas collection
    await formSchemasService.saveFormData(cleanKey, targetProjectId, mergedFormData, employee);

    // Auto-complete Stage 1 if confirmed and all required fields are filled
    if (['PROJECT_CREATED', 'LEAD_CREATION', 'PROJECT_REVIEWER'].includes(cleanKey)) {
      if ((formData.confirmed === 'YES' || formData.pmReviewStatus === 'APPROVED' || formData.projectReviewed === 'YES' || formData.projectCreated === 'YES' || formData.autoComplete === true) && missingRequiredFields.length === 0) {
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
    }).catch(() => { });

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
    /**
   * Update node due date
   */
  async updateDueDate(projectId, nodeId, dueDate) {
    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this._resolveNodeKey(nodeId);
    const parsedDate = dueDate ? new Date(dueDate) : null;

    const record = await TimelineData.findOneAndUpdate(
      { projectId: projId, nodeId: cleanKey },
      { $set: { dueDate: parsedDate } },
      { new: true, upsert: true }
    );
    return record;
  }

  async updateRemarks(projectId, nodeId, remarks) {
    return await this.saveNodeData({
      projectId,
      nodeId,
      remarks
    });
  }
}

module.exports = new TimelineDataService();
