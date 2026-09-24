const Timeline = require('./timeline.model');
const TimelineNode = require('./timeline-node.model');
const Activity = require('../activity/activity.model');
const Notification = require('../notifications/notifications.model');
const Project = require('../projects/project.model');
const timelineConfig = require('../../config/timeline');
const { NODE_STATUSES, NODE_TYPES, GLOBAL_ROLES, DESIGNATIONS } = require('../../core/constants');
const { AppError } = require('../../core/errors');

class TimelineService {
  async _findProject(projectId) {
    if (!projectId) return null;
    const mongoose = require('mongoose');

    // 1. If already a Mongoose ObjectId instance or populated project object
    if (projectId instanceof mongoose.Types.ObjectId) {
      return await Project.findById(projectId);
    }
    if (typeof projectId === 'object' && projectId._id) {
      return await Project.findById(projectId._id);
    }

    const idStr = String(projectId).trim();
    if (!idStr || idStr === '[object Object]' || idStr === 'undefined' || idStr === 'null') {
      return null;
    }

    // 2. Check if valid 24-char ObjectId string
    if (mongoose.Types.ObjectId.isValid(idStr) && idStr.length === 24) {
      const proj = await Project.findById(idStr);
      if (proj) return proj;
    }

    // 3. Fallback to custom human-readable projectId or id field
    return await Project.findOne({ $or: [{ projectId: idStr }, { id: idStr }] });
  }

