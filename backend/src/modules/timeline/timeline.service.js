const mongoose = require('mongoose');
const Timeline = require('./timeline.model');
const TimelineNode = require('./timeline-node.model');
const Activity = require('../activity/activity.model');
const Notification = require('../notifications/notifications.model');
const timelineConfig = require('../../config/timeline');
const config = require('../../config/env');
const coreApi = require('../../services/core-api.service');
const Employee = require('../employees/employee.model');
const Project = require('../projects/project.model');
const ProjectRequest = require('../project-requests/project-request.model');
const ProjectMember = require('../project-members/project-member.model');
const ProjectSchools = require('../project-schools/project-schools.model');
const School = require('../schools/school.model');
const Hardware = require('../hardware/hardware.model');
const Solution = require('../solutions/solution.model');
const Requirements = require('../requirements/requirements.model');
const Training = require('../training/training.model');
const notificationService = require('../notifications/notifications.service');
const { NODE_STATUSES, NODE_TYPES, GLOBAL_ROLES, DESIGNATIONS } = require('../../core/constants');
const { AppError } = require('../../core/errors');

class TimelineService {
  async _findProject(projectId) {
    if (!projectId) return null;
    const mongoose = require('mongoose');

    // 1. If already an object with title/projectName, return it directly
    if (typeof projectId === 'object' && (projectId.projectName || projectId.title)) {
      return projectId;
    }

    const idStr = String(typeof projectId === 'object' && projectId._id ? projectId._id : projectId).trim();
    if (!idStr || idStr === '[object Object]' || idStr === 'undefined' || idStr === 'null') {
      return null;
    }

    // 2. Lookup in Tracker local MongoDB Project model
    const isObjectId = mongoose.isValidObjectId(idStr) && idStr.length === 24;
    try {
      const Project = require('../projects/project.model');
      const localP = await Project.findOne(
        isObjectId
          ? { $or: [{ _id: idStr }, { projectId: idStr }, { projectId: idStr.toUpperCase() }] }
          : { $or: [{ projectId: idStr }, { projectId: idStr.toUpperCase() }] }
      ).lean();

      if (localP) {
        return {
          ...localP,
          _id: localP._id,
          projectId: (localP.projectId || idStr).toUpperCase(),
          projectName: localP.projectName || localP.title || 'Project',
          title: localP.projectName || localP.title || 'Project',
          organization: localP.organization || localP.projectName || 'Organization',
          source: 'TRACKER_LOCAL_DB'
        };
      }
    } catch (_) {}

    // 3. If an approved ProjectRequest ID was passed, resolve strictly to its underlying Core Project
    try {
      const ProjectRequest = require('../project-requests/project-request.model');
      const reqDoc = await ProjectRequest.findOne(
        isObjectId
          ? { $or: [{ _id: idStr }, { requestId: idStr }, { requestId: idStr.toUpperCase() }] }
          : { $or: [{ requestId: idStr }, { requestId: idStr.toUpperCase() }] }
      ).lean();

      if (reqDoc && reqDoc.projectId) {
        // Resolve directly to the underlying master Core Backend project
        return await this._findProject(reqDoc.projectId);
      }
    } catch (_) {}

    // 4. Lookup in Timeline collection (if timeline already exists for this ID/code)
    try {
      const Timeline = require('./timeline.model');
      const existingT = await Timeline.findOne(
        isObjectId
          ? { $or: [{ _id: idStr }, { project: idStr }, { projectId: idStr }, { projectId: idStr.toUpperCase() }] }
          : { $or: [{ projectId: idStr }, { projectId: idStr.toUpperCase() }] }
      ).populate('projectManager', 'name email employeeCode globalRole designation').lean();

      if (existingT) {
        return {
          _id: existingT.project || existingT._id,
          projectId: (existingT.projectId || idStr).toUpperCase(),
          projectName: existingT.projectName || 'Project',
          title: existingT.projectName || 'Project',
          organization: existingT.organization || 'Direct Organization',
          email: existingT.email || '',
          phone: existingT.phone || '',
          address: existingT.address || '',
          numberOfSchools: existingT.numberOfSchools || 0,
          numberOfLicenses: existingT.numberOfLicenses || 0,
          country: existingT.country || '',
          status: 'ACTIVE',
          isActive: true,
          projectManager: existingT.projectManager || null,
          source: 'TIMELINE_DOC'
        };
      }
    } catch (_) {}

    // 5. Fetch directly from Core Backend API
    try {
      const coreP = await coreApi.getProjectById(idStr);
      if (coreP) {
        return {
          _id: coreP._id,
          projectId: (coreP.projectId || idStr).toUpperCase(),
          projectName: coreP.projectName || coreP.title || 'Core Project',
          title: coreP.projectName || coreP.title || 'Core Project',
          organization: coreP.projectName || coreP.client || 'Direct Organization',
          email: coreP.email || '',
          phone: coreP.phone || '',
          address: coreP.address || '',
          numberOfSchools: coreP.numberOfSchools || 0,
          numberOfLicenses: coreP.numberOfLicenses || 0,
          country: typeof coreP.country === 'object' && coreP.country ? coreP.country.name : (coreP.country || ''),
          status: 'ACTIVE',
          isActive: true,
          source: 'CORE_BACKEND'
        };
      }
    } catch (_) { }

    return null;
  }

  /**
   * ── Single Unified Method to Create Timeline for a Project ───────────────
   * Creates the Timeline document referencing the Project (Core Backend Mongo ID / code)
   * with initial stages array and generates all 8 canonical stages and tasks.
   *
   * @param {Object|string} coreProjectOrId - Project object or ID from Core Backend / Tracker DB
   * @param {string|ObjectId} pmId - Assigned Project Manager employee ID
   * @param {ClientSession|null} session - Optional MongoDB transaction session
   * @returns {Promise<Timeline>} Created or existing Timeline document
   */
  async createTimelineForProject(coreProjectOrId, pmId = null, session = null) {
    let project = null;
    let effectivePmId = pmId;

    if (coreProjectOrId && typeof coreProjectOrId === 'object' && coreProjectOrId._id) {
      project = coreProjectOrId;
    } else {
      project = await this._findProject(coreProjectOrId);
    }

    if (!project) {
      console.warn(`[TimelineService] Project not found for timeline creation: ${coreProjectOrId}`);
      return null;
    }

    // STRICT VALIDATION: Timeline can ONLY be created for projects that strictly exist in Core Backend.
    let isCoreProject = false;
    if (project.source === 'CORE_BACKEND' || project.source === 'CORE_BACKEND_WITH_LOCAL_MERGE') {
      isCoreProject = true;
    } else {
      const lookupCode = project._id ? String(project._id) : (project.projectId || '');
      try {
        const verifiedCoreP = await coreApi.getProjectById(lookupCode);
        if (verifiedCoreP) {
          isCoreProject = true;
          project.source = 'CORE_BACKEND';
        }
      } catch (err) {
        console.warn(`[TimelineService] Core Backend verification error for ${lookupCode}:`, err.message);
      }
    }

    if (!isCoreProject) {
      console.warn(`[TimelineService] Timeline creation aborted: Project '${project.projectId || coreProjectOrId}' is not in Core Backend.`);
      return null;
    }

    if (!effectivePmId && project) {
      effectivePmId = project.projectManager;
      if (effectivePmId && typeof effectivePmId === 'object' && effectivePmId._id) {
        effectivePmId = effectivePmId._id;
      }
    }

    if (!effectivePmId && project) {
      const ProjectMember = require('../project-members/project-member.model');
      const pmMember = await ProjectMember.findOne({ project: project._id, designation: 'PROJECT_MANAGER', isActive: true });
      if (pmMember && pmMember.employee) {
        effectivePmId = (typeof pmMember.employee === 'object' && pmMember.employee._id) ? pmMember.employee._id : pmMember.employee;
      }
    }

    const rawId = project ? project._id : coreProjectOrId;
    const projectIdObj = (rawId && mongoose.isValidObjectId(rawId))
      ? new mongoose.Types.ObjectId(String(rawId))
      : new mongoose.Types.ObjectId();
    const projectCode = project ? (project.projectId || String(project._id)) : String(coreProjectOrId);

    const query = {
      $or: [
        { project: projectIdObj },
        { projectId: projectCode },
        { projectId: projectCode.toUpperCase() },
        { projectId: projectCode.toLowerCase() }
      ]
    };

    let existingTimeline = session
      ? await Timeline.findOne(query).session(session)
      : await Timeline.findOne(query);

    if (existingTimeline) {
      if (effectivePmId && (!existingTimeline.projectManager || existingTimeline.projectManager.toString() !== effectivePmId.toString())) {
        existingTimeline.projectManager = effectivePmId;
        if (session) {
          await existingTimeline.save({ session });
        } else {
          await existingTimeline.save();
        }
      }
      return existingTimeline;
    }

    const timelineData = {
      project: projectIdObj,
      projectId: projectCode,
      projectName: project ? (project.projectName || project.title) : undefined,
      organization: project ? (project.organization || project.client || project.projectName) : undefined,
      email: project ? project.email : undefined,
      phone: project ? project.phone : undefined,
      address: project ? project.address : undefined,
      numberOfSchools: project ? (project.numberOfSchools || 0) : 0,
      numberOfLicenses: project ? (project.numberOfLicenses || 0) : 0,
      country: project ? (typeof project.country === 'object' && project.country ? project.country.name : project.country) : undefined,
      projectManager: effectivePmId || undefined,
      coreBackendData: project ? (project.toObject ? project.toObject() : project) : {},
      metadata: project ? (project.metadata || {}) : {},
      templateVersion: timelineConfig.version || 'v1',
      status: NODE_STATUSES.IN_PROGRESS,
      stages: []
    };

    const sessionOpts = session ? { session } : {};
    const createdTimelineArr = await Timeline.create([timelineData], sessionOpts);
    const createdTimeline = createdTimelineArr[0];

    for (const stageDef of timelineConfig.stages) {
      const stageAssignedTo = effectivePmId || null;
      const stageNodeArr = await TimelineNode.create([{
        timeline: createdTimeline._id,
        parentNode: null,
        type: NODE_TYPES.STAGE,
        key: stageDef.key,
        name: stageDef.name,
        order: stageDef.order,
        status: NODE_STATUSES.PENDING,
        assignedTo: stageAssignedTo,
        dependencies: stageDef.dependencies || [],
        formSchema: stageDef.formSchema || null,
        metadata: stageDef.metadata || {}
      }], sessionOpts);

      const createdStage = stageNodeArr[0];

      if (stageDef.substages) {
        for (const subDef of stageDef.substages) {
          const subAssignedTo = null;
          const subTaskNodeArr = await TimelineNode.create([{
            timeline: createdTimeline._id,
            parentNode: createdStage._id,
            type: NODE_TYPES.TASK,
            key: subDef.key,
            name: subDef.name,
            order: subDef.order,
            status: NODE_STATUSES.PENDING,
            assignedTo: subAssignedTo,
            formSchema: subDef.formSchema || null,
            metadata: subDef.metadata || {}
          }], sessionOpts);

          const createdSub = subTaskNodeArr[0];

          if (subDef.nested) {
            for (const nestedDef of subDef.nested) {
              const nestedAssignedTo = null;
              await TimelineNode.create([{
                timeline: createdTimeline._id,
                parentNode: createdSub._id,
                type: NODE_TYPES.TASK,
                key: nestedDef.key,
                name: nestedDef.name,
                order: nestedDef.order,
                status: NODE_STATUSES.PENDING,
                assignedTo: nestedAssignedTo,
                formSchema: nestedDef.formSchema || null,
                metadata: {
                  ...(nestedDef.metadata || {}),
                  customFields: nestedDef.customFields || [],
                  supportsConditional: nestedDef.supportsConditional || false,
                  conditionalOnly: nestedDef.conditionalOnly || null
                }
              }], sessionOpts);
            }
          }
        }
      }
    }

    return createdTimeline;
  }

  // Backward compatibility alias for single method
  async initializeTimelineForProject(projectId, pmId = null, session = null) {
    return this.createTimelineForProject(projectId, pmId, session);
  }

  // Backward compatibility alias for single method
  async createTimelineForApprovedProject(coreProjectOrId, pmId = null, session = null) {
    return this.createTimelineForProject(coreProjectOrId, pmId, session);
  }

  getSchemaMap() {
    const map = {};
    for (const stage of timelineConfig.stages) {
      if (stage.formSchema) map[stage.key] = stage.formSchema;
      if (stage.substages) {
        for (const sub of stage.substages) {
          if (sub.formSchema) map[sub.key] = sub.formSchema;
          if (sub.nested) {
            for (const n of sub.nested) {
              if (n.formSchema) map[n.key] = n.formSchema;
            }
          }
        }
      }
    }
    return map;
  }

