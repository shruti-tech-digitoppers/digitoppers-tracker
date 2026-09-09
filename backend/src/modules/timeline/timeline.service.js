const Timeline = require('./timeline.model');
const TimelineNode = require('./timeline-node.model');
const Activity = require('../activity/activity.model');
const Notification = require('../notifications/notifications.model');
const Project = require('../projects/project.model');
const timelineConfig = require('../../config/timeline');
const { NODE_STATUSES, NODE_TYPES, GLOBAL_ROLES, DESIGNATIONS } = require('../../core/constants');
const { AppError } = require('../../core/errors');

class TimelineService {
  async initializeTimelineForProject(projectId) {
    let timeline = await Timeline.findOne({ project: projectId });
    if (!timeline) {
      timeline = await Timeline.create({
        project: projectId,
        templateVersion: timelineConfig.version || 'v1',
        status: NODE_STATUSES.IN_PROGRESS
      });
    }

    const existingCount = await TimelineNode.countDocuments({ timeline: timeline._id });
    if (existingCount === 0) {
      for (const stageDef of timelineConfig.stages) {
        const stageNode = await TimelineNode.create({
          timeline: timeline._id,
          parentNode: null,
          type: NODE_TYPES.STAGE,
          key: stageDef.key,
          name: stageDef.name,
          order: stageDef.order,
          status: NODE_STATUSES.PENDING,
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
    let timeline = await Timeline.findOne({ project: projectId });
    if (!timeline) {
      timeline = await this.initializeTimelineForProject(projectId);
    }

    let nodes = await TimelineNode.find({ timeline: timeline._id })
      .populate('assignedTo', 'name email employeeCode')
      .sort({ order: 1 });

    if (nodes.length === 0) {
      await this.initializeTimelineForProject(projectId);
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

    // Build hierarchical tree
    const nodeMap = {};
    nodes.forEach(node => {
      const obj = node.toObject();
      if (schemaMap[node.key]) {
        obj.formSchema = schemaMap[node.key];
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

    return { timeline, structure: tree };
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
    await node.save();

    // If assigned on PO Upload or PO & PI stage, automatically assign same contributor to PI Request and PI Upload
    const isPoPiNode = ['PO_UPLOAD', 'PO_AND_PI', 'PI_REQUEST', 'PI_UPLOAD'].includes(node.key);
    if (isPoPiNode) {
      const timeline = await Timeline.findOne({ project: projectId });
      if (timeline) {
        await TimelineNode.updateMany(
          {
            timeline: timeline._id,
            key: { $in: ['PO_UPLOAD', 'PI_REQUEST', 'PI_UPLOAD', 'PO_AND_PI'] }
          },
          { assignedTo: employeeId }
        );
      }
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
        const title = isPoPiNode ? `Task Assigned: PO Upload & PI Workflow` : `Task Assigned: ${node.name}`;
        const message = isPoPiNode
          ? `You have been assigned to handle PO Upload and PI tasks in project ${project ? project.projectCode : ''} (${project ? project.title : ''}).`
          : `You have been assigned to "${node.name}" in project ${project ? project.projectCode : ''} (${project ? project.title : ''}).`;

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

    // Check Dependency Gate for Stage 07 (TECH + CONTENT TESTING requires Tech Ready & Content Ready)
    if (node.key === 'TESTING_PREPARATION' && newStatus === NODE_STATUSES.IN_PROGRESS) {
      const timeline = await Timeline.findOne({ project: projectId });
      const techReady = await TimelineNode.findOne({ timeline: timeline._id, key: 'TECH_READY' });
      const contentReady = await TimelineNode.findOne({ timeline: timeline._id, key: 'CONTENT_READY' });

      if ((techReady && techReady.status !== NODE_STATUSES.COMPLETED) || (contentReady && contentReady.status !== NODE_STATUSES.COMPLETED)) {
        throw new AppError('Dependency Gate Failure: Both Tech Ready and Content Ready must be COMPLETED before testing can start.', 422, 'DEPENDENCY_GATE_FAILED');
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
        if (formData.confirmed === 'YES' || formData.pmReviewStatus === 'APPROVED' || formData.autoComplete === true) {
          node.status = NODE_STATUSES.COMPLETED;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        } else if (formData.confirmed === 'NO' || formData.pmReviewStatus === 'REJECTED') {
          node.status = NODE_STATUSES.ON_HOLD;
          await node.save();
          if (node.parentNode) {
            await this.recalculateStageStatus(node.parentNode);
          }
        }
      } else if (key === 'PO_UPLOAD') {
        reqDoc.poAndPi = {
          ...(reqDoc.poAndPi || {}),
          poUpload: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
        };
        reqDoc.markModified('poAndPi');
      } else if (key === 'PI_REQUEST') {
        reqDoc.poAndPi = {
          ...(reqDoc.poAndPi || {}),
          piRequest: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
        };
        reqDoc.markModified('poAndPi');
      } else if (key === 'PI_UPLOAD') {
        reqDoc.poAndPi = {
          ...(reqDoc.poAndPi || {}),
          piUpload: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
        };
        reqDoc.markModified('poAndPi');
      } else if (key === 'SCHOOL_ONBOARDING_INFORMATION') {
        reqDoc.orderRequirement = {
          ...(reqDoc.orderRequirement || {}),
          schoolInformation: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
        };
        reqDoc.markModified('orderRequirement');
      } else if (key === 'SOLUTION_SELECTION') {
        reqDoc.orderRequirement = {
          ...(reqDoc.orderRequirement || {}),
          solutionSelection: { ...formData, submittedBy: employee._id, submittedAt: new Date() }
        };
        reqDoc.markModified('orderRequirement');

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
              message: `You have been assigned as Tech Lead for project ${project ? project.projectCode : ''} (${project ? project.title : ''}). Please proceed with app configuration and testing.`,
              type: 'ASSIGNMENT',
              metadata: {
                projectId: projectId.toString(),
                projectCode: project?.projectCode,
                projectTitle: project?.title,
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
              message: `You have been assigned as Content Lead for project ${project ? project.projectCode : ''} (${project ? project.title : ''}). Please configure boards, languages, classes and verification sheets.`,
              type: 'ASSIGNMENT',
              metadata: {
                projectId: projectId.toString(),
                projectCode: project?.projectCode,
                projectTitle: project?.title,
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
              message: `You have been assigned as Hardware Lead for project ${project ? project.projectCode : ''} (${project ? project.title : ''}). Please review equipment requirements and verify warehouse stock.`,
              type: 'ASSIGNMENT',
              metadata: {
                projectId: projectId.toString(),
                projectCode: project?.projectCode,
                projectTitle: project?.title,
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
                  message: `You have been assigned to dispatch ${inStockCount} units of "${itemTitle}" from warehouse stock for project ${project ? project.projectCode : ''} (${project ? project.title : ''}).`,
                  type: 'ASSIGNMENT',
                  metadata: {
                    projectId: projectId.toString(),
                    projectCode: project?.projectCode,
                    projectTitle: project?.title,
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
                  message: `You have been assigned to procure ${purchaseCount} units of "${itemTitle}" from vendor for project ${project ? project.projectCode : ''} (${project ? project.title : ''}).`,
                  type: 'ASSIGNMENT',
                  metadata: {
                    projectId: projectId.toString(),
                    projectCode: project?.projectCode,
                    projectTitle: project?.title,
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
                  message: `QA reported issues in "${s.label}" for project ${project?.projectCode || ''} (${project?.title || ''}). Feedback: "${remarks || 'Please review test sheet'}". Test Sheet: ${sheetUrl || 'N/A'}`,
                  type: 'ASSIGNMENT',
                  metadata: {
                    projectId: projectId.toString(),
                    projectCode: project?.projectCode,
                    projectTitle: project?.title,
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

    // Recursively walk up to the grandparent if this was a substage
    if (parentNode.parentNode) {
      await this.recalculateStageStatus(parentNode.parentNode);
    }
  }

  // Delete all nodes for a project's timeline and re-create from current config
  async resetTimelineForProject(projectId) {
    let timeline = await Timeline.findOne({ project: projectId });
    if (!timeline) {
      return await this.initializeTimelineForProject(projectId);
    }

    // Delete all existing nodes
    await TimelineNode.deleteMany({ timeline: timeline._id });

    // Re-create from config
    for (const stageDef of timelineConfig.stages) {
      const stageNode = await TimelineNode.create({
        timeline: timeline._id,
        parentNode: null,
        type: NODE_TYPES.STAGE,
        key: stageDef.key,
        name: stageDef.name,
        order: stageDef.order,
        status: NODE_STATUSES.PENDING,
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