  async initializeTimelineForProject(projectId, force = false) {
    const project = await this._findProject(projectId);
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    if ((project.status === 'PENDING_REVIEW' || project.reviewStatus === 'PENDING') && !force) {
      return null;
    }

    const pmId = project.projectManager;

    let timeline = await Timeline.findOne({ project: project._id });
    if (!timeline) {
      timeline = await Timeline.create({
        project: project._id,
        projectId: project.projectId,
        projectName: project.projectName || project.title,
        organization: project.organization || project.client || project.projectName,
        email: project.email,
        phone: project.phone,
        address: project.address,
        numberOfSchools: project.numberOfSchools || 0,
        numberOfLicenses: project.numberOfLicenses || 0,
        country: project.country,
        projectManager: pmId || undefined,
        coreBackendData: project.toObject ? project.toObject() : project,
        metadata: project.metadata || {},
        templateVersion: timelineConfig.version || 'v1',
        status: NODE_STATUSES.IN_PROGRESS
      });
    } else {
      let needsSave = false;
      if (!timeline.projectId && project.projectId) { timeline.projectId = project.projectId; needsSave = true; }
      if (!timeline.projectName && (project.projectName || project.title)) { timeline.projectName = project.projectName || project.title; needsSave = true; }
      if (!timeline.organization && (project.organization || project.client)) { timeline.organization = project.organization || project.client; needsSave = true; }
      if (!timeline.email && project.email) { timeline.email = project.email; needsSave = true; }
      if (!timeline.phone && project.phone) { timeline.phone = project.phone; needsSave = true; }
      if (!timeline.address && project.address) { timeline.address = project.address; needsSave = true; }
      if (!timeline.projectManager && pmId) { timeline.projectManager = pmId; needsSave = true; }
      if ((timeline.numberOfSchools === undefined || timeline.numberOfSchools === 0) && project.numberOfSchools) {
        timeline.numberOfSchools = project.numberOfSchools; needsSave = true;
      }
      if ((timeline.numberOfLicenses === undefined || timeline.numberOfLicenses === 0) && project.numberOfLicenses) {
        timeline.numberOfLicenses = project.numberOfLicenses; needsSave = true;
      }
      if (!timeline.country && project.country) { timeline.country = project.country; needsSave = true; }
      if (!timeline.coreBackendData || Object.keys(timeline.coreBackendData).length === 0) {
        timeline.coreBackendData = project.toObject ? project.toObject() : project;
        needsSave = true;
      }
      if (needsSave) {
        await timeline.save();
      }
    }

    const existingCount = await TimelineNode.countDocuments({ timeline: timeline._id });
    if (existingCount === 0) {
      for (const stageDef of timelineConfig.stages) {
        const stageAssignedTo = pmId || null;
        const stageNode = await TimelineNode.create({
          timeline: timeline._id,
          parentNode: null,
          type: NODE_TYPES.STAGE,
          key: stageDef.key,
          name: stageDef.name,
          order: stageDef.order,
          status: NODE_STATUSES.PENDING,
          assignedTo: stageAssignedTo,
          dependencies: stageDef.dependencies || [],
          metadata: stageDef.metadata || {}
        });

        if (stageDef.substages) {
          for (const subDef of stageDef.substages) {
            const subAssignedTo = pmId || null;
            const subTaskNode = await TimelineNode.create({
              timeline: timeline._id,
              parentNode: stageNode._id,
              type: NODE_TYPES.TASK,
              key: subDef.key,
              name: subDef.name,
              order: subDef.order,
              status: NODE_STATUSES.PENDING,
              assignedTo: subAssignedTo,
              formSchema: subDef.formSchema || null,
              metadata: subDef.metadata || {}
            });

            if (subDef.nested) {
              for (const nestedDef of subDef.nested) {
                const nestedAssignedTo = pmId || null;
                await TimelineNode.create({
                  timeline: timeline._id,
                  parentNode: subTaskNode._id,
                  type: NODE_TYPES.TASK,
                  key: nestedDef.key,
                  name: nestedDef.name,
                  order: nestedDef.order,
                  status: NODE_STATUSES.PENDING,
                  assignedTo: nestedAssignedTo,
                  formSchema: nestedDef.formSchema || null,
                  metadata: {
                    ...(nestedDef.metadata || {}),
                    supportsConditional: nestedDef.supportsConditional || false,
                    conditionalOnly: nestedDef.conditionalOnly || null
                  }
                });
              }
            }
          }
        }
      }
    }
    return timeline;
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

    if (project.status === 'PENDING_REVIEW' || project.reviewStatus === 'PENDING') {
      return {
        timeline: null,
        nodes: [],
        hierarchy: [],
        isPendingReview: true,
        message: 'Project request is pending review. Timeline will be created upon confirmation.'
      };
    }

    // Robust PM resolution: Project -> ProjectMember -> ProjectRequest -> Default PM
    let effectivePmId = project.projectManager;
    if (!effectivePmId) {
      const ProjectMember = require('../projects/project-member.model');
      const pmMember = await ProjectMember.findOne({ project: project._id, designation: 'PROJECT_MANAGER', isActive: true });
      if (pmMember && pmMember.employee) {
        effectivePmId = pmMember.employee;
      } else {
        const ProjectRequest = require('../requests/project-request.model');
        const reqDoc = await ProjectRequest.findOne({
          $or: [{ confirmedProjectId: project._id }, { projectId: project.projectId }, { title: project.projectName }]
        });
        if (reqDoc && reqDoc.projectManager) {
          effectivePmId = reqDoc.projectManager;
        }
      }
    }

    let timeline = await Timeline.findOne({ project: project._id }).populate('projectManager', 'name email employeeCode globalRole');
    if (!timeline) {
      timeline = await this.initializeTimelineForProject(project._id);
      if (timeline) {
        timeline = await Timeline.findById(timeline._id).populate('projectManager', 'name email employeeCode globalRole');
      }
    } else if (!timeline.projectManager && effectivePmId) {
      timeline.projectManager = effectivePmId;
      await timeline.save();
      timeline = await Timeline.findById(timeline._id).populate('projectManager', 'name email employeeCode globalRole');
    }

    if (!timeline) {
      return {
        timeline: null,
        nodes: [],
        hierarchy: [],
        isPendingReview: true,
        message: 'Project request is pending review. Timeline will be created upon confirmation.'
      };
    }

    let nodes = await TimelineNode.find({ timeline: timeline._id })
      .populate('assignedTo', 'name email employeeCode')
      .sort({ order: 1 });

    // Ensure all stages and substage nodes are assigned to PM by default if not yet assigned
    if (effectivePmId) {
      let pmAssignedUpdated = false;
      for (const node of nodes) {
        if (!node.assignedTo) {
          node.assignedTo = effectivePmId;
          await node.save();
          pmAssignedUpdated = true;
        }
      }
      if (pmAssignedUpdated) {
        nodes = await TimelineNode.find({ timeline: timeline._id })
          .populate('assignedTo', 'name email employeeCode')
          .sort({ order: 1 });
      }
    }

    if (nodes.length === 0) {
      await this.initializeTimelineForProject(project._id);
      nodes = await TimelineNode.find({ timeline: timeline._id })
        .populate('assignedTo', 'name email employeeCode')
        .sort({ order: 1 });
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

    // Auto-migrate Content Stream to latest 5 tasks if not yet created
    const contentStreamNode = nodes.find(n => n.key === 'CONTENT_STREAM');
    if (contentStreamNode) {
      const contentTasks = [
        { key: 'CONTENT_CONFIGURATION', name: 'Content Configuration', order: 1 },
        { key: 'CONTENT_REVIEW_QA', name: 'Content Review & QA', order: 2 },
        { key: 'SHEET_READINESS', name: 'Sheet Readiness', order: 3 },
        { key: 'DUMP_READINESS', name: 'Dump Readiness', order: 4 },
        { key: 'CONTENT_READY', name: 'Content Ready', order: 5 }
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

    // Build hierarchical tree
    const nodeMap = {};
    nodes.forEach(node => {
      const obj = node.toObject();
      if (schemaMap[node.key]) {
        obj.formSchema = schemaMap[node.key];
      }
      if (nameMap[node.key]) {
        obj.name = nameMap[node.key];
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

    return { timeline, structure: tree, nodes };
  }

  async getNodeDoc(projectId, nodeId) {
    const timeline = await Timeline.findOne({ project: projectId });
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
    const timeline = await Timeline.findOne({ project: projectId });
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
      const reqDoc = await Requirements.findOne({ project: projectId }).lean();
      const projDoc = await Project.findById(projectId).lean();

      if (!nodeObj.formData || Object.keys(nodeObj.formData).length === 0) {
        nodeObj.formData = {};
      }

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
          ...nodeObj.formData
        };
      } else if (node.key === 'SCHOOL_ONBOARDING_INFORMATION') {
        const sInfo = reqDoc?.orderRequirement?.schoolInformation || {};
        const schoolsList = Array.isArray(nodeObj.formData?.schools) && nodeObj.formData.schools.length > 0
          ? nodeObj.formData.schools
          : (Array.isArray(sInfo?.schools) && sInfo.schools.length > 0 ? sInfo.schools : []);
        nodeObj.formData = {
          schoolName: nodeObj.formData.schoolName || sInfo.schoolName || projDoc?.organization || projDoc?.projectName || '',
          address: nodeObj.formData.address || sInfo.address || projDoc?.address || '',
          phone: nodeObj.formData.phone || sInfo.phone || projDoc?.phone || '',
          email: nodeObj.formData.email || sInfo.email || projDoc?.email || '',
          totalStudents: nodeObj.formData.totalStudents || sInfo.totalStudents || projDoc?.numberOfSchools || 0,
          remarks: nodeObj.formData.remarks || sInfo.remarks || '',
          ...nodeObj.formData,
          schools: schoolsList
        };
      } else if (['INSTALLATION_EXECUTION', 'INSTALLATION_PLANNING', 'INSTALLATION_COMPLETED', 'INSTALLATION'].includes(node.key)) {
        const sInfo = reqDoc?.orderRequirement?.schoolInformation || {};
        const schoolsList = Array.isArray(nodeObj.formData?.schools) && nodeObj.formData.schools.length > 0
          ? nodeObj.formData.schools
          : (Array.isArray(sInfo?.schools) && sInfo.schools.length > 0 ? sInfo.schools : []);
        
        nodeObj.formData = {
          ...nodeObj.formData,
          schools: schoolsList.length > 0 ? schoolsList : (nodeObj.formData.schools || [])
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
    const timeline = await Timeline.findOne({ project: projectId });
    if (!timeline) throw new AppError('Timeline not found.', 404, 'TIMELINE_NOT_FOUND');

    return await TimelineNode.find({ timeline: timeline._id, parentNode: nodeId })
      .populate('assignedTo', 'name email employeeCode')
      .sort({ order: 1 });
  }

  async assignNode(projectId, nodeId, employeeId, actorId) {
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
      project: projectId,
      actor: actorId,
      action: 'CONTRIBUTOR_ASSIGNED',
      resourceType: 'TimelineNode',
      resourceId: node._id,
      metadata: { nodeId, employeeId }
    });

    // Create Notification for the assigned user
    if (employeeId) {
      try {
        const project = await Project.findById(projectId);
        const title = `Task Assigned: ${node.name}`;
        const message = `You have been assigned to "${node.name}" in project ${project ? project.projectId : ''} (${project ? (project.projectName || project.title) : ''}).`;

        await Notification.create({
          recipient: employeeId,
          project: projectId,
          title,
          message,
          type: 'ASSIGNMENT'
        });
      } catch (notifErr) {
        console.error('Notification creation failed:', notifErr);
      }
    }

    return await this.getNodeById(projectId, nodeId);
  }

  async updateNodeStatus(projectId, nodeId, newStatus, comment, employee, projectMembership) {
    const node = await this.getNodeDoc(projectId, nodeId);

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
      'CONTENT_CONFIGURATION',
      'CONTENT_REVIEW_QA',
      'SHEET_READINESS',
      'DUMP_READINESS',
      'CONTENT_READY'
    ];
    if (execKeys.includes(node.key) && (newStatus === NODE_STATUSES.IN_PROGRESS || newStatus === NODE_STATUSES.COMPLETED)) {
      const timeline = await Timeline.findOne({ project: projectId });
      if (timeline) {
        const orderReq = await TimelineNode.findOne({ timeline: timeline._id, key: 'ORDER_REQUIREMENT' });
        if (orderReq && orderReq.status !== NODE_STATUSES.COMPLETED) {
          throw new AppError('Order Requirement stage (Stage 03) must be completed before Execution phase (Stage 04) can start.', 422, 'ORDER_REQUIREMENT_NOT_COMPLETED');
        }
      }
    }

    // Check Dependency Gate for Stage 05 (TECH + CONTENT TESTING requires Tech Testing/Ready & Content Ready)
    if (node.key === 'TESTING_PREPARATION' && newStatus === NODE_STATUSES.IN_PROGRESS) {
      const timeline = await Timeline.findOne({ project: projectId });
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
      project: projectId,
      actor: employee._id,
      action: 'STATUS_CHANGED',
      resourceType: 'TimelineNode',
      resourceId: node._id,
      metadata: { previousStatus, newStatus, comment }
    });

    // Notify Project Manager, Admins, and Assignee of status changes
    try {
      const notificationService = require('../notifications/notifications.service');
      const project = await Project.findById(projectId);
      const readableStatus = newStatus.replace(/_/g, ' ');
      const statusTitle = `Stage Updated: ${node.name} (${readableStatus})`;
      const statusMessage = `${employee.name || 'Team member'} updated "${node.name}" status to "${readableStatus}" in project ${project?.projectId || ''} (${project?.projectName || project?.title || ''}).`;

      await notificationService.notifyWithAdminsAndPMs({
        assignedTo: node.assignedTo,
        projectId,
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

    return await this.getNodeById(projectId, nodeId);
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
      'CONTENT_CONFIGURATION',
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
        const purchaseOrders = Array.isArray(formData.purchaseOrders)
          ? formData.purchaseOrders.map(po => ({
              ...po,
              uploadDate: po.uploadDate || po.submittedAt || new Date()
            }))
          : (formData.poNumber || formData.poDocumentUrl ? [{
              poNumber: formData.poNumber,
              poDate: formData.poDate,
              uploadDate: formData.uploadDate || new Date(),
              poDocumentUrl: formData.poDocumentUrl,
              issuingOrganization: formData.issuingOrganization,
              remarks: formData.remarks,
              submittedBy: employee._id,
              submittedAt: new Date()
            }] : []);

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
        const proformaInvoices = Array.isArray(formData.proformaInvoices)
          ? formData.proformaInvoices.map(pi => ({
              ...pi,
              ewayBillNumber: pi.ewayBillNumber || '',
              paymentStatus: pi.paymentStatus || 'PENDING',
              uploadDate: pi.uploadDate || pi.piUploadDate || pi.submittedAt || new Date()
            }))
          : (formData.piNumber || formData.piDocumentUrl ? [{
              piNumber: formData.piNumber,
              piDate: formData.piDate,
              uploadDate: formData.piUploadDate || formData.uploadDate || new Date(),
              ewayBillNumber: formData.ewayBillNumber || '',
              paymentStatus: formData.paymentStatus || 'PENDING',
              piDocumentUrl: formData.piDocumentUrl,
              paymentTerms: formData.paymentTerms,
              remarks: formData.remarks,
              submittedBy: employee._id,
              submittedAt: new Date()
            }] : []);

        const taxInvoices = Array.isArray(formData.taxInvoices)
          ? formData.taxInvoices.map(ti => ({
              ...ti,
              ewayBillNumber: ti.ewayBillNumber || formData.ewayBillNumber || '',
              paymentStatus: ti.paymentStatus || formData.paymentStatus || 'PENDING',
              uploadDate: ti.uploadDate || ti.invoiceUploadDate || ti.submittedAt || new Date()
            }))
          : (formData.invoiceNumber || formData.invoiceDocumentUrl ? [{
              invoiceNumber: formData.invoiceNumber,
              invoiceDate: formData.invoiceDate,
              uploadDate: formData.invoiceUploadDate || formData.uploadDate || new Date(),
              ewayBillNumber: formData.ewayBillNumber || '',
              paymentStatus: formData.paymentStatus || 'PENDING',
              invoiceDocumentUrl: formData.invoiceDocumentUrl,
              paymentTerms: formData.paymentTerms,
              remarks: formData.remarks,
              submittedBy: employee._id,
              submittedAt: new Date()
            }] : []);

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

        if (formData.schoolName || schoolsArr.length > 0 || formData.address || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }
      } else if (key === 'SOLUTION_SELECTION') {
        reqDoc.orderRequirement = {
          ...(reqDoc.orderRequirement || {}),
          solutionSelection: { 
            ...formData, 
            activeSolutionKeys: formData.activeSolutionKeys || [],
            schoolWiseSolutions: formData.schoolWiseSolutions || {},
            solutions: formData.solutions || {},
            submittedBy: employee._id, 
            submittedAt: new Date() 
          }
        };
        reqDoc.markModified('orderRequirement');

        if (formData.activeSolutionKeys?.length > 0 || (formData.schoolWiseSolutions && Object.keys(formData.schoolWiseSolutions).length > 0) || (formData.solutions && Object.keys(formData.solutions).length > 0) || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }

        // Auto-assign Tech & Content Leads if selected by PM
        try {
          const project = await Project.findById(projectId);

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
        reqDoc.orderRequirement = {
          ...(reqDoc.orderRequirement || {}),
          hardwareRequirement: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
        };
        reqDoc.markModified('orderRequirement');

        // If Hardware Manager is assigned, auto-assign REQ_AND_STOCK_CHECK node & notify them
        try {
          const hwManagerId = formData.assignedHardwareManager || node.assignedTo;
          if (hwManagerId) {
            const project = await Project.findById(projectId);
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
          const stockData = formData.stockCheck || formData;
          const itemsMap = stockData.items || (typeof stockData === 'object' && !stockData.items ? stockData : {});
          const project = await Project.findById(projectId);
          let primaryPurchaseOfficer = formData.purchaseAssignedTo;

          for (const [itemKey, itemVal] of Object.entries(itemsMap)) {
            if (itemVal && itemVal.selected !== false) {
              const itemTitle = itemVal.itemName || itemKey;
              const mode = itemVal.stockDecision || 'IN_STOCK';
              const inStockCount = Number(itemVal.inStockQty) !== undefined ? Number(itemVal.inStockQty) : (mode === 'IN_STOCK' ? (Number(itemVal.quantity) || 1) : 0);
              const purchaseCount = Number(itemVal.purchaseQty) !== undefined ? Number(itemVal.purchaseQty) : (mode === 'PURCHASE_REQUIRED' ? (Number(itemVal.quantity) || 1) : 0);

              // 1. In-Stock Dispatch Assignee Notification
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

              // 2. Purchase Procurement Assignee Notification
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
        reqDoc.execution = {
          ...(reqDoc.execution || {}),
          hardware: {
            ...((reqDoc.execution && reqDoc.execution.hardware) || {}),
            purchaseIfNeeded: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
          }
        };
        reqDoc.markModified('execution');
      } else if (key === 'INTEGRATION_TESTING') {
        // Feedback & notification iteration for App, Dashboard and Content Testing Results
        try {
          const project = await Project.findById(projectId);
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
      } else if (key === 'INSTALLATION_EXECUTION' || key === 'INSTALLATION_PLANNING' || key === 'INSTALLATION_COMPLETED' || key === 'INSTALLATION') {
        reqDoc.installation = {
          ...(reqDoc.installation || {}),
          installationExecution: {
            ...formData,
            submittedBy: employee._id,
            submittedAt: new Date()
          }
        };
        reqDoc.markModified('installation');
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
          key: { $in: ['REQ_AND_STOCK_CHECK', 'PROJECT_CONFIG_AND_IMPLEMENTATION', 'CONTENT_CONFIGURATION'] }
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
        const project = timeline?.project || (projId ? await Project.findById(projId) : null);

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

  // Delete all nodes for a project's timeline and re-create from current config
  async resetTimelineForProject(projectId) {
    const project = await this._findProject(projectId);
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    let timeline = await Timeline.findOne({ project: project._id });
    if (!timeline) {
      return await this.initializeTimelineForProject(project._id, true);
    }

    // Delete all existing nodes
    await TimelineNode.deleteMany({ timeline: timeline._id });

    const pmId = project.projectManager;

    // Re-create from config with default PM assignment
    for (const stageDef of timelineConfig.stages) {
      const stageNode = await TimelineNode.create({
        timeline: timeline._id,
        parentNode: null,
        type: NODE_TYPES.STAGE,
        key: stageDef.key,
        name: stageDef.name,
        order: stageDef.order,
        status: NODE_STATUSES.PENDING,
        assignedTo: pmId || null,
        dependencies: stageDef.dependencies || [],
        metadata: stageDef.metadata || {}
      });

      if (stageDef.substages) {
        for (const subDef of stageDef.substages) {
          const subTaskNode = await TimelineNode.create({
            timeline: timeline._id,
            parentNode: stageNode._id,
            type: NODE_TYPES.TASK,
            key: subDef.key,
            name: subDef.name,
            order: subDef.order,
            status: NODE_STATUSES.PENDING,
            assignedTo: pmId || null,
            formSchema: subDef.formSchema || null,
            metadata: subDef.metadata || {}
          });

          if (subDef.nested) {
            for (const nestedDef of subDef.nested) {
              await TimelineNode.create({
                timeline: timeline._id,
                parentNode: subTaskNode._id,
                type: NODE_TYPES.TASK,
                key: nestedDef.key,
                name: nestedDef.name,
                order: nestedDef.order,
                status: NODE_STATUSES.PENDING,
                assignedTo: pmId || null,
                formSchema: nestedDef.formSchema || null,
                metadata: {
                  ...(nestedDef.metadata || {}),
                  supportsConditional: nestedDef.supportsConditional || false,
                  conditionalOnly: nestedDef.conditionalOnly || null
                }
              });
            }
          }
        }
      }
    }

    return await this.getTimelineHierarchy(projectId);
  }
}

module.exports = new TimelineService();