  async getTimelineHierarchy(projectId) {
    const project = await this._findProject(projectId);
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // Robust PM resolution: Project -> ProjectMember -> ProjectRequest -> Default PM
    let effectivePmId = project.projectManager;
    if (effectivePmId && typeof effectivePmId === 'object' && effectivePmId._id) {
      effectivePmId = effectivePmId._id;
    }
    if (!effectivePmId) {
      const ProjectMember = require('../project-members/project-member.model');
      const pmMember = await ProjectMember.findOne({ project: project._id, designation: 'PROJECT_MANAGER', isActive: true });
      if (pmMember && pmMember.employee) {
        effectivePmId = (typeof pmMember.employee === 'object' && pmMember.employee._id) ? pmMember.employee._id : pmMember.employee;
      } else {
        const ProjectRequest = require('../project-requests/project-request.model');
        const reqDoc = await ProjectRequest.findOne({
          $or: [{ projectId: project._id }, { title: project.projectName }]
        });
        if (reqDoc && reqDoc.projectManager) {
          effectivePmId = (typeof reqDoc.projectManager === 'object' && reqDoc.projectManager._id) ? reqDoc.projectManager._id : reqDoc.projectManager;
        }
      }
    }

    if (effectivePmId && !project.projectManager) {
      project.projectManager = effectivePmId;
      if (typeof project.save === 'function') {
        await project.save();
      }
    }

    let timeline = await Timeline.findOne({
      $or: [
        { project: project._id },
        { projectId: project.projectId },
        { projectId: project.projectId ? project.projectId.toUpperCase() : undefined },
        { projectId: project.projectId ? project.projectId.toLowerCase() : undefined }
      ].filter(Boolean)
    }).populate('projectManager', 'name email employeeCode globalRole designation');

    if (!timeline) {
      try {
        timeline = await this.createTimelineForProject(project, effectivePmId);
        if (timeline) {
          timeline = await Timeline.findById(timeline._id).populate('projectManager', 'name email employeeCode globalRole designation');
        }
      } catch (initErr) {
        console.error('[TimelineService] Auto-initialize timeline failed:', initErr);
      }
    }

    if (!timeline) {
      return {
        timeline: null,
        project: {
          _id: project._id,
          projectId: project.projectId,
          projectName: project.projectName || project.title
        },
        nodes: [],
        stages: [],
        structure: []
      };
    } else if (effectivePmId && (!timeline.projectManager || (typeof timeline.projectManager === 'object' && timeline.projectManager._id.toString() !== effectivePmId.toString()) || timeline.projectManager.toString() !== effectivePmId.toString())) {
      timeline.projectManager = effectivePmId;
      await timeline.save();
      timeline = await Timeline.findById(timeline._id).populate('projectManager', 'name email employeeCode globalRole designation');
    }

    let nodes = await TimelineNode.find({ timeline: timeline._id })
      .populate('assignedTo', 'name email employeeCode')
      .sort({ order: 1 });

    // Ensure all STAGES (parent stage nodes) are assigned to PM, while tasks remain unassigned unless explicitly assigned by PM
    if (effectivePmId) {
      let pmAssignedUpdated = false;
      for (const node of nodes) {
        const isStageNode = node.type === NODE_TYPES.STAGE || !node.parentNode;
        if (isStageNode) {
          const currentAssignee = node.assignedTo?._id
            ? node.assignedTo._id.toString()
            : (node.assignedTo ? node.assignedTo.toString() : null);
          if (!currentAssignee || currentAssignee !== effectivePmId.toString()) {
            node.assignedTo = effectivePmId;
            await node.save();
            pmAssignedUpdated = true;
          }
        }
      }
      if (pmAssignedUpdated) {
        nodes = await TimelineNode.find({ timeline: timeline._id })
          .populate('assignedTo', 'name email employeeCode')
          .sort({ order: 1 });
      }
    }

    if (nodes.length === 0) {
      return {
        timeline,
        project: {
          _id: project._id,
          projectId: project.projectId,
          projectName: project.projectName || project.title
        },
        nodes: [],
        stages: [],
        structure: []
      };
    }

    // Auto-migrate Tech Stream to latest 2 tasks if not yet created
    const techStreamNode = nodes.find(n => n.key === 'TECH_STREAM');
    if (techStreamNode) {
      const techTasks = [
        { key: 'PROJECT_CONFIG_AND_IMPLEMENTATION', name: 'Project Configuration & Implementation', order: 1 },
        { key: 'TECH_TESTING', name: 'Testing Done', order: 2 }
      ];

      for (const t of techTasks) {
        let nodeFound = nodes.find(n => n.key === t.key);
        if (!nodeFound) {
          nodeFound = await TimelineNode.findOne({ timeline: timeline._id, key: t.key });
          if (!nodeFound) {
            nodeFound = await TimelineNode.create({
              timeline: timeline._id,
              parentNode: techStreamNode._id,
              key: t.key,
              name: t.name,
              type: 'TASK',
              order: t.order,
              status: 'PENDING'
            });
          }
          nodes.push(nodeFound);
        }
      }
    }

    // Auto-migrate Content Configuration to Task 4 of Stage 03 (ORDER_REQUIREMENT)
    const orderReqStageNode = nodes.find(n => n.key === 'ORDER_REQUIREMENT');
    if (orderReqStageNode) {
      let contentConfigNode = nodes.find(n => n.key === 'CONTENT_CONFIGURATION');
      if (!contentConfigNode) {
        contentConfigNode = await TimelineNode.findOne({ timeline: timeline._id, key: 'CONTENT_CONFIGURATION' });
      }
      if (contentConfigNode) {
        let changed = false;
        if (!contentConfigNode.parentNode || contentConfigNode.parentNode.toString() !== orderReqStageNode._id.toString()) {
          contentConfigNode.parentNode = orderReqStageNode._id;
          changed = true;
        }
        if (contentConfigNode.order !== 4) {
          contentConfigNode.order = 4;
          changed = true;
        }
        if (changed) {
          await contentConfigNode.save();
        }
        if (!nodes.some(n => n._id.toString() === contentConfigNode._id.toString())) {
          nodes.push(contentConfigNode);
        }
      } else {
        contentConfigNode = await TimelineNode.create({
          timeline: timeline._id,
          parentNode: orderReqStageNode._id,
          key: 'CONTENT_CONFIGURATION',
          name: 'Content Configuration',
          type: 'TASK',
          order: 4,
          status: 'PENDING',
          assignedTo: null
        });
        nodes.push(contentConfigNode);
      }
    }

    // Auto-migrate Content Stream to 4 tasks (Content Review & QA, Sheet Readiness, Dump Readiness, Content Ready)
    const contentStreamNode = nodes.find(n => n.key === 'CONTENT_STREAM');
    if (contentStreamNode) {
      const contentTasks = [
        { key: 'CONTENT_REVIEW_QA', name: 'Content Review & QA', order: 1 },
        { key: 'SHEET_READINESS', name: 'Sheet Readiness', order: 2 },
        { key: 'DUMP_READINESS', name: 'Dump Readiness', order: 3 },
        { key: 'CONTENT_READY', name: 'Content Ready', order: 4 }
      ];

      for (const t of contentTasks) {
        let nodeFound = nodes.find(n => n.key === t.key);
        if (!nodeFound) {
          nodeFound = await TimelineNode.findOne({ timeline: timeline._id, key: t.key });
          if (!nodeFound) {
            nodeFound = await TimelineNode.create({
              timeline: timeline._id,
              parentNode: contentStreamNode._id,
              key: t.key,
              name: t.name,
              type: 'TASK',
              order: t.order,
              status: 'PENDING'
            });
          }
          nodes.push(nodeFound);
        } else if (nodeFound.order !== t.order) {
          nodeFound.order = t.order;
          await nodeFound.save();
        }
      }
    }

    // Auto-migrate Stage 02 (PO_AND_PI) tasks
    const poAndPiStageNode = nodes.find(n => n.key === 'PO_AND_PI');
    if (poAndPiStageNode) {
      const poPiTasks = [
        { key: 'PO_UPLOAD', name: 'PO Upload', order: 1 },
        { key: 'PI_REQUEST', name: 'PI Request', order: 2 },
        { key: 'PI_UPLOAD', name: 'PI & Tax Invoice Upload', order: 3 }
      ];

      for (const t of poPiTasks) {
        let nodeFound = nodes.find(n => n.key === t.key);
        if (!nodeFound) {
          nodeFound = await TimelineNode.findOne({ timeline: timeline._id, key: t.key });
          if (!nodeFound) {
            nodeFound = await TimelineNode.create({
              timeline: timeline._id,
              parentNode: poAndPiStageNode._id,
              key: t.key,
              name: t.name,
              type: 'TASK',
              order: t.order,
              status: 'PENDING'
            });
          }
          nodes.push(nodeFound);
        }
      }
    }

    // Auto-migrate Stage 05 (TECH_AND_CONTENT_TESTING) to 2 tasks
    const testingStageNode = nodes.find(n => n.key === 'TECH_AND_CONTENT_TESTING');
    if (testingStageNode) {
      const testingTasks = [
        { key: 'TESTING_PREPARATION', name: 'Testing Preparation', order: 1 },
        { key: 'INTEGRATION_TESTING', name: 'Integration Testing', order: 2 }
      ];

      for (const t of testingTasks) {
        let nodeFound = nodes.find(n => n.key === t.key);
        if (!nodeFound) {
          nodeFound = await TimelineNode.findOne({ timeline: timeline._id, key: t.key });
          if (!nodeFound) {
            nodeFound = await TimelineNode.create({
              timeline: timeline._id,
              parentNode: testingStageNode._id,
              key: t.key,
              name: t.name,
              type: 'TASK',
              order: t.order,
              status: 'PENDING'
            });
          }
          nodes.push(nodeFound);
        }
      }
    }

    // Auto-start Execution Phase if Order Requirement is already completed
    const orderReqNode = nodes.find(n => n.key === 'ORDER_REQUIREMENT');
    const execNode = nodes.find(n => n.key === 'EXECUTION');
    if (orderReqNode && orderReqNode.status === NODE_STATUSES.COMPLETED && execNode && (execNode.status === NODE_STATUSES.PENDING || execNode.status === 'NOT_STARTED')) {
      await this.startExecutionPhaseIfOrderReqCompleted(timeline._id, project._id);
      nodes = await TimelineNode.find({ timeline: timeline._id })
        .populate('assignedTo', 'name email employeeCode')
        .sort({ order: 1 });
    }

    const prNode = nodes.find(n => n.key === 'PROJECT_REVIEWER');
    const pcNode = nodes.find(n => n.key === 'PROJECT_CREATED');
    if (prNode && pcNode) {
      if (Object.keys(pcNode.formData || {}).length > 0 && Object.keys(prNode.formData || {}).length === 0) {
        prNode.formData = pcNode.formData;
      }
      if (pcNode.status === 'COMPLETED' && prNode.status !== 'COMPLETED') {
        prNode.status = 'COMPLETED';
      }
    }

    // Auto-migrate Stage 06 (INSTALLATION) to 3 tasks: Installation Planning (1), Installation Execution (2), Installation Completed (3)
    const installStageNode = nodes.find(n => n.key === 'INSTALLATION');
    if (installStageNode) {
      const installTasks = [
        { key: 'INSTALLATION_PLANNING', name: 'Installation Planning', order: 1 },
        { key: 'INSTALLATION_EXECUTION', name: 'Installation Execution', order: 2 },
        { key: 'INSTALLATION_COMPLETED', name: 'Installation Completed', order: 3 }
      ];

      for (const t of installTasks) {
        let nodeFound = nodes.find(n => n.key === t.key);
        if (!nodeFound) {
          nodeFound = await TimelineNode.findOne({ timeline: timeline._id, key: t.key });
          if (!nodeFound) {
            nodeFound = await TimelineNode.create({
              timeline: timeline._id,
              parentNode: installStageNode._id,
              key: t.key,
              name: t.name,
              type: 'TASK',
              order: t.order,
              status: 'PENDING',
              assignedTo: null
            });
          } else {
            nodeFound.parentNode = installStageNode._id;
            nodeFound.order = t.order;
            await nodeFound.save();
          }
          nodes.push(nodeFound);
        } else {
          let modified = false;
          if (nodeFound.order !== t.order) {
            nodeFound.order = t.order;
            modified = true;
          }
          if (!nodeFound.parentNode || nodeFound.parentNode.toString() !== installStageNode._id.toString()) {
            nodeFound.parentNode = installStageNode._id;
            modified = true;
          }
          if (modified) {
            await nodeFound.save();
          }
        }
      }
    }

    // Auto-migrate Stage 07 (TRAINING) to 3 tasks: Training Planning (1), Training Execution (2), Training Completed (3)
    const trainingExecNode = nodes.find(n => n.key === 'TRAINING_EXECUTION');
    if (trainingExecNode && trainingExecNode.order !== 2) {
      trainingExecNode.order = 2;
      await trainingExecNode.save();
    }
    const trainingCompletedNode = nodes.find(n => n.key === 'TRAINING_COMPLETED');
    if (trainingCompletedNode && trainingCompletedNode.order !== 3) {
      trainingCompletedNode.order = 3;
      await trainingCompletedNode.save();
    }

    const DISABLED_KEYS = new Set([
      'PROJECT_CREATED',
      'PI_REQUEST',
      'ADDRESS_CONFIRMATION',
      'DELIVERY_AND_TRACKING',
      'TECHNICAL_SETUP',
      'IMPLEMENTATION_AND_CONFIG',
      'TECH_INTERNAL_TESTING',
      'TECH_READY',
      'CONTENT_PREPARATION',
      'CONTENT_CONFIG',
      'ISSUE_RESOLUTION',
      'TESTING_COMPLETED',
      'INSTALLATION_TESTING',
      'TRAINING_SCHEDULE'
    ]);
    nodes = nodes.filter(n => !DISABLED_KEYS.has(n.key));

    const schemaMap = this.getSchemaMap();
    const nameMap = {};
    for (const stage of timelineConfig.stages) {
      nameMap[stage.key] = stage.name;
      if (stage.substages) {
        for (const sub of stage.substages) {
          nameMap[sub.key] = sub.name;
          if (sub.nested) {
            for (const n of sub.nested) {
              nameMap[n.key] = n.name;
            }
          }
        }
      }
    }

    // Fetch actual database models to enrich Stage 3 data from seeded collections
    let dbSchools = [];
    let dbHardware = [];
    let dbSolutions = [];
    let dbProjectSchools = null;
    let dbRequirement = null;
    try {
      const School = require('../schools/school.model');
      const Hardware = require('../hardware/hardware.model');
      const Solution = require('../solutions/solution.model');
      const ProjectSchools = require('../project-schools/project-schools.model');
      const Requirements = require('../requirements/requirements.model');
      [dbSchools, dbHardware, dbSolutions, dbProjectSchools, dbRequirement] = await Promise.all([
        School.find({ projectId: project._id, isActive: true })
          .populate('installation.assignedEngineerId', 'name email phone')
          .populate('training.assignedTrainerId', 'name email phone')
          .lean()
          .catch(() => []),
        Hardware.find({ isActive: true }).lean().catch(() => []),
        Solution.find({ isActive: true }).lean().catch(() => []),
        ProjectSchools.findOne({ project: project._id }).lean().catch(() => null),
        Requirements.findOne({ project: project._id }).lean().catch(() => null)
      ]);
    } catch (e) {
      console.warn('DB enrich warning in getTimelineHierarchy:', e.message);
    }

    // Format canonical project schools from MongoDB School collection or ProjectSchools
    let canonicalSchools = [];
    if (dbSchools && dbSchools.length > 0) {
      canonicalSchools = dbSchools.map((s) => ({
        id: String(s._id),
        _id: String(s._id),
        schoolId: s.schoolId || String(s._id),
        schoolName: s.name,
        name: s.name,
        schoolCode: s.schoolId || String(s._id),
        address: s.address || '',
        addressContact: s.address ? `${s.address}\nContact: ${s.contactPerson?.phone || ''}` : '',
        principalName: s.survey?.principalName || s.contactPerson?.name || '',
        principalDetails: s.survey?.principalDetails || `${s.contactPerson?.name || ''} (${s.contactPerson?.phone || ''})`,
        pocName: s.survey?.pocName || s.contactPerson?.name || s.survey?.principalName || '',
        pocDesignation: s.survey?.pocDesignation || s.contactPerson?.designation || (s.survey?.principalName ? 'Principal' : ''),
        pocContact: s.survey?.pocContact || s.contactPerson?.phone || '',
        phone: s.contactPerson?.phone || s.survey?.pocContact || '',
        email: s.contactPerson?.email || s.survey?.email || '',
        classes: s.classes || s.survey?.classes || [],
        installation: s.installation || {},
        training: s.training || {},
        survey: s.survey || {},
        school: s._id,
        ...(s.survey || {})
      }));
    } else if (dbProjectSchools?.schools && dbProjectSchools.schools.length > 0) {
      canonicalSchools = dbProjectSchools.schools.map((ps) => ({
        id: String(ps.school || ps._id),
        _id: String(ps.school || ps._id),
        schoolId: ps.schoolId || String(ps.school || ps._id),
        schoolName: ps.schoolName || ps.name,
        name: ps.schoolName || ps.name,
        schoolCode: ps.schoolId || String(ps.school || ps._id),
        address: ps.address || '',
        addressContact: ps.address ? `${ps.address}\nContact: ${ps.contactPerson?.phone || ''}` : '',
        principalName: ps.survey?.principalName || ps.contactPerson?.name || '',
        principalDetails: ps.survey?.principalDetails || `${ps.contactPerson?.name || ''} (${ps.contactPerson?.phone || ''})`,
        pocName: ps.survey?.pocName || ps.contactPerson?.name || '',
        pocDesignation: ps.survey?.pocDesignation || ps.contactPerson?.designation || '',
        pocContact: ps.survey?.pocContact || ps.contactPerson?.phone || '',
        phone: ps.contactPerson?.phone || ps.survey?.pocContact || '',
        email: ps.contactPerson?.email || '',
        classes: ps.classes || ps.survey?.classes || [],
        installation: ps.installation || {},
        training: ps.training || {},
        survey: ps.survey || {},
        school: ps.school || ps._id,
        ...(ps.survey || {})
      }));
    }

    // Build hierarchical tree
    const nodeMap = {};
    nodes.forEach(node => {
      const obj = node.toObject();
      if (!obj.assignedTo || (typeof obj.assignedTo === 'object' && !obj.assignedTo._id && !obj.assignedTo.name)) {
        obj.assignedTo = null;
      }
      obj.assignedEmployee = obj.assignedTo || null;
      obj.formData = obj.formData || {};
      if (schemaMap[node.key]) {
        obj.formSchema = schemaMap[node.key];
      }
      if (nameMap[node.key]) {
        obj.name = nameMap[node.key];
      }

      // Attach canonical schools to every node so every stage sees exact DB schools
      obj.formData = {
        ...obj.formData,
        schools: canonicalSchools.length > 0 ? canonicalSchools : (obj.formData.schools || []),
        projectSchools: canonicalSchools.length > 0 ? canonicalSchools : (obj.formData.projectSchools || [])
      };

      // ── Enrich Stage 03 nodes directly from MongoDB seeded collections ──
      if (node.key === 'ORDER_REQUIREMENT') {
        const orderReqFromDb = dbProjectSchools?.orderRequirement || dbRequirement?.orderRequirement || {};
        obj.formData = {
          orderRequirement: orderReqFromDb,
          solutionsSelected: orderReqFromDb.solutionsSelected || [],
          overallHardwareBOM: orderReqFromDb.overallHardwareBOM || {},
          totalSchoolsEnrolled: orderReqFromDb.totalSchoolsEnrolled || canonicalSchools.length,
          remarks: orderReqFromDb.remarks || `Order Requirement verified for ${canonicalSchools.length} schools deployment.`,
          schools: canonicalSchools,
          projectSchools: canonicalSchools,
          ...obj.formData
        };
      }

      if (node.key === 'SCHOOL_ONBOARDING_INFORMATION' && canonicalSchools.length > 0) {
        const primarySchool = canonicalSchools[0] || {};
        obj.formData = {
          ...primarySchool,
          ...obj.formData,
          schoolName: obj.formData.schoolName || canonicalSchools.map(s => s.schoolName).filter(Boolean).join('; ') || project.organization || project.projectName,
          totalStudents: obj.formData.totalStudents || canonicalSchools.reduce((acc, c) => acc + (Number(c.totalStudents) || 0), 0) || canonicalSchools.length * 850,
          schools: canonicalSchools,
          projectSchools: canonicalSchools
        };
      }

      if (node.key === 'HARDWARE_REQUIREMENT') {
        const bom = dbProjectSchools?.orderRequirement?.overallHardwareBOM || {};
        const selectedHw = Object.keys(bom).length > 0
          ? Object.keys(bom)
          : (Array.isArray(obj.formData.selectedHardware)
            ? obj.formData.selectedHardware
            : (Array.isArray(obj.formData.activeHardwareKeys) ? obj.formData.activeHardwareKeys : []));

        if (selectedHw.length > 0 && dbHardware.length > 0) {
          const hwItemsMap = {};
          selectedHw.forEach(hwKey => {
            const dbHw = dbHardware.find(h => h.key === hwKey || h.key?.toUpperCase() === hwKey?.toUpperCase());
            const qty = bom[hwKey] !== undefined ? bom[hwKey] : (project.numberOfSchools || dbSchools.length || 1);
            hwItemsMap[hwKey] = {
              itemKey: hwKey,
              key: hwKey,
              itemName: dbHw?.name || dbHw?.label || hwKey.replace(/_/g, ' '),
              name: dbHw?.name || dbHw?.label || hwKey.replace(/_/g, ' '),
              quantity: qty,
              qty: qty,
              specNotes: obj.formData.hardwareNotes || dbHw?.description || '',
              category: dbHw?.departmentCode || 'Hardware',
              unit: dbHw?.unit || 'NOS'
            };
          });
          obj.formData = {
            ...obj.formData,
            items: hwItemsMap,
            hardwareRequirements: {
              ...(obj.formData.hardwareRequirements || {}),
              items: hwItemsMap
            },
            itemsList: Object.values(hwItemsMap),
            overallHardwareBOM: bom,
            selectedHardware: selectedHw
          };
        }
      }

      if (node.key === 'SOLUTION_SELECTION') {
        const dbSolsSelected = dbProjectSchools?.orderRequirement?.solutionsSelected || [];
        const selectedSol = dbSolsSelected.length > 0
          ? dbSolsSelected.map(s => s.solutionKey)
          : (Array.isArray(obj.formData.selectedSolutions)
            ? obj.formData.selectedSolutions
            : (Array.isArray(obj.formData.activeSolutionKeys) ? obj.formData.activeSolutionKeys : []));

        if (selectedSol.length > 0 && dbSolutions.length > 0) {
          const solItemsMap = {};
          selectedSol.forEach(solKey => {
            const dbSol = dbSolutions.find(s => s.key === solKey || s.key?.toUpperCase() === solKey?.toUpperCase());
            const seededSol = dbSolsSelected.find(s => s.solutionKey === solKey);
            const solName = seededSol?.solutionName || dbSol?.name || dbSol?.label || solKey.replace(/_/g, ' ');
            solItemsMap[solKey] = {
              solutionKey: solKey,
              key: solKey,
              solutionName: solName,
              name: solName,
              quantity: (project.numberOfSchools || dbSchools.length || 1),
              notes: obj.formData.solutionNotes || dbSol?.description || ''
            };
          });
          obj.formData = {
            ...obj.formData,
            solutions: solItemsMap,
            solutionsList: Object.values(solItemsMap),
            selectedSolutions: selectedSol,
            solutionsSelected: dbSolsSelected
          };
        }
      }

      if (node.key === 'CONTENT_CONFIGURATION') {
        const reqContent = dbRequirement?.orderRequirement?.contentConfiguration || {};
        obj.formData = {
          curriculumBoard: obj.formData.curriculumBoard || reqContent.curriculumBoard || 'CBSE & State Board Integrated',
          gradesConfigured: obj.formData.gradesConfigured || reqContent.gradesConfigured || 'Grades 6 to 12',
          subjectsConfigured: obj.formData.subjectsConfigured || reqContent.subjectsConfigured || 'Mathematics, Science, English, Computer Science & AI',
          configuredBy: obj.formData.configuredBy || reqContent.configuredBy || 'Kavita Rao',
          remarks: obj.formData.remarks || reqContent.remarks || 'Full animated lessons and interactive simulations indexed.',
          languages: obj.formData.languages || reqContent.languages || ['English', 'Hindi'],
          ...reqContent,
          ...obj.formData
        };
      }

      if (['INSTALLATION_PLANNING', 'INSTALLATION_COMPLETED', 'INSTALLATION'].includes(node.key)) {
        const instData = dbProjectSchools?.installation || {};
        obj.formData = {
          installationPlanning: instData.planning || obj.formData.installationPlanning || canonicalSchools,
          plannedSchools: instData.planning || obj.formData.plannedSchools || canonicalSchools,
          ...instData,
          ...obj.formData,
          schools: canonicalSchools.length > 0 ? canonicalSchools : (obj.formData.schools || []),
          projectSchools: canonicalSchools.length > 0 ? canonicalSchools : (obj.formData.projectSchools || [])
        };
      }

      if (['TRAINING_PLANNING', 'TRAINING_EXECUTION', 'TRAINING_COMPLETED', 'TRAINING'].includes(node.key)) {
        const trainingData = dbProjectSchools?.training || {};

        obj.formData = {
          trainingPlanning: trainingData.planning || obj.formData.trainingPlanning || canonicalSchools,
          plannedSchools: trainingData.planning || obj.formData.plannedSchools || canonicalSchools,
          schoolWiseTrainingPlans: trainingData.schoolWiseTrainingPlans || obj.formData.schoolWiseTrainingPlans || {},
          trainingExecution: trainingData.execution || obj.formData.trainingExecution || {},
          trainingExecutionSection: trainingData.execution?.trainingExecutionSection || trainingData.schoolWiseTrainingExecutions || obj.formData.trainingExecutionSection || {},
          schoolWiseTrainingExecutions: trainingData.schoolWiseTrainingExecutions || obj.formData.schoolWiseTrainingExecutions || {},
          trainingCompleted: trainingData.completed || obj.formData.trainingCompleted || {},
          trainingCompletedSection: trainingData.completed?.trainingCompletedSection || trainingData.schoolWiseTrainingCompletion || obj.formData.trainingCompletedSection || {},
          schoolWiseTrainingCompletion: trainingData.schoolWiseTrainingCompletion || obj.formData.schoolWiseTrainingCompletion || {},
          completed: trainingData.completed?.completed || obj.formData.completed || (trainingData.overallStatus === 'COMPLETED' ? 'YES' : 'NO'),
          ...(trainingData.planning || {}),
          ...(trainingData.execution || {}),
          ...(trainingData.completed || {}),
          ...obj.formData,
          schools: canonicalSchools.length > 0 ? canonicalSchools : (obj.formData.schools || []),
          projectSchools: canonicalSchools.length > 0 ? canonicalSchools : (obj.formData.projectSchools || [])
        };
      }

      nodeMap[node._id.toString()] = { ...obj, children: [] };
    });

    const tree = [];
    nodes.forEach(node => {
      if (node.parentNode) {
        if (nodeMap[node.parentNode.toString()]) {
          nodeMap[node.parentNode.toString()].children.push(nodeMap[node._id.toString()]);
        }
      } else {
        tree.push(nodeMap[node._id.toString()]);
      }
    });

    // Also update nodes array with the enriched formData
    const enrichedNodes = nodes.map(node => {
      const mapped = nodeMap[node._id.toString()];
      if (mapped) {
        const { children, ...rest } = mapped;
        return rest;
      }
      return node;
    });

    return { timeline, structure: tree, nodes: enrichedNodes };
  }

