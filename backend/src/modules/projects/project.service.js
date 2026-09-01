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
  async createProject(projectData, adminEmployeeId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const existing = await Project.findOne({ projectCode: projectData.projectCode }).session(session);
      if (existing) {
        throw new AppError('Project with this project code already exists.', 409, 'DUPLICATE_PROJECT_CODE');
      }

      const project = await Project.create([{
        ...projectData,
        createdBy: adminEmployeeId
      }], { session });

      const createdProject = project[0];

      // Assign PM as Project Member with designation PROJECT_MANAGER
      await ProjectMember.create([{
        project: createdProject._id,
        employee: createdProject.projectManager,
        designation: DESIGNATIONS.PROJECT_MANAGER,
        assignedBy: adminEmployeeId
      }], { session });

      // Notify PM
      if (createdProject.projectManager) {
        const Notification = require('../notifications/notifications.model');
        await Notification.create([{
          recipient: createdProject.projectManager,
          project: createdProject._id,
          title: 'Assigned as Project Manager',
          message: `You have been assigned as Project Manager for project ${createdProject.projectCode} (${createdProject.title}).`,
          type: 'ASSIGNMENT'
        }], { session });
      }

      // Initialize Timeline
      const timeline = await Timeline.create([{
        project: createdProject._id,
        templateVersion: timelineConfig.version,
        status: NODE_STATUSES.IN_PROGRESS
      }], { session });

      const createdTimeline = timeline[0];

      // Build Timeline Nodes recursively from config
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
                    supportsConditional: nestedDef.supportsConditional || false,
                    conditionalOnly: nestedDef.conditionalOnly || null
                  }
                }], { session });
              }
            }
          }
        }
      }

      // Log Activity
      await Activity.create([{
        project: createdProject._id,
        actor: adminEmployeeId,
        action: 'PROJECT_CREATED',
        resourceType: 'Project',
        resourceId: createdProject._id,
        metadata: { title: createdProject.title }
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return createdProject;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getAllProjects(employee, query = {}) {
    const filter = { archived: false };
    if (employee.globalRole !== 'ADMIN') {
      const memberships = await ProjectMember.find({ employee: employee._id, isActive: true }).select('project');
      const projectIds = memberships.map(m => m.project);
      filter._id = { $in: projectIds };
    }
    if (query.status) filter.status = query.status;
    return await Project.find(filter).populate('projectManager', 'name email employeeCode').sort({ createdAt: -1 });
  }

  async getProjectById(projectId) {
    const project = await Project.findById(projectId).populate('projectManager', 'name email employeeCode');
    if (!project) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    return project;
  }

  async updateProject(projectId, updateData, actorId) {
    const project = await Project.findByIdAndUpdate(projectId, updateData, { new: true, runValidators: true });
    if (!project) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    await Activity.create({
      project: project._id,
      actor: actorId,
      action: 'PROJECT_UPDATED',
      resourceType: 'Project',
      resourceId: project._id,
      metadata: updateData
    });

    return project;
  }

  async archiveProject(projectId, actorId) {
    const project = await Project.findByIdAndUpdate(projectId, { archived: true, status: PROJECT_STATUSES.ARCHIVED }, { new: true });
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
        message: `You have been added to project ${prj ? prj.projectCode : ''} (${prj ? prj.title : ''}) as ${designation}.`,
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
