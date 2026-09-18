const Project = require('./project.model');
const ProjectMember = require('./project-member.model');
const Timeline = require('../timeline/timeline.model');
const TimelineNode = require('../timeline/timeline-node.model');
const Activity = require('../activity/activity.model');
const timelineConfig = require('../../config/timeline');
const { DESIGNATIONS, PROJECT_STATUSES, NODE_TYPES, NODE_STATUSES } = require('../../core/constants');
const { AppError } = require('../../core/errors');
const mongoose = require('mongoose');

class ProjectService {
  async createProject(projectData, creatorEmployeeId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const code = (projectData.projectId || '').trim().toUpperCase();
      const name = (projectData.projectName || projectData.title || '').trim();

      const existing = await Project.findOne({ projectId: code }).session(session);

      if (existing) {
        throw new AppError('Project with this project ID already exists.', 409, 'DUPLICATE_PROJECT_ID');
      }

      const normalizedData = {
        ...projectData,
        projectId: code,
        projectName: name
      };

      const Employee = require('../employees/employee.model');
      const Notification = require('../notifications/notifications.model');
      const creator = await Employee.findById(creatorEmployeeId).session(session);

      const assignedReviewerId = projectData.assignedTo || projectData.assignedReviewer || projectData.projectManager;

      // If an assignee / reviewer is specified, place into PENDING_REVIEW workflow
      if (assignedReviewerId) {
        const project = await Project.create([{
          ...normalizedData,
          projectManager: projectData.projectManager || undefined,
          requestedBy: creatorEmployeeId,
          assignedReviewer: assignedReviewerId,
          status: PROJECT_STATUSES.PENDING_REVIEW,
          reviewStatus: 'PENDING',
          createdBy: creatorEmployeeId
        }], { session });

        const createdProject = project[0];

        // Notify assigned reviewer
        await Notification.create([{
          recipient: assignedReviewerId,
          project: createdProject._id,
          title: 'New Project Request Received',
          message: `${creator ? creator.name : 'A team member'} has submitted a new project request: ${createdProject.projectId} (${createdProject.projectName}) and assigned you to review it.`,
          type: 'PROJECT_REQUEST_REVIEW',
          metadata: {
            projectId: createdProject.projectId,
            projectDatabaseId: createdProject._id,
            projectName: createdProject.projectName,
            requesterId: creator ? creator._id : creatorEmployeeId,
            requesterName: creator ? creator.name : 'Employee'
          }
        }], { session });

        // Notify Admins
        if (!creator || creator.globalRole !== 'ADMIN') {
          const admins = await Employee.find({ globalRole: 'ADMIN', isActive: true }).session(session);
          for (const admin of admins) {
            if (admin._id.toString() !== assignedReviewerId.toString()) {
              await Notification.create([{
                recipient: admin._id,
                project: createdProject._id,
                title: 'New Project Request Received',
                message: `${creator ? creator.name : 'Employee'} (${creator ? creator.employeeCode : ''}) submitted a project request: ${createdProject.projectId} (${createdProject.projectName}).`,
                type: 'GENERAL',
                metadata: { projectId: createdProject._id }
              }], { session });
            }
          }
        }

        // Log activity for project request submission
        await Activity.create([{
          project: createdProject._id,
          actor: creatorEmployeeId,
          action: 'PROJECT_REQUEST_SUBMITTED',
          resourceType: 'Project',
          resourceId: createdProject._id,
          metadata: {
            projectId: createdProject.projectId,
            projectName: createdProject.projectName,
            assignedReviewer: assignedReviewerId
          }
        }], { session });

        await session.commitTransaction();
        session.endSession();
        return createdProject;
      }

      // Direct Creation without Reviewer
      const project = await Project.create([{
        ...normalizedData,
        projectManager: creatorEmployeeId,
        createdBy: creatorEmployeeId,
        status: PROJECT_STATUSES.ACTIVE,
        reviewStatus: 'APPROVED',
        reviewedAt: new Date()
      }], { session });

      const createdProject = project[0];

      await ProjectMember.create([{
        project: createdProject._id,
        employee: creatorEmployeeId,
        designation: DESIGNATIONS.PROJECT_MANAGER,
        assignedBy: creatorEmployeeId
      }], { session });

      await this._initializeProjectTimeline(createdProject._id, session);

      // Log activity for direct project creation
      await Activity.create([{
        project: createdProject._id,
        actor: creatorEmployeeId,
        action: 'PROJECT_CREATED',
        resourceType: 'Project',
        resourceId: createdProject._id,
        metadata: {
          projectId: createdProject.projectId,
          projectName: createdProject.projectName,
          organization: createdProject.organization || createdProject.client || ''
        }
      }], { session });

      // Sync to Dashboard auditlogs collection
      try {
        await mongoose.connection.collection('auditlogs').insertOne({
          orgId: createdProject.orgId || new mongoose.Types.ObjectId(),
          actorId: creatorEmployeeId,
          actorEmail: creator ? creator.email : 'admin@digitopper.com',
          action: 'projects:create',
          resource: 'Project',
          resourceId: String(createdProject._id),
          delta: {
            projectName: createdProject.projectName,
            projectId: createdProject.projectId,
            organization: createdProject.organization || createdProject.client || ''
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (_) {}

      await session.commitTransaction();
      session.endSession();
      return createdProject;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async _initializeProjectTimeline(projectId, session) {
    const timeline = await Timeline.create([{
      project: projectId,
      templateVersion: timelineConfig.version,
      status: NODE_STATUSES.IN_PROGRESS
    }], { session });

    const createdTimeline = timeline[0];

    for (const stageDef of timelineConfig.stages) {
      const stageNode = await TimelineNode.create([{
        timeline: createdTimeline._id,
        parentNode: null,
        type: NODE_TYPES.STAGE,
        key: stageDef.key,
        name: stageDef.name,
        order: stageDef.order,
        status: NODE_STATUSES.PENDING,
        dependencies: stageDef.dependencies || [],
        metadata: stageDef.metadata || {}
      }], { session });

      const createdStage = stageNode[0];

      if (stageDef.substages) {
        for (const subDef of stageDef.substages) {
          const subTaskNode = await TimelineNode.create([{
            timeline: createdTimeline._id,
            parentNode: createdStage._id,
            type: NODE_TYPES.TASK,
            key: subDef.key,
            name: subDef.name,
            order: subDef.order,
            status: NODE_STATUSES.PENDING,
            formSchema: subDef.formSchema || null,
            metadata: subDef.metadata || {}
          }], { session });

          const createdSub = subTaskNode[0];

          if (subDef.nested) {
            for (const nestedDef of subDef.nested) {
              await TimelineNode.create([{
                timeline: createdTimeline._id,
                parentNode: createdSub._id,
                type: NODE_TYPES.TASK,
                key: nestedDef.key,
                name: nestedDef.name,
                order: nestedDef.order,
                status: NODE_STATUSES.PENDING,
                formSchema: nestedDef.formSchema || null,
                metadata: {
                  ...(nestedDef.metadata || {}),
                  customFields: nestedDef.customFields || []
                }
              }], { session });
            }
          }
        }
      }
    }
  }

  async approveProjectRequest(projectId, reviewerEmployeeId, reviewNotes) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const project = await Project.findById(projectId).session(session);
      if (!project) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

      if (project.status !== PROJECT_STATUSES.PENDING_REVIEW && project.reviewStatus === 'APPROVED') {
        throw new AppError('Project request has already been approved.', 400, 'ALREADY_APPROVED');
      }

      const Employee = require('../employees/employee.model');
      const reviewer = await Employee.findById(reviewerEmployeeId).session(session);
      const isAuthorized = 
        (reviewer && reviewer.globalRole === 'ADMIN') ||
        (project.assignedReviewer && project.assignedReviewer.toString() === reviewerEmployeeId.toString());

      if (!isAuthorized) {
        throw new AppError('You are not authorized to review and approve this project request.', 403, 'FORBIDDEN');
      }

      // Appoint the designated PM (or reviewer) as Project Manager
      const designatedPmId = project.projectManager || project.assignedReviewer || reviewerEmployeeId;
      const requesterId = project.requestedBy || project.createdBy || reviewerEmployeeId;

      // Update project status to ACTIVE and appoint the designated PM as Project Manager
      project.status = PROJECT_STATUSES.ACTIVE;
      project.reviewStatus = 'APPROVED';
      project.reviewedAt = new Date();
      project.reviewNotes = reviewNotes || 'Review completed and approved';
      project.projectManager = designatedPmId;
      await project.save({ session });

      // 1. Assign Designated PM as Project Manager
      await ProjectMember.findOneAndUpdate(
        { project: project._id, employee: designatedPmId },
        {
          project: project._id,
          employee: designatedPmId,
          designation: DESIGNATIONS.PROJECT_MANAGER,
          assignedBy: reviewerEmployeeId,
          isActive: true
        },
        { upsert: true, new: true, session }
      );

      // 2. Assign Requester as Contributor (if requester is not the PM)
      if (requesterId.toString() !== designatedPmId.toString()) {
        await ProjectMember.findOneAndUpdate(
          { project: project._id, employee: requesterId },
          {
            project: project._id,
            employee: requesterId,
            designation: DESIGNATIONS.CONTRIBUTOR,
            assignedBy: reviewerEmployeeId,
            isActive: true
          },
          { upsert: true, new: true, session }
        );
      }

      // 3. Assign Reviewer as Contributor (if reviewer is neither PM nor Requester)
      if (
        reviewerEmployeeId.toString() !== designatedPmId.toString() &&
        reviewerEmployeeId.toString() !== requesterId.toString()
      ) {
        await ProjectMember.findOneAndUpdate(
          { project: project._id, employee: reviewerEmployeeId },
          {
            project: project._id,
            employee: reviewerEmployeeId,
            designation: DESIGNATIONS.CONTRIBUTOR,
            assignedBy: reviewerEmployeeId,
            isActive: true
          },
          { upsert: true, new: true, session }
        );
      }

      // Initialize project timeline if not already created
      const existingTimeline = await Timeline.findOne({ project: project._id }).session(session);
      if (!existingTimeline) {
        await this._initializeProjectTimeline(project._id, session);
      }

      // Notifications
      const Notification = require('../notifications/notifications.model');
      
      // Notify the Designated Project Manager
      await Notification.create([{
        recipient: designatedPmId,
        project: project._id,
        title: 'Assigned as Project Manager',
        message: `You have been assigned as the Project Manager for project ${project.projectId} (${project.projectName}), approved by ${reviewer ? reviewer.name : 'Reviewer'}.`,
        type: 'ASSIGNMENT',
        metadata: {
          projectId: project.projectId,
          projectDatabaseId: project._id,
          projectName: project.projectName,
          reviewerName: reviewer ? reviewer.name : 'Reviewer'
        }
      }], { session });

      // Notify the Requester (if different from PM)
      if (requesterId.toString() !== designatedPmId.toString()) {
        await Notification.create([{
          recipient: requesterId,
          project: project._id,
          title: 'Project Request Approved & Initialized',
          message: `Your project request for ${project.projectId} (${project.projectName}) has been approved by ${reviewer ? reviewer.name : 'Reviewer'}.`,
          type: 'PROJECT_REQUEST_APPROVED',
          metadata: {
            projectId: project.projectId,
            projectDatabaseId: project._id,
            projectName: project.projectName,
            reviewerName: reviewer ? reviewer.name : 'Reviewer'
          }
        }], { session });
      }

      // Notify Admins
      const admins = await Employee.find({ globalRole: 'ADMIN', isActive: true }).session(session);
      for (const admin of admins) {
        if (admin._id.toString() !== reviewerEmployeeId.toString() && admin._id.toString() !== requesterId.toString()) {
          await Notification.create([{
            recipient: admin._id,
            project: project._id,
            title: 'Project Request Approved',
            message: `Project ${project.projectId} (${project.projectName}) was approved by ${reviewer ? reviewer.name : 'Reviewer'} and is now active.`,
            type: 'GENERAL',
            metadata: { projectId: project._id }
          }], { session });
        }
      }

      await Activity.create([{
        project: project._id,
        actor: reviewerEmployeeId,
        action: 'PROJECT_REQUEST_APPROVED',
        resourceType: 'Project',
        resourceId: project._id,
        metadata: {
          projectManager: requesterId,
          reviewer: reviewerEmployeeId,
          reviewNotes
        }
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return project;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getAllProjects(employee, query = {}) {
    const filter = { isActive: true };
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    // Role-based scoping: If employee is not ADMIN (or query.assignedOnly === 'true'),
    // restrict projects to those where employee is PM, member, or has assigned task nodes
    if ((employee && employee.globalRole !== 'ADMIN') || query.assignedOnly === 'true') {
      const empId = employee ? employee._id : null;
      if (empId) {
        // 1. Find projects from ProjectMember table
        const memberships = await ProjectMember.find({ employee: empId, isActive: true }).select('project');
        const memberProjectIds = memberships.map(m => m.project ? m.project.toString() : '').filter(Boolean);

        // 2. Find projects where user has assigned tasks in TimelineNode
        const assignedNodes = await TimelineNode.find({ assignedTo: empId }).select('timeline');
        const timelineIds = assignedNodes.map(n => n.timeline).filter(Boolean);
        const timelines = await Timeline.find({ _id: { $in: timelineIds } }).select('project');
        const timelineProjectIds = timelines.map(t => t.project ? t.project.toString() : '').filter(Boolean);

        const allProjectIds = [...new Set([...memberProjectIds, ...timelineProjectIds])];
        filter._id = { $in: allProjectIds };
      }
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();
    if (!projects || projects.length === 0) return [];

    const projectIds = projects.map(p => p._id);
    const pmMembers = await ProjectMember.find({
      project: { $in: projectIds },
      designation: DESIGNATIONS.PROJECT_MANAGER,
      isActive: true
    }).populate('employee', 'name email employeeCode globalRole');

    const pmMap = new Map();
    pmMembers.forEach(m => {
      if (m.employee) {
        pmMap.set(m.project.toString(), m.employee);
      }
    });

    return projects.map(p => ({
      ...p,
      title: p.projectName || p.title,
      projectManager: pmMap.get(p._id.toString()) || null
    }));
  }

  async getPendingReviews(employeeId, isAdmin) {
    const filter = {
      isActive: true
    };
    const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();
    return projects.map(p => ({
      ...p,
      title: p.projectName || p.title
    }));
  }

  async getProjectById(projectId) {
    const project = await Project.findById(projectId).lean();
    if (!project) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    const pmMember = await ProjectMember.findOne({
      project: projectId,
      designation: DESIGNATIONS.PROJECT_MANAGER,
      isActive: true
    }).populate('employee', 'name email employeeCode globalRole');

    project.title = project.projectName || project.title;
    project.projectManager = pmMember && pmMember.employee ? pmMember.employee : null;
    return project;
  }

  async updateProject(projectId, updateData, actorId) {
    const data = { ...updateData };
    if (data.projectId) data.projectId = data.projectId.toUpperCase();

    const project = await Project.findByIdAndUpdate(projectId, data, { new: true, runValidators: true });
    if (!project) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    await Activity.create({
      project: project._id,
      actor: actorId,
      action: 'PROJECT_UPDATED',
      resourceType: 'Project',
      resourceId: project._id,
      metadata: data
    });

    if (data.status) {
      try {
        const notificationService = require('../notifications/notifications.service');
        await notificationService.notifyWithAdminsAndPMs({
          projectId: project._id,
          title: `Project Status Changed: ${data.status}`,
          message: `Project ${project.projectId} (${project.projectName || project.title}) status was updated to ${data.status}.`,
          type: 'STATUS_UPDATE',
          metadata: {
            projectId: project.projectId,
            projectName: project.projectName || project.title,
            newStatus: data.status
          },
          excludeUserIds: [actorId]
        });
      } catch (notifErr) {
        console.error('Project status notification note:', notifErr.message);
      }
    }

    return project;
  }

  async archiveProject(projectId, actorId) {
    const project = await Project.findByIdAndUpdate(projectId, { isActive: false, status: PROJECT_STATUSES.ARCHIVED }, { new: true });
    if (!project) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    await Activity.create({
      project: project._id,
      actor: actorId,
      action: 'PROJECT_ARCHIVED',
      resourceType: 'Project',
      resourceId: project._id
    });

    return project;
  }

  async getMembers(projectId) {
    return await ProjectMember.find({ project: projectId, isActive: true }).populate('employee', 'name email employeeCode globalRole');
  }

  async addOrUpdateMember(projectId, employeeId, designation, actorId) {
    let member = await ProjectMember.findOne({ project: projectId, employee: employeeId });
    if (member) {
      member.designation = designation;
      member.isActive = true;
      await member.save();
    } else {
      member = await ProjectMember.create({
        project: projectId,
        employee: employeeId,
        designation,
        assignedBy: actorId
      });
    }

    await Activity.create({
      project: projectId,
      actor: actorId,
      action: 'CONTRIBUTOR_ASSIGNED',
      resourceType: 'ProjectMember',
      resourceId: member._id,
      metadata: { employeeId, designation }
    });

    try {
      const Notification = require('../notifications/notifications.model');
      const prj = await Project.findById(projectId);
      await Notification.create({
        recipient: employeeId,
        project: projectId,
        title: `Project Assignment: ${designation}`,
        message: `You have been added to project ${prj ? prj.projectId : ''} (${prj ? prj.projectName : ''}) as ${designation}.`,
        type: 'ASSIGNMENT'
      });
    } catch {}

    return member;
  }

  async removeMember(projectId, employeeId, actorId) {
    const member = await ProjectMember.findOneAndUpdate({ project: projectId, employee: employeeId }, { isActive: false }, { new: true });
    if (!member) throw new AppError('Project member not found.', 404, 'MEMBER_NOT_FOUND');

    await Activity.create({
      project: projectId,
      actor: actorId,
      action: 'CONTRIBUTOR_REMOVED',
      resourceType: 'ProjectMember',
      resourceId: member._id,
      metadata: { employeeId }
    });

    return member;
  }
}

module.exports = new ProjectService();