  async getNodeDoc(projectId, nodeId) {
    const project = await this._findProject(projectId);
    const pId = project ? project._id : projectId;
    const timeline = await Timeline.findOne({ project: pId });
    if (!timeline) throw new AppError('Timeline not found.', 404, 'TIMELINE_NOT_FOUND');

    const node = await TimelineNode.findOne({ _id: nodeId, timeline: timeline._id })
      .populate('assignedTo', 'name email employeeCode');
    if (!node) throw new AppError('Timeline node not found.', 404, 'NODE_NOT_FOUND');

    const schemaMap = this.getSchemaMap();
    if (schemaMap[node.key]) {
      node.formSchema = schemaMap[node.key];
    }
    return node;
  }

  async getNodeById(projectId, nodeId) {
    const project = await this._findProject(projectId);
    const pId = project ? project._id : projectId;
    const timeline = await Timeline.findOne({ project: pId });
    if (!timeline) throw new AppError('Timeline not found.', 404, 'TIMELINE_NOT_FOUND');

    const node = await TimelineNode.findOne({ _id: nodeId, timeline: timeline._id })
      .populate('assignedTo', 'name email employeeCode');
    if (!node) throw new AppError('Timeline node not found.', 404, 'NODE_NOT_FOUND');

    const schemaMap = this.getSchemaMap();
    const nodeObj = node.toObject();
    if (schemaMap[node.key]) {
      nodeObj.formSchema = schemaMap[node.key];
    }

    // Auto-fill node formData from Project & Requirements if empty
    try {
      const Requirements = require('../requirements/requirements.model');
      const reqDoc = await Requirements.findOne({ project: pId }).lean();
      const projDoc = project ? (project.toObject ? project.toObject() : project) : null;

      if (!nodeObj.formData || Object.keys(nodeObj.formData).length === 0) {
        nodeObj.formData = {};
      }

      // Fetch actual DB schools for the project to ensure no random data is ever used
      const School = require('../schools/school.model');
      const ProjectSchools = require('../project-schools/project-schools.model');
      const [dbSchools, psDocForSchools] = await Promise.all([
        School.find({ projectId: projectId, isActive: true })
          .populate('installation.assignedEngineerId', 'name email phone')
          .populate('training.assignedTrainerId', 'name email phone')
          .lean()
          .catch(() => []),
        ProjectSchools.findOne({ project: projectId }).lean().catch(() => null)
      ]);

      let canonicalSchools = [];
      if (dbSchools.length > 0) {
        canonicalSchools = dbSchools.map((s) => ({
          id: String(s._id),
          _id: String(s._id),
          schoolId: s.schoolId || String(s._id),
          schoolName: s.name,
          name: s.name,
          schoolCode: s.schoolId || String(s._id),
          address: s.address || '',
          addressContact: s.address ? `${s.address}\nContact: ${s.contactPerson?.phone || ''}` : '',
          principalName: s.survey?.principalName || s.contactPerson?.name || '',
          principalDetails: s.survey?.principalDetails || `${s.contactPerson?.name || ''} (${s.contactPerson?.phone || ''})`,
          pocName: s.survey?.pocName || s.contactPerson?.name || s.survey?.principalName || '',
          pocDesignation: s.survey?.pocDesignation || s.contactPerson?.designation || (s.survey?.principalName ? 'Principal' : ''),
          pocContact: s.survey?.pocContact || s.contactPerson?.phone || '',
          phone: s.contactPerson?.phone || s.survey?.pocContact || '',
          email: s.contactPerson?.email || s.survey?.email || '',
          classes: s.classes || s.survey?.classes || [],
          installation: s.installation || {},
          training: s.training || {},
          survey: s.survey || {},
          school: s._id,
          ...(s.survey || {})
        }));
      } else if (psDocForSchools?.schools && psDocForSchools.schools.length > 0) {
        canonicalSchools = psDocForSchools.schools.map((ps) => ({
          id: String(ps.school || ps._id),
          _id: String(ps.school || ps._id),
          schoolId: ps.schoolId || String(ps.school || ps._id),
          schoolName: ps.schoolName || ps.name,
          name: ps.schoolName || ps.name,
          schoolCode: ps.schoolId || String(ps.school || ps._id),
          address: ps.address || '',
          addressContact: ps.address ? `${ps.address}\nContact: ${ps.contactPerson?.phone || ''}` : '',
          principalName: ps.survey?.principalName || ps.contactPerson?.name || '',
          principalDetails: ps.survey?.principalDetails || `${ps.contactPerson?.name || ''} (${ps.contactPerson?.phone || ''})`,
          pocName: ps.survey?.pocName || ps.contactPerson?.name || '',
          pocDesignation: ps.survey?.pocDesignation || ps.contactPerson?.designation || '',
          pocContact: ps.survey?.pocContact || ps.contactPerson?.phone || '',
          phone: ps.contactPerson?.phone || ps.survey?.pocContact || '',
          email: ps.contactPerson?.email || '',
          classes: ps.classes || ps.survey?.classes || [],
          installation: ps.installation || {},
          training: ps.training || {},
          survey: ps.survey || {},
          school: ps.school || ps._id,
          ...(ps.survey || {})
        }));
      }

      // Ensure every single node has the project's real DB schools attached!
      nodeObj.formData = {
        ...nodeObj.formData,
        schools: canonicalSchools.length > 0 ? canonicalSchools : (nodeObj.formData?.schools || []),
        projectSchools: canonicalSchools.length > 0 ? canonicalSchools : (nodeObj.formData?.projectSchools || [])
      };

      if (['PROJECT_CREATED', 'LEAD_CREATION', 'PROJECT_REVIEWER'].includes(node.key)) {
        const pReview = reqDoc?.projectReviewer?.projectCreated || {};
        nodeObj.formData = {
          projectName: nodeObj.formData.projectName || pReview.organizationName || projDoc?.projectName || projDoc?.title || '',
          organizationName: nodeObj.formData.organizationName || pReview.organizationName || projDoc?.organization || projDoc?.projectName || '',
          email: nodeObj.formData.email || pReview.email || projDoc?.email || '',
          phone: nodeObj.formData.phone || pReview.phone || projDoc?.phone || '',
          address: nodeObj.formData.address || pReview.address || projDoc?.address || '',
          location: nodeObj.formData.location || pReview.address || projDoc?.address || '',
          country: nodeObj.formData.country || pReview.country || 'India',
          confirmed: nodeObj.formData.confirmed || pReview.confirmed || 'YES',
          projectReviewed: nodeObj.formData.projectReviewed || pReview.projectReviewed || 'YES',
          projectCreated: nodeObj.formData.projectCreated || pReview.projectCreated || 'YES',
          remarks: nodeObj.formData.remarks || pReview.remarks || projDoc?.description || '',
          ...nodeObj.formData,
          schools: canonicalSchools
        };
      } else if (node.key === 'SCHOOL_ONBOARDING_INFORMATION') {
        const sInfo = reqDoc?.orderRequirement?.schoolInformation || {};
        const primarySchool = canonicalSchools[0] || {};
        nodeObj.formData = {
          ...primarySchool,
          schoolName: canonicalSchools.map(s => s.schoolName).filter(Boolean).join('; ') || projDoc?.organization || projDoc?.projectName || '',
          address: primarySchool.address || sInfo.address || projDoc?.address || '',
          phone: primarySchool.phone || sInfo.phone || projDoc?.phone || '',
          email: primarySchool.email || sInfo.email || projDoc?.email || '',
          totalStudents: canonicalSchools.reduce((acc, curr) => acc + (Number(curr.totalStudents) || 0), 0) || projDoc?.numberOfSchools || 0,
          remarks: nodeObj.formData?.remarks || sInfo.remarks || '',
          ...nodeObj.formData,
          schools: canonicalSchools
        };
      } else if (['INSTALLATION_PLANNING', 'INSTALLATION_EXECUTION', 'INSTALLATION_COMPLETED', 'INSTALLATION'].includes(node.key)) {
        const instPlanning = psDocForSchools?.installation?.planning || nodeObj.formData?.installationPlanning || canonicalSchools;
        nodeObj.formData = {
          ...nodeObj.formData,
          installationPlanning: instPlanning,
          plannedSchools: instPlanning,
          schools: canonicalSchools
        };
      } else if (['TRAINING_EXECUTION', 'TRAINING_PLANNING', 'TRAINING_COMPLETED', 'TRAINING'].includes(node.key)) {
        nodeObj.formData = {
          ...nodeObj.formData,
          schools: canonicalSchools
        };

        // If training node, enrich from canonical Training and ProjectSchools documents
        if (['TRAINING_PLANNING', 'TRAINING_EXECUTION', 'TRAINING_COMPLETED', 'TRAINING'].includes(node.key)) {
          const ProjectSchools = require('../project-schools/project-schools.model');
          const Training = require('../training/training.model');
          const [psDoc, trDoc] = await Promise.all([
            ProjectSchools.findOne({ project: pId }).lean().catch(() => null),
            Training.findOne({ project: pId }).lean().catch(() => null)
          ]);
          const trainingData = {
            ...(psDoc?.training || {}),
            ...(trDoc || {}),
            schoolWiseTrainingPlans: {
              ...(psDoc?.training?.schoolWiseTrainingPlans || {}),
              ...(trDoc?.schoolWiseTrainingPlans || {})
            },
            schoolWiseTrainingExecutions: {
              ...(psDoc?.training?.schoolWiseTrainingExecutions || {}),
              ...(trDoc?.schoolWiseTrainingExecutions || {})
            },
            schoolWiseTrainingCompletion: {
              ...(psDoc?.training?.schoolWiseTrainingCompletion || {}),
              ...(trDoc?.schoolWiseTrainingCompletion || {})
            }
          };

          // Build canonical map of school training plans
          const existingSchoolPlans = { ...(trainingData.schoolWiseTrainingPlans || {}) };
          if (nodeObj.formData?.schoolWiseTrainingPlans && typeof nodeObj.formData.schoolWiseTrainingPlans === 'object') {
            Object.assign(existingSchoolPlans, nodeObj.formData.schoolWiseTrainingPlans);
          }

          // Merge plans from ProjectSchools.schools
          if (psDoc?.schools && Array.isArray(psDoc.schools)) {
            for (const su of psDoc.schools) {
              const suSchoolId = String(su.school || su._id);
              if (su.training && (su.training.trainer || su.training.trainerName || (su.training.trainers && su.training.trainers.length > 0) || su.training.planOutDate)) {
                if (!existingSchoolPlans[suSchoolId] || !existingSchoolPlans[suSchoolId].trainers || existingSchoolPlans[suSchoolId].trainers.length === 0) {
                  existingSchoolPlans[suSchoolId] = {
                    ...(existingSchoolPlans[suSchoolId] || {}),
                    schoolId: suSchoolId,
                    schoolName: su.schoolName,
                    planOutDate: su.training.planOutDate || '',
                    technicalPersonId: su.training.trainer || '',
                    technicalPersonName: su.training.trainerName || '',
                    contactNumber: su.training.trainerPhone || '',
                    trainers: (su.training.trainers && su.training.trainers.length > 0) ? su.training.trainers : [
                      {
                        id: `trainer_1_${suSchoolId}`,
                        trainerId: su.training.trainer || '',
                        name: su.training.trainerName || '',
                        phone: su.training.trainerPhone || '',
                        role: 'Trainer 1 (Lead Trainer)'
                      }
                    ],
                    status: su.training.status || 'SCHEDULED'
                  };
                }
              }
            }
          }

          // Merge from School collection
          if (dbSchools && Array.isArray(dbSchools)) {
            for (const ds of dbSchools) {
              const dsId = String(ds._id);
              if (ds.training && (ds.training.assignedTrainerId || ds.training.trainerName || ds.training.planOutDate)) {
                const trObj = typeof ds.training.assignedTrainerId === 'object' ? ds.training.assignedTrainerId : null;
                const trId = trObj?._id || ds.training.assignedTrainerId || '';
                const trName = trObj?.name || ds.training.trainerName || '';
                const trPhone = trObj?.phone || ds.training.trainerPhone || '';

                if (!existingSchoolPlans[dsId] || !existingSchoolPlans[dsId].trainers || existingSchoolPlans[dsId].trainers.length === 0) {
                  existingSchoolPlans[dsId] = {
                    ...(existingSchoolPlans[dsId] || {}),
                    schoolId: dsId,
                    schoolName: ds.name,
                    planOutDate: ds.training.planOutDate || existingSchoolPlans[dsId]?.planOutDate || '',
                    technicalPersonId: trId || existingSchoolPlans[dsId]?.technicalPersonId || '',
                    technicalPersonName: trName || existingSchoolPlans[dsId]?.technicalPersonName || '',
                    contactNumber: trPhone || existingSchoolPlans[dsId]?.contactNumber || '',
                    trainers: (existingSchoolPlans[dsId]?.trainers && existingSchoolPlans[dsId].trainers.length > 0)
                      ? existingSchoolPlans[dsId].trainers
                      : [
                        {
                          id: `trainer_1_${dsId}`,
                          trainerId: trId,
                          name: trName,
                          phone: trPhone,
                          role: 'Trainer 1 (Lead Trainer)'
                        }
                      ],
                    status: ds.training.status || 'SCHEDULED'
                  };
                }
              }
            }
          }

          const plannedList = Object.values(existingSchoolPlans);

          nodeObj.formData = {
            ...(trainingData.planning || {}),
            ...(trainingData.execution || {}),
            ...nodeObj.formData,
            trainingPlanning: plannedList.length > 0 ? plannedList : (nodeObj.formData?.trainingPlanning || canonicalSchools),
            plannedSchools: plannedList.length > 0 ? plannedList : (nodeObj.formData?.plannedSchools || canonicalSchools),
            schoolWiseTrainingPlans: existingSchoolPlans,
            trainingExecution: trainingData.execution || nodeObj.formData?.trainingExecution || {},
            trainingExecutionSection: trainingData.execution?.trainingExecutionSection || trainingData.schoolWiseTrainingExecutions || nodeObj.formData?.trainingExecutionSection || {},
            schoolWiseTrainingExecutions: trainingData.schoolWiseTrainingExecutions || nodeObj.formData?.schoolWiseTrainingExecutions || {},
            trainingCompletedSection: trainingData.completed?.trainingCompletedSection || trainingData.schoolWiseTrainingCompletion || nodeObj.formData?.trainingCompletedSection || {},
            schoolWiseTrainingCompletion: trainingData.schoolWiseTrainingCompletion || nodeObj.formData?.schoolWiseTrainingCompletion || {},
            completed: trainingData.completed?.completed || nodeObj.formData?.completed || (trainingData.overallStatus === 'COMPLETED' ? 'YES' : 'NO'),
            schools: canonicalSchools,
            projectSchools: canonicalSchools
          };
        }
      } else if (node.key === 'ORDER_REQUIREMENT') {
        const ProjectSchools = require('../project-schools/project-schools.model');
        const psDoc = await ProjectSchools.findOne({ project: pId }).lean().catch(() => null);
        const orderReqFromDb = psDoc?.orderRequirement || reqDoc?.orderRequirement || {};
        nodeObj.formData = {
          orderRequirement: orderReqFromDb,
          solutionsSelected: orderReqFromDb.solutionsSelected || [],
          overallHardwareBOM: orderReqFromDb.overallHardwareBOM || {},
          totalSchoolsEnrolled: orderReqFromDb.totalSchoolsEnrolled || 1,
          remarks: orderReqFromDb.remarks || '',
          ...nodeObj.formData
        };
      } else if (node.key === 'HARDWARE_REQUIREMENT') {
        const ProjectSchools = require('../project-schools/project-schools.model');
        const Hardware = require('../hardware/hardware.model');
        const [psDoc, dbHardware] = await Promise.all([
          ProjectSchools.findOne({ project: pId }).lean().catch(() => null),
          Hardware.find({ isActive: true }).lean().catch(() => [])
        ]);
        const bom = psDoc?.orderRequirement?.overallHardwareBOM || {};
        const selectedHw = Object.keys(bom).length > 0
          ? Object.keys(bom)
          : (Array.isArray(nodeObj.formData.selectedHardware)
            ? nodeObj.formData.selectedHardware
            : (Array.isArray(nodeObj.formData.activeHardwareKeys) ? nodeObj.formData.activeHardwareKeys : []));

        if (selectedHw.length > 0 && dbHardware.length > 0) {
          const hwItemsMap = {};
          selectedHw.forEach(hwKey => {
            const dbHw = dbHardware.find(h => h.key === hwKey || h.key?.toUpperCase() === hwKey?.toUpperCase());
            const qty = bom[hwKey] !== undefined ? bom[hwKey] : (projDoc?.numberOfSchools || 1);
            hwItemsMap[hwKey] = {
              itemKey: hwKey,
              key: hwKey,
              itemName: dbHw?.name || dbHw?.label || hwKey.replace(/_/g, ' '),
              name: dbHw?.name || dbHw?.label || hwKey.replace(/_/g, ' '),
              quantity: qty,
              qty: qty,
              specNotes: nodeObj.formData.hardwareNotes || dbHw?.description || '',
              category: dbHw?.departmentCode || 'Hardware',
              unit: dbHw?.unit || 'NOS'
            };
          });
          nodeObj.formData = {
            ...nodeObj.formData,
            items: hwItemsMap,
            hardwareRequirements: {
              ...(nodeObj.formData.hardwareRequirements || {}),
              items: hwItemsMap
            },
            itemsList: Object.values(hwItemsMap),
            overallHardwareBOM: bom,
            selectedHardware: selectedHw
          };
        }
      } else if (node.key === 'SOLUTION_SELECTION') {
        const ProjectSchools = require('../project-schools/project-schools.model');
        const Solution = require('../solutions/solution.model');
        const [psDoc, dbSolutions] = await Promise.all([
          ProjectSchools.findOne({ project: pId }).lean().catch(() => null),
          Solution.find({ isActive: true }).lean().catch(() => [])
        ]);
        const dbSolsSelected = psDoc?.orderRequirement?.solutionsSelected || [];
        const selectedSol = dbSolsSelected.length > 0
          ? dbSolsSelected.map(s => s.solutionKey)
          : (Array.isArray(nodeObj.formData.selectedSolutions)
            ? nodeObj.formData.selectedSolutions
            : (Array.isArray(nodeObj.formData.activeSolutionKeys) ? nodeObj.formData.activeSolutionKeys : []));

        if (selectedSol.length > 0 && dbSolutions.length > 0) {
          const solItemsMap = {};
          selectedSol.forEach(solKey => {
            const dbSol = dbSolutions.find(s => s.key === solKey || s.key?.toUpperCase() === solKey?.toUpperCase());
            const seededSol = dbSolsSelected.find(s => s.solutionKey === solKey);
            const solName = seededSol?.solutionName || dbSol?.name || dbSol?.label || solKey.replace(/_/g, ' ');
            solItemsMap[solKey] = {
              solutionKey: solKey,
              key: solKey,
              solutionName: solName,
              name: solName,
              quantity: (projDoc?.numberOfSchools || 1),
              notes: nodeObj.formData.solutionNotes || dbSol?.description || ''
            };
          });
          nodeObj.formData = {
            ...nodeObj.formData,
            solutions: solItemsMap,
            solutionsList: Object.values(solItemsMap),
            selectedSolutions: selectedSol,
            solutionsSelected: dbSolsSelected
          };
        }
      } else if (node.key === 'CONTENT_CONFIGURATION') {
        const reqContent = reqDoc?.orderRequirement?.contentConfiguration || {};
        nodeObj.formData = {
          curriculumBoard: nodeObj.formData.curriculumBoard || reqContent.curriculumBoard || 'CBSE & State Board Integrated',
          gradesConfigured: nodeObj.formData.gradesConfigured || reqContent.gradesConfigured || 'Grades 6 to 12',
          subjectsConfigured: nodeObj.formData.subjectsConfigured || reqContent.subjectsConfigured || 'Mathematics, Science, English, Computer Science & AI',
          configuredBy: nodeObj.formData.configuredBy || reqContent.configuredBy || 'Kavita Rao',
          remarks: nodeObj.formData.remarks || reqContent.remarks || 'Full animated lessons and interactive simulations indexed.',
          languages: nodeObj.formData.languages || reqContent.languages || ['English', 'Hindi'],
          ...reqContent,
          ...nodeObj.formData
        };
      }
    } catch (fillErr) {
      console.warn('Auto-fill formData warning:', fillErr.message);
    }

    // Attach children populated with assignedTo
    const children = await TimelineNode.find({ timeline: timeline._id, parentNode: node._id })
      .populate('assignedTo', 'name email employeeCode')
      .sort({ order: 1 });

    const DISABLED_KEYS = new Set([
      'ADDRESS_CONFIRMATION',
      'DELIVERY_AND_TRACKING',
      'TECHNICAL_SETUP',
      'IMPLEMENTATION_AND_CONFIG',
      'TECH_INTERNAL_TESTING',
      'TECH_READY',
      'CONTENT_PREPARATION',
      'CONTENT_CONFIG',
      'ISSUE_RESOLUTION',
      'TESTING_COMPLETED'
    ]);

    nodeObj.children = children
      .filter(c => !DISABLED_KEYS.has(c.key))
      .map(c => {
        const cObj = c.toObject();
        if (schemaMap[c.key]) cObj.formSchema = schemaMap[c.key];
        return cObj;
      });

    return nodeObj;
  }

  async getChildren(projectId, nodeId) {
    const project = await this._findProject(projectId);
    const pId = project ? project._id : projectId;
    const timeline = await Timeline.findOne({ project: pId });
    if (!timeline) throw new AppError('Timeline not found.', 404, 'TIMELINE_NOT_FOUND');

    return await TimelineNode.find({ timeline: timeline._id, parentNode: nodeId })
      .populate('assignedTo', 'name email employeeCode')
      .sort({ order: 1 });
  }

  async assignNode(projectId, nodeId, employeeId, actorId) {
    const project = await this._findProject(projectId);
    const pId = project ? project._id : projectId;

    const node = await TimelineNode.findById(nodeId);
    if (!node) throw new AppError('Timeline node not found.', 404, 'NODE_NOT_FOUND');
    node.assignedTo = employeeId || null;

    // Automatically transition to IN_PROGRESS when a contributor is assigned to a pending/unstarted task
    if (employeeId && (node.status === NODE_STATUSES.PENDING || node.status === 'NOT_STARTED')) {
      node.status = NODE_STATUSES.IN_PROGRESS;
    }
    await node.save();

    // Recalculate parent stage status so the stage accurately reflects IN_PROGRESS
    if (node.parentNode) {
      await this.recalculateStageStatus(node.parentNode);
    }

    await Activity.create({
      project: pId,
      actor: actorId,
      action: 'CONTRIBUTOR_ASSIGNED',
      resourceType: 'TimelineNode',
      resourceId: node._id,
      metadata: { nodeId, employeeId }
    });

    // Create Notification for the assigned user
    if (employeeId) {
      try {
        const title = `Task Assigned: ${node.name}`;
        const message = `You have been assigned to "${node.name}" in project ${project ? project.projectId : ''} (${project ? (project.projectName || project.title) : ''}).`;

        await Notification.create({
          recipient: employeeId,
          project: pId,
          title,
          message,
          type: 'TASK_ASSIGNED',
          metadata: {
            nodeId: node._id,
            nodeName: node.name,
            nodeKey: node.key,
            projectId: project ? project.projectId : undefined,
            projectName: project ? (project.projectName || project.title) : undefined
          }
        });
      } catch (notifErr) {
        console.error('Notification creation failed:', notifErr);
      }
    }

    return await this.getNodeById(pId, nodeId);
  }

  async updateNodeStatus(projectId, nodeId, newStatus, comment, employee, projectMembership) {
    const project = await this._findProject(projectId);
    const pId = project ? project._id : projectId;
    const node = await this.getNodeDoc(pId, nodeId);

    // Authorization checks for contributor vs PM/Admin
    if (employee.globalRole !== GLOBAL_ROLES.ADMIN && projectMembership.designation === DESIGNATIONS.CONTRIBUTOR) {
      if (!node.assignedTo || node.assignedTo._id.toString() !== employee._id.toString()) {
        throw new AppError('You are only permitted to update status for nodes assigned to you.', 403, 'NOT_ASSIGNED_NODE');
      }
    } else if (projectMembership && projectMembership.designation === DESIGNATIONS.VIEWER) {
      throw new AppError('Viewers cannot update node statuses.', 403, 'VIEWER_FORBIDDEN');
    }

    // Check Dependency Gate: Stage 04 (EXECUTION and its sub-streams/tasks require Stage 03 ORDER_REQUIREMENT to be COMPLETED)
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
    if (execKeys.includes(node.key) && (newStatus === NODE_STATUSES.IN_PROGRESS || newStatus === NODE_STATUSES.COMPLETED)) {
      const timeline = await Timeline.findOne({ project: pId });
      if (timeline) {
        const orderReq = await TimelineNode.findOne({ timeline: timeline._id, key: 'ORDER_REQUIREMENT' });
        if (orderReq && orderReq.status !== NODE_STATUSES.COMPLETED) {
          throw new AppError('Order Requirement stage (Stage 03) must be completed before Execution phase (Stage 04) can start.', 422, 'ORDER_REQUIREMENT_NOT_COMPLETED');
        }
      }
    }

    // Check Dependency Gate for Stage 05 (TECH + CONTENT TESTING requires Tech Testing/Ready & Content Ready)
    if (node.key === 'TESTING_PREPARATION' && newStatus === NODE_STATUSES.IN_PROGRESS) {
      const timeline = await Timeline.findOne({ project: pId });
      const techReady = await TimelineNode.findOne({ timeline: timeline._id, key: { $in: ['TECH_TESTING', 'TECH_READY'] } });
      const contentReady = await TimelineNode.findOne({ timeline: timeline._id, key: 'CONTENT_READY' });

      if ((techReady && techReady.status !== NODE_STATUSES.COMPLETED) || (contentReady && contentReady.status !== NODE_STATUSES.COMPLETED)) {
        throw new AppError('Dependency Gate Failure: Both Tech Testing and Content Ready must be COMPLETED before testing can start.', 422, 'DEPENDENCY_GATE_FAILED');
      }
    }

    const previousStatus = node.status;
    node.status = newStatus;
    await node.save();

    // Propagate status recalculation up the hierarchy recursively
    if (node.parentNode) {
      await this.recalculateStageStatus(node.parentNode);
    }

    await Activity.create({
      project: pId,
      actor: employee._id,
      action: 'STATUS_CHANGED',
      resourceType: 'TimelineNode',
      resourceId: node._id,
      metadata: { previousStatus, newStatus, comment }
    });

    // Notify Project Manager, Admins, and Assignee of status changes
    try {
      const notificationService = require('../notifications/notifications.service');
      const readableStatus = newStatus.replace(/_/g, ' ');
      const statusTitle = `Stage Updated: ${node.name} (${readableStatus})`;
      const statusMessage = `${employee.name || 'Team member'} updated "${node.name}" status to "${readableStatus}" in project ${project?.projectId || ''} (${project?.projectName || project?.title || ''}).`;

      await notificationService.notifyWithAdminsAndPMs({
        assignedTo: node.assignedTo,
        projectId: pId,
        title: statusTitle,
        message: statusMessage,
        type: 'STAGE_UPDATED',
        metadata: {
          nodeId: node._id,
          nodeKey: node.key,
          previousStatus,
          newStatus,
          updatedBy: employee._id
        },
        excludeUserIds: [employee._id]
      });
    } catch (notifErr) {
      console.error('Status change notification error:', notifErr.message);
    }

    return await this.getNodeById(pId, nodeId);
  }

  async updateNodeForm(projectId, nodeId, formData, employee, projectMembership) {
    const node = await this.getNodeDoc(projectId, nodeId);

    if (employee.globalRole !== GLOBAL_ROLES.ADMIN && projectMembership && projectMembership.designation === DESIGNATIONS.CONTRIBUTOR) {
      if (!node.assignedTo || node.assignedTo._id.toString() !== employee._id.toString()) {
        throw new AppError('You can only update forms for nodes assigned to you.', 403, 'NOT_ASSIGNED_NODE');
      }
    } else if (employee.globalRole !== GLOBAL_ROLES.ADMIN && projectMembership && projectMembership.designation === DESIGNATIONS.VIEWER) {
      throw new AppError('Viewers cannot update forms.', 403, 'VIEWER_FORBIDDEN');
    }

    // Check Dependency Gate for Form Update: Stage 04 Execution tasks require Stage 03 Order Requirement to be completed
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
    if (execKeys.includes(node.key)) {
      const timeline = await Timeline.findOne({ project: projectId });
      if (timeline) {
        const orderReq = await TimelineNode.findOne({ timeline: timeline._id, key: 'ORDER_REQUIREMENT' });
        if (orderReq && orderReq.status !== NODE_STATUSES.COMPLETED) {
          throw new AppError('Order Requirement stage (Stage 03) must be completed before Execution tasks can be updated.', 422, 'ORDER_REQUIREMENT_NOT_COMPLETED');
        }
      }
    }

    node.formData = { ...(node.formData || {}), ...formData };
    node.markModified('formData');
    await node.save();

    // Also sync to Requirements collection
    try {
      const Requirements = require('../requirements/requirements.model');
      let reqDoc = await Requirements.findOne({ project: projectId });
      if (!reqDoc) {
        reqDoc = await Requirements.create({ project: projectId });
      }

      const key = node.key.toUpperCase();
      if (key === 'PROJECT_CREATED' || key === 'LEAD_CREATION' || key === 'PROJECT_REVIEWER') {
        reqDoc.projectReviewer = {
          ...(reqDoc.projectReviewer || {}),
          projectCreated: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
        };
        reqDoc.markModified('projectReviewer');

        // Automatically complete or put on hold based on PM review YES / NO
        if (formData.confirmed === 'YES' || formData.pmReviewStatus === 'APPROVED' || formData.projectReviewed === 'YES' || formData.projectCreated === 'YES' || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        } else if (formData.confirmed === 'NO' || formData.pmReviewStatus === 'REJECTED' || formData.projectReviewed === 'NO' || formData.projectCreated === 'NO') {
          node.status = NODE_STATUSES.ON_HOLD;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }
      } else if (key === 'PO_UPLOAD') {
        let rawPOs = [];
        if (Array.isArray(formData.purchaseOrders)) {
          rawPOs = formData.purchaseOrders;
        } else if (formData.purchaseOrders && typeof formData.purchaseOrders === 'object') {
          rawPOs = Object.values(formData.purchaseOrders);
        } else if (formData.poNumber || formData.poDocumentUrl) {
          rawPOs = [formData];
        }

        const purchaseOrders = rawPOs.map(po => ({
          ...po,
          uploadDate: po.uploadDate || po.submittedAt || new Date(),
          submittedBy: po.submittedBy || employee._id,
          submittedAt: po.submittedAt || new Date()
        }));

        reqDoc.poAndPi = {
          ...(reqDoc.poAndPi || {}),
          purchaseOrders: purchaseOrders.length > 0 ? purchaseOrders : ((reqDoc.poAndPi && reqDoc.poAndPi.purchaseOrders) || []),
          poUpload: { ...formData, uploadDate: formData.uploadDate || new Date(), submittedBy: employee._id, submittedAt: new Date() }
        };
        reqDoc.markModified('poAndPi');

        if (purchaseOrders.some(p => p.poNumber || p.poDocumentUrl) || formData.poNumber || formData.poDocumentUrl || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }
      } else if (key === 'PI_REQUEST') {
        reqDoc.poAndPi = {
          ...(reqDoc.poAndPi || {}),
          piRequest: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
        };
        reqDoc.markModified('poAndPi');

        if (formData.requestedDate || formData.expectedPIDate || formData.requestRemarks || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }
      } else if (key === 'PI_UPLOAD' || key === 'PI_AND_TAX_INVOICE_UPLOAD') {
        let rawPIs = [];
        if (Array.isArray(formData.proformaInvoices)) {
          rawPIs = formData.proformaInvoices;
        } else if (formData.proformaInvoices && typeof formData.proformaInvoices === 'object') {
          rawPIs = Object.values(formData.proformaInvoices);
        } else if (formData.piNumber || formData.piDocumentUrl) {
          rawPIs = [formData];
        }

        const proformaInvoices = rawPIs.map(pi => ({
          ...pi,
          ewayBillNumber: pi.ewayBillNumber || '',
          paymentStatus: pi.paymentStatus || 'PENDING',
          uploadDate: pi.uploadDate || pi.piUploadDate || pi.submittedAt || new Date(),
          submittedBy: pi.submittedBy || employee._id,
          submittedAt: pi.submittedAt || new Date()
        }));

        let rawTIs = [];
        if (Array.isArray(formData.taxInvoices)) {
          rawTIs = formData.taxInvoices;
        } else if (formData.taxInvoices && typeof formData.taxInvoices === 'object') {
          rawTIs = Object.values(formData.taxInvoices);
        } else if (formData.invoiceNumber || formData.invoiceDocumentUrl) {
          rawTIs = [formData];
        }

        const taxInvoices = rawTIs.map(ti => ({
          ...ti,
          ewayBillNumber: ti.ewayBillNumber || formData.ewayBillNumber || '',
          paymentStatus: ti.paymentStatus || formData.paymentStatus || 'PENDING',
          uploadDate: ti.uploadDate || ti.invoiceUploadDate || ti.submittedAt || new Date(),
          submittedBy: ti.submittedBy || employee._id,
          submittedAt: ti.submittedAt || new Date()
        }));

        reqDoc.poAndPi = {
          ...(reqDoc.poAndPi || {}),
          proformaInvoices: proformaInvoices.length > 0 ? proformaInvoices : ((reqDoc.poAndPi && reqDoc.poAndPi.proformaInvoices) || []),
          taxInvoices: taxInvoices.length > 0 ? taxInvoices : ((reqDoc.poAndPi && reqDoc.poAndPi.taxInvoices) || []),
          piUpload: {
            ...formData,
            uploadDate: formData.uploadDate || new Date(),
            piUploadDate: formData.piUploadDate || formData.uploadDate || new Date(),
            invoiceUploadDate: formData.invoiceUploadDate || formData.uploadDate || new Date(),
            ewayBillNumber: formData.ewayBillNumber || (taxInvoices[0] && taxInvoices[0].ewayBillNumber) || '',
            paymentStatus: formData.paymentStatus || (taxInvoices[0] && taxInvoices[0].paymentStatus) || 'PENDING',
            submittedBy: employee._id,
            submittedAt: new Date()
          }
        };
        reqDoc.markModified('poAndPi');

        if (proformaInvoices.some(p => p.piNumber || p.piDocumentUrl) || taxInvoices.some(t => t.invoiceNumber || t.invoiceDocumentUrl) || formData.piNumber || formData.invoiceNumber || formData.piDocumentUrl || formData.invoiceDocumentUrl || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }
      } else if (key === 'SCHOOL_ONBOARDING_INFORMATION') {
        const schoolsArr = Array.isArray(formData.schools) ? formData.schools : (formData.schoolName ? [{ schoolName: formData.schoolName, address: formData.address, totalStudents: formData.totalStudents }] : []);
        reqDoc.orderRequirement = {
          ...(reqDoc.orderRequirement || {}),
          schoolInformation: {
            ...formData,
            schools: schoolsArr.length > 0 ? schoolsArr : ((reqDoc.orderRequirement && reqDoc.orderRequirement.schoolInformation && reqDoc.orderRequirement.schoolInformation.schools) || []),
            submittedBy: employee._id,
            submittedAt: new Date()
          }
        };
        reqDoc.markModified('orderRequirement');

        // Sync into School Master collection
        if (schoolsArr.length > 0) {
          try {
            const School = require('../schools/school.model');
            const mongoose = require('mongoose');
            for (let idx = 0; idx < schoolsArr.length; idx++) {
              const s = schoolsArr[idx];
              const sName = s.schoolName || s.name || `School ${idx + 1}`;

              const filter = {
                projectId: projectId,
                $or: [
                  ...(s.id && mongoose.Types.ObjectId.isValid(s.id) ? [{ _id: s.id }] : []),
                  ...(s._id && mongoose.Types.ObjectId.isValid(s._id) ? [{ _id: s._id }] : []),
                  { name: sName }
                ]
              };

              await School.findOneAndUpdate(
                filter,
                {
                  $set: {
                    name: sName,
                    address: s.address || s.addressContact || '',
                    contactPerson: {
                      name: s.principalName || s.pocName || '',
                      phone: s.principalDetails || s.pocContact || s.phone || '',
                      email: s.email || '',
                      designation: s.pocDesignation || 'Principal'
                    },
                    survey: {
                      schoolCategory: Array.isArray(s.schoolCategory) ? s.schoolCategory : [s.schoolCategory].filter(Boolean),
                      classes: s.classes || [],
                      streams: s.streams || [],
                      principalName: s.principalName || '',
                      principalDetails: s.principalDetails || '',
                      pocName: s.pocName || '',
                      pocDesignation: s.pocDesignation || '',
                      pocContact: s.pocContact || '',
                      totalTeachers: Number(s.totalTeachers) || 0,
                      subjectWiseTeachers: s.subjectWiseTeachers || '',
                      classWiseSubjects: s.classWiseSubjects || '',
                      triSystemType: s.triSystemType || '',
                      totalStudents: Number(s.totalStudents) || 0,
                      regularStudentsRatio: s.regularStudentsRatio || '',
                      studentCommittee: s.studentCommittee || '',
                      villagesCount: s.villagesCount || '',
                      parentsOccupation: s.parentsOccupation || '',
                      studentAttendance: s.studentAttendance || '',
                      overallResult: s.overallResult || '',
                      totalClassrooms: Number(s.totalClassrooms) || 0,
                      classroomCondition: Array.isArray(s.classroomCondition) ? s.classroomCondition : [s.classroomCondition].filter(Boolean),
                      additionalRooms: s.additionalRooms || '',
                      spareRooms: s.spareRooms || '',
                      electricityInternetAvailability: s.electricityInternetAvailability || '',
                      drinkingWaterAvailability: s.drinkingWaterAvailability || '',
                      washroomAvailability: s.washroomAvailability || '',
                      ictLabAvailable: s.ictLabAvailable || 'Yes',
                      ictSetupDate: s.ictSetupDate || '',
                      ictHardwareComponents: s.ictHardwareComponents || '',
                      digitalContentProvided: s.digitalContentProvided || '',
                      digitalContentClasses: s.digitalContentClasses || '',
                      ictLabFunctional: s.ictLabFunctional || 'Yes',
                      ictWeeklyUsage: s.ictWeeklyUsage || '',
                      ictStudentCount: s.ictStudentCount || '',
                      computerTeacherAvailable: s.computerTeacherAvailable || 'Yes',
                      internetFacilityType: s.internetFacilityType || '',
                      libraryCornerAvailable: s.libraryCornerAvailable || 'Yes',
                      govtBooksCount: s.govtBooksCount || '',
                      fullTimeLibrarian: s.fullTimeLibrarian || 'Yes',
                      newspaperSubscription: s.newspaperSubscription || '',
                      additionalNotes: s.additionalNotes || '',
                      otherStakeholders: s.otherStakeholders || '',
                      supportingOrgName: s.supportingOrgName || '',
                      supportingOrgContactPerson: s.supportingOrgContactPerson || '',
                      supportingOrgDesignation: s.supportingOrgDesignation || '',
                      supportingOrgContact: s.supportingOrgContact || '',
                      supportingOrgEmail: s.supportingOrgEmail || '',
                      smartClassRoomIdentification: s.smartClassRoomIdentification || '',
                      smartClassRoomCondition: s.smartClassRoomCondition || '',
                      photoFrontView: s.photoFrontView || '',
                      photoSmartRoom: s.photoSmartRoom || '',
                      parentIncomeGroup: Array.isArray(s.parentIncomeGroup) ? s.parentIncomeGroup : [s.parentIncomeGroup].filter(Boolean),
                      parentProfessions: Array.isArray(s.parentProfessions) ? s.parentProfessions : [s.parentProfessions].filter(Boolean),
                      parentProfessionOther: s.parentProfessionOther || '',
                      parentEducationLevel: Array.isArray(s.parentEducationLevel) ? s.parentEducationLevel : [s.parentEducationLevel].filter(Boolean),
                      firstGenerationLearner: s.firstGenerationLearner || 'No',
                      securityGuard: s.securityGuard || '',
                      ictSecurityMeasures: s.ictSecurityMeasures || '',
                      deviceStorage: s.deviceStorage || '',
                      lostDeviceProtocol: s.lostDeviceProtocol || '',
                      dataBackupPlan: s.dataBackupPlan || '',
                      responsibleUseTraining: s.responsibleUseTraining || '',
                      usageTrackingMechanism: s.usageTrackingMechanism || '',
                      cybersecurityPolicies: s.cybersecurityPolicies || '',
                      breachHistory: s.breachHistory || 'Nil',
                      digitoppersSecurityCooperation: s.digitoppersSecurityCooperation || '',
                      safetyHazardsMitigation: s.safetyHazardsMitigation || ''
                    }
                  },
                  $setOnInsert: {
                    projectId: projectId,
                    installation: { status: 'PENDING' },
                    training: { status: 'PENDING' }
                  }
                },
                { upsert: true, new: true }
              );
            }
          } catch (schSyncErr) {
            console.warn('School sync warning on onboarding info save:', schSyncErr.message);
          }
        }

        if (formData.schoolName || schoolsArr.length > 0 || formData.address || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }
      } else if (key === 'SOLUTION_SELECTION') {
        const schoolWiseSolutions = formData.schoolWiseSolutions || {};
        const derivedSolutionKeys = Array.from(
          new Set([
            ...(Array.isArray(formData.activeSolutionKeys) ? formData.activeSolutionKeys : []),
            ...Object.values(schoolWiseSolutions).flatMap(sMap => (sMap && typeof sMap === 'object' ? Object.keys(sMap) : []))
          ])
        );

        reqDoc.orderRequirement = {
          ...(reqDoc.orderRequirement || {}),
          solutionSelection: {
            ...formData,
            activeSolutionKeys: derivedSolutionKeys,
            schoolWiseSolutions,
            solutions: formData.solutions || {},
            submittedBy: employee._id,
            submittedAt: new Date()
          }
        };
        reqDoc.markModified('orderRequirement');

        if (derivedSolutionKeys.length > 0 || (formData.schoolWiseSolutions && Object.keys(formData.schoolWiseSolutions).length > 0) || (formData.solutions && Object.keys(formData.solutions).length > 0) || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }

        // Auto-assign Tech & Content Leads if selected by PM
        try {
          const project = await this._findProject(projectId);

          // 1. Tech Lead Assignment
          if (formData.assignedTechLead) {
            const techNodes = await TimelineNode.find({
              timeline: node.timeline,
              key: { $in: ['TECH_STREAM', 'PROJECT_CONFIG_AND_IMPLEMENTATION', 'TECH_TESTING'] }
            });
            for (const tn of techNodes) {
              tn.assignedTo = formData.assignedTechLead;
              await tn.save();
            }

            await Notification.create({
              recipient: formData.assignedTechLead,
              project: projectId,
              title: `Tech Lead Assigned: Project Configuration & Testing`,
              message: `You have been assigned as Tech Lead for project ${project ? project.projectId : ''} (${project ? (project.projectName || project.title) : ''}). Please proceed with app configuration and testing.`,
              type: 'ASSIGNMENT',
              metadata: {
                projectId: projectId.toString(),
                projectCustomId: project?.projectId,
                projectName: project?.projectName || project?.title,
                nodeKey: 'PROJECT_CONFIG_AND_IMPLEMENTATION',
                targetUrl: `/tracker`
              }
            });
          }

          // 2. Content Lead Assignment
          if (formData.assignedContentLead) {
            const contentNodes = await TimelineNode.find({
              timeline: node.timeline,
              key: { $in: ['CONTENT_STREAM', 'CONTENT_CONFIGURATION', 'CONTENT_REVIEW_QA', 'SHEET_READINESS', 'DUMP_READINESS', 'CONTENT_READY'] }
            });
            for (const cn of contentNodes) {
              cn.assignedTo = formData.assignedContentLead;
              await cn.save();
            }

            await Notification.create({
              recipient: formData.assignedContentLead,
              project: projectId,
              title: `Content Lead Assigned: Curriculum Configuration & Readiness`,
              message: `You have been assigned as Content Lead for project ${project ? project.projectId : ''} (${project ? (project.projectName || project.title) : ''}). Please configure boards, languages, classes and verification sheets.`,
              type: 'ASSIGNMENT',
              metadata: {
                projectId: projectId.toString(),
                projectCustomId: project?.projectId,
                projectName: project?.projectName || project?.title,
                nodeKey: 'CONTENT_CONFIGURATION',
                targetUrl: `/tracker`
              }
            });
          }
        } catch (leadAssignErr) {
          console.error('Tech/Content lead assignment error:', leadAssignErr.message);
        }
      } else if (key === 'HARDWARE_REQUIREMENT') {
        const schoolWiseHardware = formData.schoolWiseHardware || {};
        const derivedHardwareKeys = Array.from(
          new Set([
            ...(Array.isArray(formData.activeHardwareKeys) ? formData.activeHardwareKeys : []),
            ...Object.values(schoolWiseHardware).flatMap(sMap => (sMap && typeof sMap === 'object' ? Object.keys(sMap) : []))
          ])
        );

        const { items: _unusedItems, hardware: _unusedHardware, ...cleanFormData } = formData || {};
        reqDoc.orderRequirement = {
          ...(reqDoc.orderRequirement || {}),
          hardwareRequirement: {
            ...cleanFormData,
            activeHardwareKeys: derivedHardwareKeys,
            schoolWiseHardware,
            submittedBy: employee._id,
            submittedAt: new Date()
          }
        };
        reqDoc.markModified('orderRequirement');

        if (derivedHardwareKeys.length > 0 || (formData.schoolWiseHardware && Object.keys(formData.schoolWiseHardware).length > 0) || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }

        // If Hardware Manager is assigned, auto-assign REQ_AND_STOCK_CHECK node & notify them
        try {
          const hwManagerId = formData.assignedHardwareManager || node.assignedTo;
          if (hwManagerId) {
            const project = await this._findProject(projectId);
            const stockCheckNode = await TimelineNode.findOne({
              timeline: node.timeline,
              key: 'REQ_AND_STOCK_CHECK'
            });

            if (stockCheckNode) {
              stockCheckNode.assignedTo = hwManagerId;
              await stockCheckNode.save();
            }

            await Notification.create({
              recipient: hwManagerId,
              project: projectId,
              title: `Hardware Lead Assigned: Equipment Review & Stock Check`,
              message: `You have been assigned as Hardware Lead for project ${project ? project.projectId : ''} (${project ? (project.projectName || project.title) : ''}). Please review equipment requirements and verify warehouse stock.`,
              type: 'ASSIGNMENT',
              metadata: {
                projectId: projectId.toString(),
                projectCustomId: project?.projectId,
                projectName: project?.projectName || project?.title,
                nodeKey: 'REQ_AND_STOCK_CHECK',
                targetUrl: `/tracker`
              }
            });
          }
        } catch (hwLeadErr) {
          console.error('Hardware lead assignment notification note:', hwLeadErr.message);
        }
      } else if (key === 'CONTENT_CONFIGURATION') {
        reqDoc.orderRequirement = {
          ...(reqDoc.orderRequirement || {}),
          contentConfiguration: {
            ...formData,
            submittedBy: employee._id,
            submittedAt: new Date()
          }
        };
        reqDoc.markModified('orderRequirement');
      } else if (key === 'REQ_AND_STOCK_CHECK') {
        reqDoc.execution = {
          ...(reqDoc.execution || {}),
          hardware: {
            ...((reqDoc.execution && reqDoc.execution.hardware) || {}),
            reqAndStockCheck: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
          }
        };
        reqDoc.markModified('execution');

        // Send notifications for individual in-stock dispatch and purchase procurement assignees
        try {
          const nonItemKeys = new Set(['checked', 'stockStatus', 'stockSummary', 'remarks', 'purchaseAssignedTo', 'inStockAssignedTo', 'submittedBy', 'submittedAt', 'status', '_id', 'id']);
          let itemsMap = stockData.items;
          if (!itemsMap && typeof stockData === 'object') {
            itemsMap = {};
            for (const [k, v] of Object.entries(stockData)) {
              if (!nonItemKeys.has(k) && typeof v === 'object' && v !== null && !Array.isArray(v)) {
                itemsMap[k] = v;
              }
            }
          }
          itemsMap = itemsMap || {};
          const project = await this._findProject(projectId);
          let primaryPurchaseOfficer = formData.purchaseAssignedTo;

          for (const [itemKey, itemVal] of Object.entries(itemsMap)) {
            if (itemVal && itemVal.selected !== false) {
              const itemTitle = itemVal.itemName || itemKey;
              const mode = itemVal.stockDecision || 'IN_STOCK';
              const inStockCount = Number(itemVal.inStockQty) !== undefined ? Number(itemVal.inStockQty) : (mode === 'IN_STOCK' ? (Number(itemVal.quantity) || 1) : 0);
              const purchaseCount = Number(itemVal.purchaseQty) !== undefined ? Number(itemVal.purchaseQty) : (mode === 'PURCHASE_REQUIRED' ? (Number(itemVal.quantity) || 1) : 0);

              if (Array.isArray(itemVal.splits) && itemVal.splits.length > 0) {
                // Multi-batch split notifications
                for (const [splitIdx, split] of itemVal.splits.entries()) {
                  const splitQty = Number(split.quantity) || 0;
                  const splitAssignee = split.assignedTo;
                  const splitMode = split.mode || 'IN_STOCK';
                  const batchLetter = String.fromCharCode(65 + splitIdx);

                  if (splitAssignee && splitQty > 0) {
                    if (splitMode === 'IN_STOCK') {
                      await Notification.create({
                        recipient: splitAssignee,
                        project: projectId,
                        title: `Hardware In-Stock Dispatch: ${itemTitle} (${splitQty} Units - Batch ${batchLetter})`,
                        message: `You have been assigned to dispatch ${splitQty} units of "${itemTitle}" (Batch ${batchLetter}) from warehouse stock for project ${project ? project.projectId : ''} (${project ? (project.projectName || project.title) : ''}).${split.notes ? ` Note: ${split.notes}` : ''}`,
                        type: 'ASSIGNMENT',
                        metadata: {
                          projectId: projectId.toString(),
                          projectCustomId: project?.projectId,
                          projectName: project?.projectName || project?.title,
                          nodeKey: 'REQ_AND_STOCK_CHECK',
                          targetUrl: `/tracker`
                        }
                      });
                    } else {
                      if (!primaryPurchaseOfficer) primaryPurchaseOfficer = splitAssignee;
                      await Notification.create({
                        recipient: splitAssignee,
                        project: projectId,
                        title: `Hardware Purchase Required: ${itemTitle} (${splitQty} Units - Batch ${batchLetter})`,
                        message: `You have been assigned to procure ${splitQty} units of "${itemTitle}" (Batch ${batchLetter}) from vendor for project ${project ? project.projectId : ''} (${project ? (project.projectName || project.title) : ''}).${split.notes ? ` Note: ${split.notes}` : ''}`,
                        type: 'ASSIGNMENT',
                        metadata: {
                          projectId: projectId.toString(),
                          projectCustomId: project?.projectId,
                          projectName: project?.projectName || project?.title,
                          nodeKey: 'PURCHASE_IF_NEEDED',
                          targetUrl: `/tracker`
                        }
                      });
                    }
                  }
                }
              } else {
                // Fallback for legacy single-item format
                const stockAssignee = itemVal.inStockAssignedTo || (mode === 'IN_STOCK' ? itemVal.assignedTo : null);
                if (stockAssignee && inStockCount > 0) {
                  await Notification.create({
                    recipient: stockAssignee,
                    project: projectId,
                    title: `Hardware In-Stock Dispatch: ${itemTitle} (${inStockCount} Units)`,
                    message: `You have been assigned to dispatch ${inStockCount} units of "${itemTitle}" from warehouse stock for project ${project ? project.projectId : ''} (${project ? (project.projectName || project.title) : ''}).`,
                    type: 'ASSIGNMENT',
                    metadata: {
                      projectId: projectId.toString(),
                      projectCustomId: project?.projectId,
                      projectName: project?.projectName || project?.title,
                      nodeKey: 'REQ_AND_STOCK_CHECK',
                      targetUrl: `/tracker`
                    }
                  });
                }

                const purchaseAssignee = itemVal.purchaseAssignedTo || (mode === 'PURCHASE_REQUIRED' ? itemVal.assignedTo : null);
                if (purchaseAssignee && purchaseCount > 0) {
                  if (!primaryPurchaseOfficer) primaryPurchaseOfficer = purchaseAssignee;
                  await Notification.create({
                    recipient: purchaseAssignee,
                    project: projectId,
                    title: `Hardware Purchase Required: ${itemTitle} (${purchaseCount} Units)`,
                    message: `You have been assigned to procure ${purchaseCount} units of "${itemTitle}" from vendor for project ${project ? project.projectId : ''} (${project ? (project.projectName || project.title) : ''}).`,
                    type: 'ASSIGNMENT',
                    metadata: {
                      projectId: projectId.toString(),
                      projectCustomId: project?.projectId,
                      projectName: project?.projectName || project?.title,
                      nodeKey: 'PURCHASE_IF_NEEDED',
                      targetUrl: `/tracker`
                    }
                  });
                }
              }
            }
          }

          // Auto-assign PURCHASE_IF_NEEDED node to procurement lead if any
          if (primaryPurchaseOfficer) {
            const purchaseNode = await TimelineNode.findOne({
              timeline: node.timeline,
              key: 'PURCHASE_IF_NEEDED'
            });

            if (purchaseNode) {
              purchaseNode.assignedTo = primaryPurchaseOfficer;
              await purchaseNode.save();
            }
          }
        } catch (stockCheckNotifErr) {
          console.error('Stock check assignment notification note:', stockCheckNotifErr.message);
        }
      } else if (key === 'PURCHASE_IF_NEEDED') {
        const existingProcurement = (reqDoc.execution && reqDoc.execution.hardware && reqDoc.execution.hardware.purchaseIfNeeded) || {};
        const incomingRawItems = formData?.items || (formData?.vendorName ? { legacyItem: formData } : formData) || {};
        const incomingItems = {};

        for (const [k, v] of Object.entries(incomingRawItems)) {
          if (!v || typeof v !== 'object') continue;
          let pos = [];
          if (Array.isArray(v.purchaseOrders)) {
            pos = v.purchaseOrders;
          } else if (v.purchaseOrders && typeof v.purchaseOrders === 'object') {
            pos = Object.values(v.purchaseOrders);
          } else if (v.poNumber || v.poDocumentUrl) {
            pos = [{
              poNumber: v.poNumber,
              poDate: v.poDate,
              poDocumentUrl: v.poDocumentUrl,
              remarks: v.poRemarks || v.remarks,
              submittedBy: employee._id,
              submittedAt: new Date()
            }];
          }

          let pis = [];
          if (Array.isArray(v.proformaInvoices)) {
            pis = v.proformaInvoices;
          } else if (v.proformaInvoices && typeof v.proformaInvoices === 'object') {
            pis = Object.values(v.proformaInvoices);
          } else if (v.piNumber || v.piDocumentUrl) {
            pis = [{
              piNumber: v.piNumber,
              piDate: v.piDate,
              piDocumentUrl: v.piDocumentUrl,
              ewayBillNumber: v.ewayBillNumber,
              paymentStatus: v.paymentStatus || 'PENDING',
              remarks: v.piRemarks || v.remarks,
              submittedBy: employee._id,
              submittedAt: new Date()
            }];
          }

          incomingItems[k] = {
            ...v,
            purchaseOrders: pos,
            proformaInvoices: pis,
            submittedBy: employee._id,
            submittedAt: new Date()
          };
        }

        reqDoc.execution = {
          ...(reqDoc.execution || {}),
          hardware: {
            ...((reqDoc.execution && reqDoc.execution.hardware) || {}),
            purchaseIfNeeded: {
              ...existingProcurement,
              ...(typeof formData === 'object' && formData !== null ? formData : {}),
              items: {
                ...(existingProcurement.items || {}),
                ...incomingItems
              },
              submittedBy: employee._id,
              submittedAt: new Date()
            }
          }
        };
        reqDoc.markModified('execution');
      } else if (key === 'CONSIGNMENT_TRACKING') {
        const existingConsignment = (reqDoc.execution && reqDoc.execution.hardware && reqDoc.execution.hardware.consignmentTracking) || {};
        const incomingItems = formData?.items || (formData?.trackingNumber ? { legacyItem: formData } : formData) || {};
        reqDoc.execution = {
          ...(reqDoc.execution || {}),
          hardware: {
            ...((reqDoc.execution && reqDoc.execution.hardware) || {}),
            consignmentTracking: {
              ...existingConsignment,
              ...(typeof formData === 'object' && formData !== null ? formData : {}),
              items: {
                ...(existingConsignment.items || {}),
                ...(typeof incomingItems === 'object' ? incomingItems : {})
              },
              submittedBy: employee._id,
              submittedAt: new Date()
            }
          }
        };
        reqDoc.markModified('execution');
      } else if (key === 'HARDWARE_READY') {
        const existingReady = (reqDoc.execution && reqDoc.execution.hardware && reqDoc.execution.hardware.hardwareReady) || {};
        reqDoc.execution = {
          ...(reqDoc.execution || {}),
          hardware: {
            ...((reqDoc.execution && reqDoc.execution.hardware) || {}),
            hardwareReady: {
              ...existingReady,
              ...(typeof formData === 'object' ? formData : {}),
              submittedBy: employee._id,
              submittedAt: new Date()
            }
          }
        };
        reqDoc.markModified('execution');
        try {
          const project = await this._findProject(projectId);
          if (project) {
            this._syncSchoolWiseHardwareExecution(reqDoc, project);
          }
        } catch (syncErr) {
          console.error('Error syncing hardware ready:', syncErr);
        }
      } else if (key === 'INTEGRATION_TESTING') {
        // Feedback & notification iteration for App, Dashboard and Content Testing Results
        try {
          const project = await this._findProject(projectId);
          const results = formData.testingResults || formData;

          const streams = [
            { key: 'appTesting', label: 'App Testing Results', data: results.appTesting },
            { key: 'dashboardTesting', label: 'Dashboard Testing Results', data: results.dashboardTesting },
            { key: 'contentTesting', label: 'Content Testing Results', data: results.contentTesting }
          ];

          let anyNeedsImprovement = false;
          let allPassed = true;

          for (const s of streams) {
            const streamData = s.data || {};
            const streamStatus = (streamData.status || '').toUpperCase();
            const sheetUrl = streamData.sheetUrl || streamData.sheetLink || '';
            const remarks = streamData.remarks || '';
            const assigneeId = streamData.assignedTo;

            if (streamStatus === 'NEEDS_IMPROVEMENT' || streamStatus === 'FAILED') {
              anyNeedsImprovement = true;
              allPassed = false;

              if (assigneeId) {
                await Notification.create({
                  recipient: assigneeId,
                  project: projectId,
                  title: `Testing Feedback [Needs Improvement]: ${s.label}`,
                  message: `QA reported issues in "${s.label}" for project ${project?.projectId || ''} (${project?.projectName || project?.title || ''}). Feedback: "${remarks || 'Please review test sheet'}". Test Sheet: ${sheetUrl || 'N/A'}`,
                  type: 'ASSIGNMENT',
                  metadata: {
                    projectId: projectId.toString(),
                    projectCustomId: project?.projectId,
                    projectName: project?.projectName || project?.title,
                    nodeKey: 'INTEGRATION_TESTING',
                    streamKey: s.key,
                    targetUrl: `/tracker`
                  }
                });
              }
            } else if (streamStatus !== 'PASS' && streamStatus !== 'PASSED' && streamStatus !== 'COMPLETED') {
              allPassed = false;
            }
          }

          // If feedback needs improvement, ensure node status remains IN_PROGRESS so it iterates until done
          if (anyNeedsImprovement) {
            node.status = 'IN_PROGRESS';
            await node.save();
          } else if (allPassed && formData.overallTestResult === 'ALL_PASSED') {
            node.status = 'COMPLETED';
            await node.save();
          }
        } catch (notifErr) {
          console.error('Integration testing notification error:', notifErr.message);
        }
      } else if (key === 'SHEET_READINESS') {
        reqDoc.execution = {
          ...(reqDoc.execution || {}),
          content: {
            ...((reqDoc.execution && reqDoc.execution.content) || {}),
            sheetReadiness: {
              ...formData,
              submittedBy: employee._id,
              submittedAt: new Date()
            }
          }
        };
        reqDoc.markModified('execution');
      } else if (key === 'INSTALLATION_PLANNING') {
        reqDoc.installation = {
          ...(reqDoc.installation || {}),
          installationPlanning: {
            ...formData,
            submittedBy: employee._id,
            submittedAt: new Date()
          }
        };
        reqDoc.markModified('installation');

        try {
          const School = require('../schools/school.model');
          const plannedList = formData.plannedSchools || Object.values(formData.schoolWiseInstallationPlans || {});
          for (const item of plannedList) {
            const schId = item.schoolId || item.id;
            const engineerId = item.technicalPersonId || item.assignedEngineerId;
            const planDate = item.planOutDate || item.plannedInstallationDate || item.datePlannedForInstallation || formData.installationDate || formData.datePlannedForInstallation;
            const updateFields = {
              'installation.status': 'SCHEDULED'
            };
            if (engineerId) updateFields['installation.assignedEngineerId'] = engineerId;
            if (planDate) {
              updateFields['installation.scheduledDate'] = new Date(planDate);
              updateFields['installation.planOutDate'] = planDate;
            }
            if (item.contactNumber) {
              updateFields['installation.engineerContact'] = item.contactNumber;
            }
            if (schId) {
              await School.findByIdAndUpdate(schId, { $set: updateFields });
            }
          }
        } catch (schoolSyncErr) {
          console.warn('Could not sync school installation engineer:', schoolSyncErr.message);
        }
      } else if (key === 'INSTALLATION_EXECUTION') {
        reqDoc.installation = {
          ...(reqDoc.installation || {}),
          installationExecution: {
            ...formData,
            submittedBy: employee._id,
            submittedAt: new Date()
          }
        };
        reqDoc.markModified('installation');

        try {
          const School = require('../schools/school.model');
          const schoolInstallations = formData.schools || formData.schoolInstallations || [];
          for (const sItem of schoolInstallations) {
            const schId = sItem.schoolId || sItem._id || sItem.id;
            const photos = [sItem.image1Url, sItem.image2Url, sItem.image3Url].filter(Boolean);
            const updateFields = {
              'installation.status': 'IN_PROGRESS'
            };
            if (photos.length > 0) {
              updateFields['installation.completionPhotos'] = photos;
            }
            if (sItem.hardwareItems && sItem.hardwareItems.length > 0) {
              updateFields['hardware'] = sItem.hardwareItems;
            }
            if (schId) {
              await School.findByIdAndUpdate(schId, { $set: updateFields });
            }
          }
        } catch (execSyncErr) {
          console.warn('Could not sync school installation execution:', execSyncErr.message);
        }
      } else if (key === 'INSTALLATION_COMPLETED' || key === 'INSTALLATION') {
        reqDoc.installation = {
          ...(reqDoc.installation || {}),
          installationCompleted: {
            ...formData,
            submittedBy: employee._id,
            submittedAt: new Date()
          }
        };
        reqDoc.markModified('installation');

        if (formData.completed === 'YES') {
          try {
            const School = require('../schools/school.model');
            await School.updateMany(
              { projectId: project._id },
              { $set: { 'installation.status': 'COMPLETED' } }
            );
          } catch (e) {
            console.warn('Could not sync completed status to schools:', e.message);
          }
        }
      } else if (key === 'TRAINING_PLANNING') {
        // Explicitly remove training from reqDoc (Requirements collection)
        if (reqDoc.training) {
          delete reqDoc.training;
          reqDoc.markModified('training');
        }

        try {
          const ProjectSchools = require('../project-schools/project-schools.model');
          const School = require('../schools/school.model');

          let psDoc = await ProjectSchools.findOne({ project: projectId });
          if (!psDoc) {
            const projectObj = await this._findProject(projectId);
            psDoc = await ProjectSchools.create({
              project: projectId,
              projectId: projectObj?.projectId || String(projectId),
              projectName: projectObj?.projectName || projectObj?.title || 'Project',
              schools: []
            });
          }

          psDoc.training = psDoc.training || {};
          psDoc.training.planning = {
            ...formData,
            submittedBy: employee._id,
            submittedAt: new Date()
          };

          // Extract plannedList from any available structure
          let plannedList = [];
          if (Array.isArray(formData.plannedSchools) && formData.plannedSchools.length > 0) {
            plannedList = formData.plannedSchools;
          } else if (Array.isArray(formData.trainingPlanning) && formData.trainingPlanning.length > 0) {
            plannedList = formData.trainingPlanning;
          } else if (formData.trainingPlanning && Array.isArray(formData.trainingPlanning.plannedSchools)) {
            plannedList = formData.trainingPlanning.plannedSchools;
          } else if (formData.schoolWiseTrainingPlans && typeof formData.schoolWiseTrainingPlans === 'object') {
            plannedList = Object.values(formData.schoolWiseTrainingPlans);
          } else if (formData.schoolWiseInstallationPlans && typeof formData.schoolWiseInstallationPlans === 'object') {
            plannedList = Object.values(formData.schoolWiseInstallationPlans);
          } else if (Array.isArray(formData.schools) && formData.schools.length > 0) {
            plannedList = formData.schools;
          }

          const plansMap = { ...(psDoc.training.schoolWiseTrainingPlans || {}) };
          if (formData.schoolWiseTrainingPlans && typeof formData.schoolWiseTrainingPlans === 'object') {
            Object.assign(plansMap, formData.schoolWiseTrainingPlans);
          }

          for (const item of plannedList) {
            const rawSchId = item.schoolId || item.id || item._id;
            if (!rawSchId && !item.schoolName) continue;

            // Resolve real school record
            let schRecord = null;
            if (rawSchId) {
              schRecord = await School.findById(rawSchId).catch(() => null);
              if (!schRecord) {
                // Check if rawSchId was psDoc.schools subdoc id
                const matchedUnit = psDoc.schools.find(s => String(s._id) === String(rawSchId) || String(s.schoolId) === String(rawSchId));
                if (matchedUnit?.school) {
                  schRecord = await School.findById(matchedUnit.school).catch(() => null);
                }
              }
            }
            if (!schRecord && item.schoolName) {
              schRecord = await School.findOne({ projectId: projectId, name: item.schoolName }).catch(() => null);
            }

            const realSchId = schRecord?._id || rawSchId;
            const schName = schRecord?.name || item.schoolName || 'School';

            const trainerId = item.trainerId || item.assignedTrainerId || item.technicalPersonId || (item.trainers && item.trainers[0]?.trainerId);
            const trainerName = item.trainerName || item.technicalPersonName || (item.trainers && item.trainers[0]?.name) || '';
            const trainerPhone = item.trainerPhone || item.contactNumber || (item.trainers && item.trainers[0]?.phone) || '';
            const planOutDate = item.planOutDate || item.trainingDate || '';

            // Update School document if found
            if (schRecord) {
              const schoolUpdate = {
                'training.status': 'SCHEDULED',
                'training.assignedTrainerId': trainerId || null,
                'training.trainerName': trainerName || '',
                'training.trainerPhone': trainerPhone || ''
              };
              if (planOutDate) schoolUpdate['training.planOutDate'] = planOutDate;
              if (Array.isArray(item.trainers)) schoolUpdate['training.trainers'] = item.trainers;
              await School.findByIdAndUpdate(schRecord._id, { $set: schoolUpdate });
            }

            // Update ProjectSchools school deployment unit
            let schoolUnit = psDoc.schools.find(s =>
              String(s.school) === String(realSchId) ||
              String(s.schoolId) === String(realSchId) ||
              String(s._id) === String(rawSchId) ||
              (s.schoolName && s.schoolName.toLowerCase().trim() === schName.toLowerCase().trim())
            );

            if (!schoolUnit) {
              schoolUnit = {
                school: schRecord ? schRecord._id : realSchId,
                schoolId: schRecord ? String(schRecord._id) : String(realSchId),
                schoolName: schName,
                deploymentStatus: 'SURVEY_PENDING',
                training: {
                  status: 'SCHEDULED',
                  trainer: trainerId || null,
                  trainerName: trainerName || '',
                  trainerPhone: trainerPhone || '',
                  trainers: item.trainers || [],
                  planOutDate
                }
              };
              psDoc.schools.push(schoolUnit);
            } else {
              schoolUnit.training = schoolUnit.training || {};
              schoolUnit.training.status = 'SCHEDULED';
              schoolUnit.training.trainer = trainerId || null;
              schoolUnit.training.trainerName = trainerName || '';
              schoolUnit.training.trainerPhone = trainerPhone || '';
              if (planOutDate) schoolUnit.training.planOutDate = planOutDate;
              if (Array.isArray(item.trainers)) schoolUnit.training.trainers = item.trainers;
            }

            // Keep canonical map updated by real School ID
            const mapKey = String(schRecord?._id || realSchId);
            plansMap[mapKey] = {
              ...item,
              schoolId: mapKey,
              schoolName: schName,
              planOutDate,
              technicalPersonId: trainerId,
              technicalPersonName: trainerName,
              contactNumber: trainerPhone,
              trainers: item.trainers || schoolUnit.training.trainers || []
            };
          }

          psDoc.training.schoolWiseTrainingPlans = plansMap;
          psDoc.training.planning = {
            ...formData,
            schoolWiseTrainingPlans: plansMap,
            plannedSchools: Object.values(plansMap),
            submittedBy: employee._id,
            submittedAt: new Date()
          };

          psDoc.markModified('training');
          psDoc.markModified('schools');
          await psDoc.save();

          // Sync back to node.formData as well so timeline state stays in sync
          node.formData = {
            ...(node.formData || {}),
            ...formData,
            schoolWiseTrainingPlans: plansMap,
            plannedSchools: Object.values(plansMap),
            trainingPlanning: Object.values(plansMap)
          };
          node.markModified('formData');
          await node.save();

          // Also sync to new Training model
          try {
            const Training = require('../training/training.model');
            const projectObj = await this._findProject(projectId);
            let trainingDoc = await Training.findOne({ project: projectId });
            if (!trainingDoc) {
              trainingDoc = new Training({
                project: projectId,
                projectId: projectObj?.projectId || String(projectId),
                projectName: projectObj?.projectName || projectObj?.title || 'Project',
                schools: []
              });
            }
            trainingDoc.planning = {
              ...formData,
              submittedBy: employee._id,
              submittedAt: new Date()
            };
            trainingDoc.schoolWiseTrainingPlans = plansMap;
            trainingDoc.scheduledSchools = Object.keys(plansMap).length;
            trainingDoc.totalSchools = psDoc.schools?.length || Object.keys(plansMap).length;
            if (trainingDoc.overallStatus === 'NOT_STARTED') trainingDoc.overallStatus = 'SCHEDULED';
            trainingDoc.markModified('planning');
            trainingDoc.markModified('schoolWiseTrainingPlans');
            await trainingDoc.save().catch(() => null);
          } catch (tErr) {
            console.error('Error syncing to Training model:', tErr);
          }
        } catch (trErr) {
          console.error('Error saving training planning to ProjectSchools:', trErr);
        }
      } else if (key === 'TRAINING_EXECUTION') {
        // Explicitly remove training from reqDoc (Requirements collection)
        if (reqDoc.training) {
          delete reqDoc.training;
          reqDoc.markModified('training');
        }

        try {
          const ProjectSchools = require('../project-schools/project-schools.model');
          const School = require('../schools/school.model');

          let psDoc = await ProjectSchools.findOne({ project: projectId });
          if (!psDoc) {
            const projectObj = await this._findProject(projectId);
            psDoc = await ProjectSchools.create({
              project: projectId,
              projectId: projectObj?.projectId || String(projectId),
              projectName: projectObj?.projectName || projectObj?.title || 'Project',
              schools: []
            });
          }

          psDoc.training = psDoc.training || {};
          psDoc.training.execution = {
            ...formData,
            submittedBy: employee._id,
            submittedAt: new Date()
          };

          const execMap = formData.schoolWiseTrainingExecutions || formData.trainingExecutionSection || {};
          if (Object.keys(execMap).length > 0) {
            psDoc.training.schoolWiseTrainingExecutions = execMap;
          }

          const execEntries = Object.entries(execMap).length > 0
            ? Object.entries(execMap)
            : (formData.plannedSchools || formData.schools || []).map(s => [s.schoolId || s.id || s._id, s]);

          for (const [schId, sData] of execEntries) {
            if (!schId || typeof sData !== 'object') continue;
            const checklist = sData.checklist || {};
            const deliveryConfirmationSheetUrl = sData.deliveryConfirmationSheetUrl || formData.deliveryConfirmationSheetUrl || '';
            const appreciationLetterUrl = sData.appreciationLetterUrl || formData.appreciationLetterUrl || '';
            const workCompletionLetterUrl = sData.workCompletionLetterUrl || formData.workCompletionLetterUrl || '';
            const teachersDetailsDocUrl = sData.teachersDetailsDocUrl || sData.teachersDetailsUrl || formData.teachersDetailsDocUrl || formData.teachersDetailsUrl || '';
            const photographyPhotosUrl = sData.photographyPhotosUrl || formData.photographyPhotosUrl || '';
            const googleReviewsNotes = sData.googleReviewsNotes || formData.googleReviewsNotes || '';
            const issuesNoted = sData.issuesNoted || formData.issuesNoted || '';
            const onGroundFeedback = sData.onGroundFeedback || formData.onGroundFeedback || '';
            const remarks = sData.remarks || formData.remarks || '';
            const isCompleted = checklist.trainingDone && checklist.applicationWorking && checklist.teachersTraining && checklist.teachersIdCreated;
            const trStatus = isCompleted ? 'COMPLETED' : (sData.status || 'IN_PROGRESS');

            // 1. Sync to School collection
            await School.findByIdAndUpdate(schId, {
              $set: {
                'training.deliveryConfirmationSheetUrl': deliveryConfirmationSheetUrl,
                'training.appreciationLetterUrl': appreciationLetterUrl,
                'training.workCompletionLetterUrl': workCompletionLetterUrl,
                'training.teachersDetailsDocUrl': teachersDetailsDocUrl,
                'training.photographyPhotosUrl': photographyPhotosUrl,
                'training.googleReviewsNotes': googleReviewsNotes,
                'training.checklist': checklist,
                'training.status': trStatus,
                'training.issuesNoted': issuesNoted,
                'training.onGroundFeedback': onGroundFeedback,
                'training.remarks': remarks,
                'training.teachersTrainedCount': Number(sData.teachersAttended || sData.teachersTrainedCount || 0)
              }
            });

            // 2. Sync to psDoc.schools
            let schoolUnit = psDoc.schools.find(s => String(s.school) === String(schId) || String(s.schoolId) === String(schId) || String(s._id) === String(schId));
            if (!schoolUnit) {
              const schRecord = await School.findById(schId);
              if (schRecord) {
                schoolUnit = {
                  school: schRecord._id,
                  schoolId: String(schRecord._id),
                  schoolName: schRecord.name,
                  deploymentStatus: 'SURVEY_PENDING',
                  training: {
                    status: trStatus,
                    deliveryConfirmationSheetUrl,
                    appreciationLetterUrl,
                    workCompletionLetterUrl,
                    teachersDetailsDocUrl,
                    photographyPhotosUrl,
                    googleReviewsNotes,
                    checklist,
                    issuesNoted,
                    onGroundFeedback,
                    remarks
                  }
                };
                psDoc.schools.push(schoolUnit);
              }
            } else {
              schoolUnit.training = schoolUnit.training || {};
              schoolUnit.training.status = trStatus;
              schoolUnit.training.deliveryConfirmationSheetUrl = deliveryConfirmationSheetUrl;
              schoolUnit.training.appreciationLetterUrl = appreciationLetterUrl;
              schoolUnit.training.workCompletionLetterUrl = workCompletionLetterUrl;
              schoolUnit.training.teachersDetailsDocUrl = teachersDetailsDocUrl;
              schoolUnit.training.photographyPhotosUrl = photographyPhotosUrl;
              schoolUnit.training.googleReviewsNotes = googleReviewsNotes;
              schoolUnit.training.checklist = checklist;
              schoolUnit.training.issuesNoted = issuesNoted;
              schoolUnit.training.onGroundFeedback = onGroundFeedback;
              schoolUnit.training.remarks = remarks;
            }
          }

          psDoc.training.issuesNoted = formData.issuesNoted || '';
          psDoc.training.onGroundFeedback = formData.onGroundFeedback || '';
          psDoc.training.remarks = formData.remarks || '';
          psDoc.markModified('training');
          psDoc.markModified('schools');
          await psDoc.save();

          await this.syncSchoolProgressToTimeline(projectId);

          // Also sync to new Training model
          try {
            const Training = require('../training/training.model');
            const projectObj = await this._findProject(projectId);
            let trainingDoc = await Training.findOne({ project: projectId });
            if (!trainingDoc) {
              trainingDoc = new Training({
                project: projectId,
                projectId: projectObj?.projectId || String(projectId),
                projectName: projectObj?.projectName || projectObj?.title || 'Project',
                schools: []
              });
            }
            trainingDoc.execution = {
              ...formData,
              submittedBy: employee._id,
              submittedAt: new Date()
            };
            trainingDoc.schoolWiseTrainingExecutions = execMap;
            trainingDoc.issuesNoted = formData.issuesNoted || trainingDoc.issuesNoted || '';
            trainingDoc.onGroundFeedback = formData.onGroundFeedback || trainingDoc.onGroundFeedback || '';
            trainingDoc.remarks = formData.remarks || trainingDoc.remarks || '';
            trainingDoc.markModified('execution');
            trainingDoc.markModified('schoolWiseTrainingExecutions');
            await trainingDoc.save().catch(() => null);
          } catch (tErr) {
            console.error('Error syncing execution to Training model:', tErr);
          }
        } catch (trErr) {
          console.error('Error saving training execution to ProjectSchools:', trErr);
        }
      } else if (key === 'TRAINING_COMPLETED' || key === 'TRAINING') {
        // Explicitly remove training from reqDoc (Requirements collection)
        if (reqDoc.training) {
          delete reqDoc.training;
          reqDoc.markModified('training');
        }

        try {
          const ProjectSchools = require('../project-schools/project-schools.model');
          const School = require('../schools/school.model');

          let psDoc = await ProjectSchools.findOne({ project: projectId });
          if (!psDoc) {
            const projectObj = await this._findProject(projectId);
            psDoc = await ProjectSchools.create({
              project: projectId,
              projectId: projectObj?.projectId || String(projectId),
              projectName: projectObj?.projectName || projectObj?.title || 'Project',
              schools: []
            });
          }

          const completionMap =
            (formData.schoolWiseTrainingCompletion && typeof formData.schoolWiseTrainingCompletion === 'object' && !Array.isArray(formData.schoolWiseTrainingCompletion)
              ? formData.schoolWiseTrainingCompletion
              : null) ||
            (formData.trainingCompletedSection && typeof formData.trainingCompletedSection === 'object' && !Array.isArray(formData.trainingCompletedSection)
              ? formData.trainingCompletedSection
              : {}) ||
            {};

          psDoc.training = psDoc.training || {};
          psDoc.training.completed = { ...formData, submittedBy: employee._id, submittedAt: new Date() };
          psDoc.training.schoolWiseTrainingCompletion = completionMap;

          let allCompleted = true;
          let anyCompleted = false;

          for (const s of psDoc.schools) {
            const sId = String(s.school || s._id || s.id);
            const compItem =
              completionMap[sId] ||
              Object.values(completionMap).find(
                (p) =>
                  p.schoolId === sId ||
                  (p.schoolName && s.schoolName && p.schoolName.toLowerCase().trim() === s.schoolName.toLowerCase().trim())
              );

            s.training = s.training || {};
            if (compItem) {
              const isComp = compItem.completed === 'YES' || compItem.isCompleted === true;
              s.training.status = isComp ? 'COMPLETED' : 'IN_PROGRESS';
              if (compItem.remarks) s.training.remarks = compItem.remarks;
              if (isComp) {
                s.training.completedAt = s.training.completedAt || new Date();
                anyCompleted = true;
              } else {
                allCompleted = false;
              }

              // Update School model in School collection
              await School.findByIdAndUpdate(s.school || s._id, {
                $set: {
                  'training.status': isComp ? 'COMPLETED' : 'IN_PROGRESS',
                  'training.remarks': compItem.remarks || '',
                  ...(isComp ? { 'training.completedAt': new Date() } : {})
                }
              }).catch(() => null);
            } else if (s.training.status !== 'COMPLETED') {
              allCompleted = false;
            }
          }

          const isOverallYes = formData.completed === 'YES' || (psDoc.schools.length > 0 && allCompleted);
          psDoc.training.overallStatus = isOverallYes ? 'COMPLETED' : anyCompleted ? 'IN_PROGRESS' : 'IN_PROGRESS';

          psDoc.markModified('training');
          psDoc.markModified('schools');
          await psDoc.save();

          await this.syncSchoolProgressToTimeline(projectId);

          // Also sync to Training collection model
          try {
            const Training = require('../training/training.model');
            const projectObj = await this._findProject(projectId);
            let trainingDoc = await Training.findOne({ project: projectId });
            if (!trainingDoc) {
              trainingDoc = new Training({
                project: projectId,
                projectId: projectObj?.projectId || String(projectId),
                projectName: projectObj?.projectName || projectObj?.title || 'Project',
                schools: []
              });
            }

            trainingDoc.overallStatus = isOverallYes ? 'COMPLETED' : anyCompleted ? 'IN_PROGRESS' : 'IN_PROGRESS';
            trainingDoc.completedSchools = Object.values(completionMap).filter(
              (c) => c.completed === 'YES' || c.isCompleted === true
            ).length;
            trainingDoc.remarks = formData.remarks || trainingDoc.remarks || '';
            trainingDoc.schoolWiseTrainingCompletion = completionMap;

            // Update status on each trainingDoc.schools item
            if (Array.isArray(trainingDoc.schools)) {
              for (const ts of trainingDoc.schools) {
                const tsId = String(ts.school || ts._id || ts.schoolId);
                const cItem =
                  completionMap[tsId] ||
                  Object.values(completionMap).find((p) => p.schoolId === tsId);
                if (cItem) {
                  const isDone = cItem.completed === 'YES' || cItem.isCompleted === true;
                  ts.executionStatus = isDone ? 'COMPLETED' : 'IN_PROGRESS';
                  if (cItem.remarks) ts.remarks = cItem.remarks;
                  if (isDone) ts.completedDate = ts.completedDate || new Date();
                }
              }
            }

            trainingDoc.markModified('schools');
            trainingDoc.markModified('schoolWiseTrainingCompletion');
            await trainingDoc.save().catch(() => null);
          } catch (tErr) {
            console.error('Error syncing completion to Training model:', tErr);
          }
        } catch (trErr) {
          console.error('Error saving training completion to ProjectSchools:', trErr);
        }
      }

      // Sync school-wise hardware execution whenever hardware/execution nodes are updated
      const hwSyncKeys = new Set(['HARDWARE_REQUIREMENT', 'REQ_AND_STOCK_CHECK', 'PURCHASE_IF_NEEDED', 'CONSIGNMENT_TRACKING', 'HARDWARE_READY']);
      if (hwSyncKeys.has(key)) {
        const project = await this._findProject(projectId);
        this._syncSchoolWiseHardwareExecution(reqDoc, project);
      }

      await reqDoc.save();
    } catch (syncErr) {
      console.warn('Requirements sync note:', syncErr.message);
    }

    await Activity.create({
      project: projectId,
      actor: employee._id,
      action: 'FORM_UPDATED',
      resourceType: 'TimelineNode',
      resourceId: node._id,
      metadata: { nodeId, keys: Object.keys(formData) }
    });

    return await this.getNodeById(projectId, nodeId);
  }

  async recalculateStageStatus(parentNodeId) {
    if (!parentNodeId) return;
    const parentNode = await TimelineNode.findById(parentNodeId);
    if (!parentNode) return;

    const children = await TimelineNode.find({ parentNode: parentNode._id });
    if (children.length === 0) return;

    const allCompleted = children.every(c => c.status === NODE_STATUSES.COMPLETED);
    const anyInProgress = children.some(c => c.status === NODE_STATUSES.IN_PROGRESS || c.status === NODE_STATUSES.COMPLETED);
    const anyOnHold = children.some(c => c.status === NODE_STATUSES.ON_HOLD);

    let updatedStatus = parentNode.status;
    if (allCompleted) {
      updatedStatus = NODE_STATUSES.COMPLETED;
    } else if (anyInProgress) {
      updatedStatus = NODE_STATUSES.IN_PROGRESS;
    } else if (anyOnHold) {
      updatedStatus = NODE_STATUSES.ON_HOLD;
    } else {
      const allPending = children.every(c => c.status === NODE_STATUSES.PENDING);
      if (allPending) updatedStatus = NODE_STATUSES.PENDING;
    }

    if (parentNode.status !== updatedStatus) {
      parentNode.status = updatedStatus;
      await parentNode.save();
    }

    // Automatic Progression: When ORDER_REQUIREMENT completes, automatically start EXECUTION phase
    if (parentNode.key === 'ORDER_REQUIREMENT' && updatedStatus === NODE_STATUSES.COMPLETED) {
      await this.startExecutionPhaseIfOrderReqCompleted(parentNode.timeline, parentNode.project);
    }

    // Recursively walk up to the grandparent if this was a substage
    if (parentNode.parentNode) {
      await this.recalculateStageStatus(parentNode.parentNode);
    }
  }

  async startExecutionPhaseIfOrderReqCompleted(timelineId, projectId) {
    try {
      const execStage = await TimelineNode.findOne({ timeline: timelineId, key: 'EXECUTION' });
      if (!execStage) return;

      // Transition EXECUTION to IN_PROGRESS if not already completed/in-progress
      if (execStage.status === NODE_STATUSES.PENDING || execStage.status === 'NOT_STARTED') {
        execStage.status = NODE_STATUSES.IN_PROGRESS;
        await execStage.save();

        // 1. Activate the 3 parallel stream parent nodes
        const streamNodes = await TimelineNode.find({
          timeline: timelineId,
          key: { $in: ['HARDWARE_STREAM', 'TECH_STREAM', 'CONTENT_STREAM'] }
        });

        for (const sNode of streamNodes) {
          if (sNode.status === NODE_STATUSES.PENDING || sNode.status === 'NOT_STARTED') {
            sNode.status = NODE_STATUSES.IN_PROGRESS;
            await sNode.save();
          }
        }

        // 2. Activate the first task of each parallel stream
        const initialTasks = await TimelineNode.find({
          timeline: timelineId,
          key: { $in: ['REQ_AND_STOCK_CHECK', 'PROJECT_CONFIG_AND_IMPLEMENTATION', 'CONTENT_REVIEW_QA'] }
        });

        for (const tNode of initialTasks) {
          if (tNode.status === NODE_STATUSES.PENDING || tNode.status === 'NOT_STARTED') {
            tNode.status = NODE_STATUSES.IN_PROGRESS;
            await tNode.save();
          }
        }

        // 3. Send real-time notifications to PM and Admins
        const timeline = await Timeline.findById(timelineId).populate('project');
        const projId = projectId || timeline?.project?._id || timeline?.project;
        const project = timeline?.project || (projId ? await this._findProject(projId) : null);

        try {
          const notificationService = require('../notifications/notifications.service');
          await notificationService.notifyWithAdminsAndPMs({
            projectId: projId,
            title: 'Execution Phase Started (Stage 04)',
            message: `Order Requirement stage has been completed! Stage 04 Execution Phase (Hardware, Tech, and Content streams) has automatically started for project ${project?.projectId || ''} (${project?.projectName || project?.title || ''}).`,
            type: 'STAGE_UPDATED',
            metadata: {
              nodeKey: 'EXECUTION',
              stage: '04 — EXECUTION',
              targetUrl: '/tracker'
            }
          });
        } catch (notifErr) {
          console.error('Notification error on execution start:', notifErr.message);
        }

        if (projId) {
          await Activity.create({
            project: projId,
            action: 'STAGE_STARTED',
            resourceType: 'TimelineNode',
            resourceId: execStage._id,
            metadata: { stage: 'EXECUTION', reason: 'Order Requirement stage completed' }
          });
        }
      }
    } catch (err) {
      console.error('Error starting execution phase after order requirement completion:', err);
    }
  }

  // Delete all nodes for a project's timeline and re-create from current config using single method
  async resetTimelineForProject(projectId) {
    const project = await this._findProject(projectId);
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // STRICT CHECK: Ensure project strictly exists in Core Backend
    const lookupCode = project._id ? String(project._id) : (project.projectId || '');
    let isCore = project.source === 'CORE_BACKEND' || project.source === 'CORE_BACKEND_WITH_LOCAL_MERGE';
    if (!isCore) {
      try {
        const verified = await coreApi.getProjectById(lookupCode);
        if (verified) isCore = true;
      } catch (_) {}
    }
    if (!isCore) {
      throw new AppError('Cannot reset timeline: This project does not exist in Core Backend.', 400, 'NOT_CORE_PROJECT');
    }

    const pId = project._id;
    const projectCode = project.projectId || String(project._id);

    const query = {
      $or: [
        { project: pId },
        { projectId: projectCode },
        { projectId: projectCode.toUpperCase() },
        { projectId: projectCode.toLowerCase() }
      ]
    };

    const timeline = await Timeline.findOne(query);
    if (timeline) {
      await TimelineNode.deleteMany({ timeline: timeline._id });
      await Timeline.deleteOne({ _id: timeline._id });
    }

    await this.createTimelineForProject(project);
    return await this.getTimelineHierarchy(projectId);
  }

  _syncSchoolWiseHardwareExecution(reqDoc, project) {
    try {
      if (!reqDoc) return;
      const orderReq = reqDoc.orderRequirement || {};
      const schoolInfo = orderReq.schoolInformation || {};
      const schoolsList = Array.isArray(schoolInfo.schools)
        ? schoolInfo.schools
        : (Array.isArray(project?.schools) ? project.schools : []);

      const schoolWiseHwConfig = orderReq.hardwareRequirement?.schoolWiseHardware || {};
      const stockItems = reqDoc.execution?.hardware?.reqAndStockCheck?.stockCheck?.items || reqDoc.execution?.hardware?.reqAndStockCheck?.items || {};
      const purchaseItems = reqDoc.execution?.hardware?.purchaseIfNeeded?.items || {};
      const consignmentItems = reqDoc.execution?.hardware?.consignmentTracking?.items || {};
      const readyConfig = reqDoc.execution?.hardware?.hardwareReady || {};
      const schoolVerification = readyConfig.schoolWiseVerification || {};

      const schoolWiseExecution = {};

      const normalizeArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(Boolean);
        if (typeof val === 'object') {
          if (val.poNumber || val.piNumber || val.poDocumentUrl || val.piDocumentUrl || val.invoiceNumber || val.trackingNumber) {
            return [val];
          }
          const arr = Object.values(val).filter(Boolean);
          if (arr.length > 0) return arr;
        }
        return [];
      };

      // Cache existing hardware records from execution.schoolWiseHardware to prevent data loss across stages
      const existingSchoolHw = reqDoc.execution?.schoolWiseHardware || {};
      for (const school of Object.values(existingSchoolHw)) {
        if (!school || typeof school !== 'object') continue;
        const hwList = Array.isArray(school.hardware) ? school.hardware : Object.values(school.hardwareMap || {});
        for (const item of hwList) {
          if (!item || !item.hardwareKey) continue;
          const k = item.hardwareKey;
          if (!stockItems[k] && item.stockCheck) {
            stockItems[k] = { ...item.stockCheck, itemName: item.itemName, specNotes: item.specNotes };
          }
          if (!purchaseItems[k] && item.poAndPi) {
            purchaseItems[k] = item.poAndPi;
          }
          if (!consignmentItems[k] && item.consignmentTracking) {
            consignmentItems[k] = item.consignmentTracking;
          }
        }
      }

      // Map school metadata by ID and Name
      const schoolMetaMap = {};
      schoolsList.forEach((s) => {
        const id = s.schoolId || s._id || s.id;
        const name = s.schoolName || s.name || id;
        if (id) {
          schoolMetaMap[id] = {
            schoolId: id,
            schoolName: name,
            address: s.address || s.schoolAddress || '',
            contactPerson: s.contactPerson || s.principalName || '',
            phone: s.contactPhone || s.phone || ''
          };
        }
        if (name && !schoolMetaMap[name]) {
          schoolMetaMap[name] = {
            schoolId: id || name,
            schoolName: name,
            address: s.address || s.schoolAddress || '',
            contactPerson: s.contactPerson || s.principalName || '',
            phone: s.contactPhone || s.phone || ''
          };
        }
      });

      // Iterate through schoolWiseHardware from Stage 03
      if (Object.keys(schoolWiseHwConfig).length > 0) {
        for (const [schoolKey, hwMap] of Object.entries(schoolWiseHwConfig)) {
          if (!hwMap || typeof hwMap !== 'object') continue;
          const meta = schoolMetaMap[schoolKey] || {
            schoolId: schoolKey,
            schoolName: schoolKey,
            address: '',
            contactPerson: '',
            phone: ''
          };

          const schoolReady = schoolVerification[schoolKey] || schoolVerification[meta.schoolName] || {};
          const hardwareEntries = {};

          const hardwareList = [];
          for (const [hwKey, hwVal] of Object.entries(hwMap)) {
            if (!hwVal || typeof hwVal !== 'object') continue;
            const qty = Number(hwVal.quantity || hwVal.qty) || 1;
            // Stock Check status & member from Stage 04 Stock Check
            const stockEntry = stockItems[hwKey] || {};
            const spec = stockEntry.specNotes !== undefined && stockEntry.specNotes !== ''
              ? stockEntry.specNotes
              : (hwVal.specNotes || hwVal.specs || hwVal.specifications || '');
            const name = stockEntry.itemName || hwVal.itemName || hwVal.name || hwKey;
            const stockStatus = stockEntry.stockDecision || stockEntry.stockStatus || 'IN_STOCK';
            const member = stockEntry.inStockAssignedTo || stockEntry.purchaseAssignedTo || stockEntry.assignedTo || '';

            // Purchase PO & PI from Stage 04 Purchase
            const purchaseEntry = purchaseItems[hwKey] || {};
            const rawPOs = purchaseEntry.purchaseOrders || stockEntry.purchaseOrders || stockEntry.po || (purchaseEntry.poNumber ? [purchaseEntry] : []);
            const rawPIs = purchaseEntry.proformaInvoices || stockEntry.proformaInvoices || stockEntry.pi || (purchaseEntry.piNumber ? [purchaseEntry] : []);
            const purchaseOrders = normalizeArray(rawPOs);
            const proformaInvoices = normalizeArray(rawPIs);

            const finalPOs = purchaseOrders.length > 0 ? purchaseOrders : (stockStatus === 'IN_STOCK' ? [] : purchaseOrders);
            const finalPIs = proformaInvoices.length > 0 ? proformaInvoices : (stockStatus === 'IN_STOCK' ? [] : proformaInvoices);

            // Consignment tracking from Stage 04 Consignment
            const consignmentEntry = consignmentItems[hwKey] || {};
            const consignments = normalizeArray(consignmentEntry.consignments || (consignmentEntry.trackingNumber ? [consignmentEntry] : []));

            // Hardware Ready verification
            const itemReady = schoolReady.items?.[hwKey] || {};
            const hardwareReady = {
              received: itemReady.checked !== undefined ? itemReady.checked : (readyConfig.allHardwareReceived === 'YES'),
              deliveryDate: itemReady.deliveryDate || schoolReady.deliveryDate || readyConfig.deliveryDate || null,
              receivedQty: itemReady.qty !== undefined ? Number(itemReady.qty) : qty,
              readyForInstallation: readyConfig.readyForInstallation || 'YES',
              damagedItems: readyConfig.damagedItems || '',
              remarks: itemReady.remarks || schoolReady.schoolRemarks || readyConfig.remarks || ''
            };

            const inStockQty = Number(stockEntry.inStockQty) || (stockStatus === 'IN_STOCK' ? qty : 0);
            const purchaseQty = Number(stockEntry.purchaseQty) || (stockStatus === 'IN_STOCK' ? 0 : qty);

            const hwDetail = {
              hardwareKey: hwKey,
              itemName: name,
              quantity: qty,
              qty: qty,
              specNotes: spec,
              spec: spec,
              solutionKey: hwVal.solutionKey || '',
              solutionName: hwVal.solutionName || '',
              serialNotes: hwVal.serialNotes || '',

              // 1. Stock Check Detail
              stockCheck: {
                requiredQty: qty,
                inStockQty: inStockQty,
                purchaseQty: purchaseQty,
                stockStatus: stockStatus,
                assignedTo: member || null,
                verifiedAt: stockEntry.submittedAt || null,
                remarks: stockEntry.remarks || ''
              },

              // 2. PO & PI Vendor Procurement Detail
              poAndPi: {
                vendorName: purchaseEntry.vendorName || '',
                purchaseOrders: finalPOs,
                proformaInvoices: finalPIs,
                paymentStatus: purchaseEntry.paymentStatus || (finalPIs[0]?.paymentStatus) || (stockStatus === 'IN_STOCK' ? 'PAID' : 'PENDING'),
                overallRemarks: purchaseEntry.overallProcurementRemarks || purchaseEntry.remarks || ''
              },

              // 3. Consignment & Delivery Detail
              consignmentTracking: {
                courierName: consignmentEntry.courierName || '',
                trackingNumber: consignmentEntry.trackingNumber || '',
                dispatchDate: consignmentEntry.dispatchDate || null,
                expectedDeliveryDate: consignmentEntry.expectedDeliveryDate || null,
                deliveryStatus: consignmentEntry.deliveryStatus || 'PENDING',
                actualDeliveryDate: consignmentEntry.actualDeliveryDate || null,
                proofOfDeliveryUrl: consignmentEntry.proofOfDeliveryUrl || '',
                consignments: consignments,
                remarks: consignmentEntry.remarks || ''
              },

              // 4. Site Arrival & Verification Ready Detail
              hardwareReady,

              // Flat compatibility aliases
              stockCheckStatus: stockStatus,
              inStockQty: inStockQty,
              purchaseQty: purchaseQty,
              member: member,
              purchaseOrders: finalPOs,
              proformaInvoices: finalPIs
            };

            hardwareEntries[hwKey] = hwDetail;
            hardwareList.push(hwDetail);
          }

          schoolWiseExecution[schoolKey] = {
            ...meta,
            readyForInstallation: schoolReady.deliveryStatus === 'DELIVERED' || readyConfig.readyForInstallation === 'YES' ? 'YES' : (readyConfig.readyForInstallation || 'NO'),
            allHardwareReceived: readyConfig.allHardwareReceived || 'YES',
            deliveryDate: schoolReady.deliveryDate || readyConfig.deliveryDate || null,
            hardware: hardwareList,
            hardwareMap: hardwareEntries
          };
        }
      } else {
        // Fallback: build from stockItems or orderReq.hardwareRequirement.items
        const allItems = { ...(orderReq.hardwareRequirement?.items || {}), ...stockItems };
        for (const [hwKey, itemData] of Object.entries(allItems)) {
          if (!itemData || typeof itemData !== 'object' || Array.isArray(itemData)) continue;
          const schoolBreakdown = Array.isArray(itemData.schoolBreakdown) ? itemData.schoolBreakdown : [];
          const stockEntry = stockItems[hwKey] || itemData;
          const stockStatus = stockEntry.stockDecision || stockEntry.stockStatus || 'IN_STOCK';
          const member = stockEntry.inStockAssignedTo || stockEntry.purchaseAssignedTo || stockEntry.assignedTo || '';
          const purchaseEntry = purchaseItems[hwKey] || {};
          const rawPOs = purchaseEntry.purchaseOrders || stockEntry.purchaseOrders || stockEntry.po || (purchaseEntry.poNumber ? [purchaseEntry] : []);
          const rawPIs = purchaseEntry.proformaInvoices || stockEntry.proformaInvoices || stockEntry.pi || (purchaseEntry.piNumber ? [purchaseEntry] : []);
          const purchaseOrders = normalizeArray(rawPOs);
          const proformaInvoices = normalizeArray(rawPIs);

          const finalPOs = purchaseOrders.length > 0 ? purchaseOrders : (stockStatus === 'IN_STOCK' ? [] : purchaseOrders);
          const finalPIs = proformaInvoices.length > 0 ? proformaInvoices : (stockStatus === 'IN_STOCK' ? [] : proformaInvoices);

          const consignmentEntry = consignmentItems[hwKey] || {};
          const consignments = normalizeArray(consignmentEntry.consignments || (consignmentEntry.trackingNumber ? [consignmentEntry] : []));

          if (schoolBreakdown.length > 0) {
            schoolBreakdown.forEach((sb) => {
              const sKey = sb.schoolId || sb.schoolName || 'school-1';
              const meta = schoolMetaMap[sKey] || schoolMetaMap[sb.schoolName] || {
                schoolId: sKey,
                schoolName: sb.schoolName || sKey,
                address: '',
                contactPerson: '',
                phone: ''
              };

              const schoolReady = schoolVerification[sKey] || schoolVerification[meta.schoolName] || {};
              const itemReady = schoolReady.items?.[hwKey] || {};
              const schoolQty = Number(sb.quantity || sb.qty) || 1;
              const hardwareReady = {
                received: itemReady.checked !== undefined ? itemReady.checked : (readyConfig.allHardwareReceived === 'YES'),
                deliveryDate: itemReady.deliveryDate || schoolReady.deliveryDate || readyConfig.deliveryDate || null,
                receivedQty: itemReady.qty !== undefined ? Number(itemReady.qty) : schoolQty,
                readyForInstallation: readyConfig.readyForInstallation || 'YES',
                damagedItems: readyConfig.damagedItems || '',
                remarks: itemReady.remarks || schoolReady.schoolRemarks || readyConfig.remarks || ''
              };

              const inStockQty = Math.min(schoolQty, Number(stockEntry.inStockQty) || (stockStatus === 'IN_STOCK' ? schoolQty : 0));
              const purchaseQty = Math.min(schoolQty, Number(stockEntry.purchaseQty) || (stockStatus === 'IN_STOCK' ? 0 : schoolQty));

              if (!schoolWiseExecution[sKey]) {
                schoolWiseExecution[sKey] = {
                  ...meta,
                  readyForInstallation: schoolReady.deliveryStatus === 'DELIVERED' || readyConfig.readyForInstallation === 'YES' ? 'YES' : (readyConfig.readyForInstallation || 'NO'),
                  allHardwareReceived: readyConfig.allHardwareReceived || 'YES',
                  deliveryDate: schoolReady.deliveryDate || readyConfig.deliveryDate || null,
                  hardware: [],
                  hardwareMap: {}
                };
              }

              const hwDetail = {
                hardwareKey: hwKey,
                itemName: itemData.itemName || hwKey,
                quantity: schoolQty,
                qty: schoolQty,
                specNotes: itemData.specNotes || sb.specs || '',
                spec: itemData.specNotes || sb.specs || '',
                solutionKey: sb.solutionKey || '',
                solutionName: sb.solutionName || '',
                serialNotes: sb.serialNotes || '',
                stockCheck: {
                  requiredQty: schoolQty,
                  inStockQty: inStockQty,
                  purchaseQty: purchaseQty,
                  stockStatus: stockStatus,
                  assignedTo: member || null,
                  remarks: stockEntry.remarks || ''
                },
                poAndPi: {
                  vendorName: purchaseEntry.vendorName || '',
                  purchaseOrders: finalPOs,
                  proformaInvoices: finalPIs,
                  paymentStatus: purchaseEntry.paymentStatus || (stockStatus === 'IN_STOCK' ? 'PAID' : 'PENDING'),
                  overallRemarks: purchaseEntry.overallProcurementRemarks || ''
                },
                consignmentTracking: {
                  courierName: consignmentEntry.courierName || '',
                  trackingNumber: consignmentEntry.trackingNumber || '',
                  dispatchDate: consignmentEntry.dispatchDate || null,
                  expectedDeliveryDate: consignmentEntry.expectedDeliveryDate || null,
                  deliveryStatus: consignmentEntry.deliveryStatus || 'PENDING',
                  consignments: consignments,
                  remarks: consignmentEntry.remarks || ''
                },
                hardwareReady,
                stockCheckStatus: stockStatus,
                inStockQty: inStockQty,
                purchaseQty: purchaseQty,
                member: member,
                purchaseOrders: finalPOs,
                proformaInvoices: finalPIs
              };

              schoolWiseExecution[sKey].hardware.push(hwDetail);
              schoolWiseExecution[sKey].hardwareMap[hwKey] = hwDetail;
            });
          } else if (schoolsList.length > 0) {
            schoolsList.forEach((s, idx) => {
              const sKey = s.schoolId || s._id || s.id || `school-${idx + 1}`;
              const meta = schoolMetaMap[sKey] || {
                schoolId: sKey,
                schoolName: s.schoolName || s.name || sKey,
                address: s.address || '',
                contactPerson: s.contactPerson || '',
                phone: s.phone || ''
              };
              const schoolReady = schoolVerification[sKey] || schoolVerification[meta.schoolName] || {};
              const itemReady = schoolReady.items?.[hwKey] || {};
              const itemQty = Number(itemData.quantity || itemData.qty) || 1;
              const hardwareReady = {
                received: itemReady.checked !== undefined ? itemReady.checked : (readyConfig.allHardwareReceived === 'YES'),
                deliveryDate: itemReady.deliveryDate || schoolReady.deliveryDate || readyConfig.deliveryDate || null,
                receivedQty: itemReady.qty !== undefined ? Number(itemReady.qty) : itemQty,
                readyForInstallation: readyConfig.readyForInstallation || 'YES',
                damagedItems: readyConfig.damagedItems || '',
                remarks: itemReady.remarks || schoolReady.schoolRemarks || readyConfig.remarks || ''
              };

              const inStockQty = Number(stockEntry.inStockQty) || (stockStatus === 'IN_STOCK' ? itemQty : 0);
              const purchaseQty = Number(stockEntry.purchaseQty) || (stockStatus === 'IN_STOCK' ? 0 : itemQty);

              if (!schoolWiseExecution[sKey]) {
                schoolWiseExecution[sKey] = {
                  ...meta,
                  readyForInstallation: schoolReady.deliveryStatus === 'DELIVERED' || readyConfig.readyForInstallation === 'YES' ? 'YES' : (readyConfig.readyForInstallation || 'NO'),
                  allHardwareReceived: readyConfig.allHardwareReceived || 'YES',
                  deliveryDate: schoolReady.deliveryDate || readyConfig.deliveryDate || null,
                  hardware: [],
                  hardwareMap: {}
                };
              }

              const hwDetail = {
                hardwareKey: hwKey,
                itemName: itemData.itemName || hwKey,
                quantity: itemQty,
                qty: itemQty,
                specNotes: itemData.specNotes || '',
                spec: itemData.specNotes || '',
                solutionKey: '',
                solutionName: itemData.solutionName || '',
                serialNotes: itemData.serialNotes || '',
                stockCheck: {
                  requiredQty: itemQty,
                  inStockQty: inStockQty,
                  purchaseQty: purchaseQty,
                  stockStatus: stockStatus,
                  assignedTo: member || null,
                  remarks: stockEntry.remarks || ''
                },
                poAndPi: {
                  vendorName: purchaseEntry.vendorName || '',
                  purchaseOrders: finalPOs,
                  proformaInvoices: finalPIs,
                  paymentStatus: purchaseEntry.paymentStatus || (stockStatus === 'IN_STOCK' ? 'PAID' : 'PENDING'),
                  overallRemarks: purchaseEntry.overallProcurementRemarks || ''
                },
                consignmentTracking: {
                  courierName: consignmentEntry.courierName || '',
                  trackingNumber: consignmentEntry.trackingNumber || '',
                  dispatchDate: consignmentEntry.dispatchDate || null,
                  expectedDeliveryDate: consignmentEntry.expectedDeliveryDate || null,
                  deliveryStatus: consignmentEntry.deliveryStatus || 'PENDING',
                  consignments: consignments,
                  remarks: consignmentEntry.remarks || ''
                },
                hardwareReady,
                stockCheckStatus: stockStatus,
                inStockQty: inStockQty,
                purchaseQty: purchaseQty,
                member: member,
                purchaseOrders: finalPOs,
                proformaInvoices: finalPIs
              };

              schoolWiseExecution[sKey].hardware.push(hwDetail);
              schoolWiseExecution[sKey].hardwareMap[hwKey] = hwDetail;
            });
          }
        }
      }

      reqDoc.execution = reqDoc.execution || {};
      reqDoc.execution.schoolWiseHardware = schoolWiseExecution;
      if (reqDoc.execution.hardware) {
        delete reqDoc.execution.hardware;
      }
      reqDoc.markModified('execution');
    } catch (syncErr) {
      console.error('Error syncing school-wise hardware execution:', syncErr);
    }
  }

  async syncSchoolProgressToTimeline(projectId) {
    try {
      const School = require('../schools/school.model');
      const Timeline = require('./timeline.model');
      const TimelineNode = require('./timeline-node.model');

      const project = await this._findProject(projectId);
      if (!project) return;

      const schools = await School.find({ projectId: project._id, isActive: true });
      if (schools.length === 0) return;

      const totalSchools = schools.length;
      const installedSchools = schools.filter(s => s.installation && s.installation.status === 'COMPLETED').length;
      const trainedSchools = schools.filter(s => s.training && s.training.status === 'COMPLETED').length;

      const timeline = await Timeline.findOne({ project: project._id });
      if (!timeline) return;

      if (timeline.stages && Array.isArray(timeline.stages)) {
        for (const stage of timeline.stages) {
          if ((stage.stageKey === 'INSTALLATION' || stage.stageKey === 'STAGE_05_INSTALLATION') && stage.tasks) {
            for (const task of stage.tasks) {
              if (task.scope === 'SCHOOL_LEVEL' || task.taskKey === 'PHYSICAL_INSTALLATION' || task.taskKey === 'INSTALLATION_COMPLETED') {
                task.schoolProgressSummary = {
                  totalSchools,
                  completedSchools: installedSchools,
                  progressText: `${installedSchools}/${totalSchools} Schools Installed (${Math.round((installedSchools / totalSchools) * 100)}%)`
                };
                if (installedSchools === totalSchools && totalSchools > 0) task.status = 'COMPLETED';
                else if (installedSchools > 0) task.status = 'IN_PROGRESS';
              }
            }
          }
          if ((stage.stageKey === 'TRAINING' || stage.stageKey === 'STAGE_06_TRAINING') && stage.tasks) {
            for (const task of stage.tasks) {
              if (task.scope === 'SCHOOL_LEVEL' || task.taskKey === 'TEACHER_TRAINING' || task.taskKey === 'TRAINING_EXECUTION' || task.taskKey === 'TRAINING_COMPLETED') {
                task.schoolProgressSummary = {
                  totalSchools,
                  completedSchools: trainedSchools,
                  progressText: `${trainedSchools}/${totalSchools} Schools Trained (${Math.round((trainedSchools / totalSchools) * 100)}%)`
                };
                if (trainedSchools === totalSchools && totalSchools > 0) task.status = 'COMPLETED';
                else if (trainedSchools > 0) task.status = 'IN_PROGRESS';
              }
            }
          }
        }
        if (typeof timeline.recalculateProgress === 'function') {
          timeline.recalculateProgress();
        }
        await timeline.save();
      }

      // Sync legacy TimelineNode if present for backward compatibility
      if (installedSchools === totalSchools && totalSchools > 0) {
        await TimelineNode.updateOne(
          { timeline: timeline._id, key: 'INSTALLATION_COMPLETED' },
          { $set: { status: 'COMPLETED' } }
        );
      }
      if (trainedSchools === totalSchools && totalSchools > 0) {
        await TimelineNode.updateOne(
          { timeline: timeline._id, key: 'TRAINING_COMPLETED' },
          { $set: { status: 'COMPLETED' } }
        );
      }
    } catch (err) {
      console.warn('Note on syncSchoolProgressToTimeline:', err.message);
    }
  }
}

module.exports = new TimelineService();


