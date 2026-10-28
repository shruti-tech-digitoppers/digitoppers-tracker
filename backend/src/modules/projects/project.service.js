const ProjectMember = require('../project-members/project-member.model');
const Timeline = require('../timeline/timeline.model');
const TimelineNode = require('../timeline/timeline-node.model');
const Activity = require('../activity/activity.model');
const Employee = require('../employees/employee.model');
const ProjectRequest = require('../project-requests/project-request.model');
const { DESIGNATIONS, PROJECT_STATUSES } = require('../../core/constants');
const { AppError } = require('../../core/errors');
const config = require('../../config/env');
const coreApi = require('../../services/core-api.service');
const mongoose = require('mongoose');

const initializedProjectTimelines = new Set();

class ProjectService {
  /**
   * getProjects: Fetches projects strictly from Core Backend API (Single Source of Truth)
   * Enriches each project with Tracker metadata (PM, members, schools, timeline)
   */
  async getProjects(employee, query = {}) {
    // 1. Fetch live projects strictly from Core Backend API
    let coreProjects = [];
    try {
      const rawList = await coreApi.getProjects();
      if (Array.isArray(rawList)) {
        coreProjects = rawList.filter(p => p.isActive !== false);
      }
    } catch (e) {
      console.warn('[ProjectService] coreApi.getProjects warning:', e.message);
    }

    if (!coreProjects || coreProjects.length === 0) {
      return [];
    }

    // Map Core Backend projects into canonical Tracker format
    const allProjectsList = coreProjects.map(cp => {
      const code = (cp.projectId || String(cp._id)).toUpperCase();
      const cpIdStr = String(cp._id);

      return {
        _id: cpIdStr,
        coreMongoId: cpIdStr,
        projectId: code,
        projectName: cp.projectName || cp.title || 'Core Project',
        title: cp.projectName || cp.title || 'Core Project',
        organization: cp.organization || cp.projectName || cp.client || 'Direct Organization',
        email: cp.email || '',
        phone: cp.phone || '',
        address: cp.address || '',
        numberOfSchools: cp.numberOfSchools || 0,
        numberOfLicenses: cp.numberOfLicenses || 0,
        budget: cp.budget || 0,
        country: typeof cp.country === 'object' && cp.country ? cp.country.name : (cp.country || ''),
        status: cp.status || 'ACTIVE',
        projectManager: null,
        isActive: cp.isActive !== false,
        clientPoAndPi: cp.clientPoAndPi || { purchaseOrders: [], proformaInvoices: [] },
        createdAt: cp.createdAt || new Date(),
        updatedAt: cp.updatedAt || new Date(),
        source: 'CORE_BACKEND'
      };
    });

    // Automatically ensure timeline is created for newly discovered projects
    const timelineService = require('../timeline/timeline.service');
    for (const cp of allProjectsList) {
      if (!initializedProjectTimelines.has(cp.projectId)) {
        initializedProjectTimelines.add(cp.projectId);
        timelineService.createTimelineForProject(cp).catch((e) => {
          initializedProjectTimelines.delete(cp.projectId);
          console.warn(`[ProjectService] Auto-init timeline for ${cp.projectId}:`, e.message);
        });
      }
    }

    // Fetch members for all projects in bulk using both projectId codes and Mongo IDs
    const allProjectCodes = allProjectsList.map(p => p.projectId).filter(Boolean);
    const allProjectMongoIds = allProjectsList
      .map(p => p._id)
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const allMembers = await ProjectMember.find({
      $or: [
        { projectId: { $in: allProjectCodes } },
        { project: { $in: [...allProjectMongoIds, ...allProjectCodes] } }
      ],
      isActive: true
    }).populate('employee', 'name email employeeCode globalRole designation phone department departmentCode').lean().catch(() => []);

    const membersMap = new Map();
    allMembers.forEach(m => {
      const pCode = (m.projectId || String(m.project || '')).toUpperCase();
      const pId = String(m.project || '');

      const keys = [pCode, pId].filter(Boolean);
      for (const k of keys) {
        if (!membersMap.has(k)) membersMap.set(k, []);
        if (m.employee) {
          membersMap.get(k).push({
            ...m.employee,
            projectRole: m.designation
          });
        }
      }
    });

    // Merge PM and members into each project
    let mergedProjects = allProjectsList.map(p => {
      const pIdStr = String(p._id);
      const pCode = (p.projectId || '').toUpperCase();
      const members = membersMap.get(pCode) || membersMap.get(pIdStr) || [];
      const assignedPm = p.projectManager || members.find(m => m.projectRole === DESIGNATIONS.PROJECT_MANAGER) || null;

      return {
        ...p,
        projectManager: assignedPm,
        members
      };
    });

    // Filter by search query if provided
    if (query.search) {
      const s = String(query.search).trim().toLowerCase();
      mergedProjects = mergedProjects.filter(p =>
        (p.projectId && p.projectId.toLowerCase().includes(s)) ||
        (p.projectName && p.projectName.toLowerCase().includes(s)) ||
        (p.organization && p.organization.toLowerCase().includes(s)) ||
        (p.email && p.email.toLowerCase().includes(s))
      );
    }

    // Filter by status if requested
    if (query.status && query.status !== 'ALL') {
      mergedProjects = mergedProjects.filter(p => p.status === query.status);
    }

    // Filter assignedOnly if requested
    if (query.assignedOnly === 'true') {
      const empId = employee ? String(employee._id) : null;
      if (empId) {
        mergedProjects = mergedProjects.filter(p => {
          const isPm = p.projectManager && (String(p.projectManager._id || p.projectManager) === empId);
          const isMember = p.members && p.members.some(m => String(m._id || m.employee) === empId);
          return isPm || isMember;
        });
      }
    }

    return mergedProjects;
  }

  /**
   * Alias for backward compatibility
   */
  async getAllProjects(employee, query = {}) {
    return this.getProjects(employee, query);
  }

  async getProjectById(projectId) {
    const projectDoc = await this._findProject(projectId);
    if (!projectDoc) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    const project = projectDoc.toObject ? projectDoc.toObject() : { ...projectDoc };

    const code = (project.projectId || '').toUpperCase();
    const rawId = project._id;

    const pmMember = await ProjectMember.findOne({
      $or: [
        { projectId: code },
        { project: rawId },
        { project: project._id }
      ].filter(Boolean),
      designation: DESIGNATIONS.PROJECT_MANAGER,
      isActive: true
    }).populate('employee', 'name email employeeCode globalRole designation');

    let pm = (pmMember && pmMember.employee) ? pmMember.employee : (project.projectManager || null);
    if (!pm) {
      const ProjectRequest = require('../project-requests/project-request.model');
      const reqDoc = await ProjectRequest.findOne({
        $or: [
          { dashboardProjectId: code },
          { projectId: rawId },
          { title: project.projectName }
        ].filter(Boolean)
      }).populate('projectManager', 'name email employeeCode globalRole designation');
      if (reqDoc && reqDoc.projectManager) {
        pm = reqDoc.projectManager;
      }
    }

    project.title = project.projectName || project.title;
    project.projectManager = pm || null;

    try {
      const School = require('../schools/school.model');
      const ProjectSchools = require('../project-schools/project-schools.model');
      const [dbSchools, psDoc] = await Promise.all([
        School.find({
          $or: [
            { projectId: code },
            { projectId: String(rawId) },
            { projectId: rawId }
          ].filter(Boolean),
          isActive: true
        })
          .populate('installation.assignedEngineerId', 'name email phone')
          .populate('training.assignedTrainerId', 'name email phone')
          .lean()
          .catch(() => []),
        ProjectSchools.findOne({
          $or: [
            { projectId: code },
            { projectId: String(rawId) },
            { project: rawId }
          ].filter(Boolean)
        }).lean().catch(() => null)
      ]);

      let formattedSchools = [];
      if (dbSchools && dbSchools.length > 0) {
        formattedSchools = dbSchools.map((s) => ({
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
      } else if (psDoc?.schools && psDoc.schools.length > 0) {
        formattedSchools = psDoc.schools.map((ps) => ({
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

      project.schools = formattedSchools;
      if (formattedSchools.length > 0 && (!project.numberOfSchools || project.numberOfSchools === 0)) {
        project.numberOfSchools = formattedSchools.length;
      }
      if (psDoc) {
        project.projectSchools = psDoc;
      }
    } catch (e) {
      console.warn('Could not populate schools for project in getProjectById:', e.message);
    }

    return project;
  }

  async updateProject(projectId, updateData, actorId) {
    const projectDoc = await this._findProject(projectId);
    if (!projectDoc) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    const data = { ...updateData };
    if (data.projectId) data.projectId = data.projectId.toUpperCase();

    const project = { ...projectDoc, ...data };
    const code = (project.projectId || '').toUpperCase();
    const rawId = project._id;

    await Activity.create({
      projectId: code,
      project: rawId,
      actor: actorId,
      action: 'PROJECT_UPDATED',
      resourceType: 'Project',
      resourceId: rawId,
      metadata: data
    });

    if (data.status) {
      try {
        const notificationService = require('../notifications/notifications.service');
        await notificationService.notifyWithAdminsAndPMs({
          projectId: code,
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
    const projectDoc = await this._findProject(projectId);
    if (!projectDoc) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    const project = { ...projectDoc, isActive: false, status: PROJECT_STATUSES.ARCHIVED };
    const code = (project.projectId || '').toUpperCase();
    const rawId = project._id;

    await Activity.create({
      projectId: code,
      project: rawId,
      actor: actorId,
      action: 'PROJECT_ARCHIVED',
      resourceType: 'Project',
      resourceId: rawId
    });

    return project;
  }

  async _findProject(projectId) {
    if (!projectId) return null;
    const idStr = String(projectId).trim();

    // 1. Fetch live project strictly by ID or Code from Core Backend API
    let coreP = null;
    try {
      coreP = await coreApi.getProjectById(idStr);
    } catch (e) {
      console.warn('[ProjectService] _findProject Core API check error:', e.message);
    }

    if (coreP) {
      const code = String(coreP.projectId || idStr).toUpperCase();
      const rawId = String(coreP._id || idStr);

      const resolvedP = {
        _id: rawId,
        coreMongoId: rawId,
        projectId: code,
        projectName: coreP.projectName || coreP.title || 'Core Project',
        title: coreP.projectName || coreP.title || 'Core Project',
        organization: coreP.organization || coreP.projectName || coreP.client || 'Direct Organization',
        email: coreP.email || '',
        phone: coreP.phone || '',
        address: coreP.address || '',
        numberOfSchools: coreP.numberOfSchools || 0,
        numberOfLicenses: coreP.numberOfLicenses || 0,
        country: typeof coreP.country === 'object' && coreP.country ? coreP.country.name : (coreP.country || ''),
        status: coreP.status || 'ACTIVE',
        isActive: coreP.isActive !== false,
        budget: coreP.budget || 0,
        clientPoAndPi: coreP.clientPoAndPi || { purchaseOrders: [], proformaInvoices: [] },
        source: 'CORE_BACKEND'
      };

      try {
        const timelineService = require('../timeline/timeline.service');
        timelineService.createTimelineForProject(resolvedP).catch(() => {});
      } catch (_) {}

      return resolvedP;
    }

    // 2. If a pending/approved ProjectRequest ID was passed, resolve strictly via its Core Project reference
    try {
      const ProjectRequest = require('../project-requests/project-request.model');
      const isObjectId = mongoose.isValidObjectId(idStr) && idStr.length === 24;
      const reqDoc = await ProjectRequest.findOne(
        isObjectId
          ? { $or: [{ _id: idStr }, { requestId: idStr }, { requestId: idStr.toUpperCase() }, { dashboardProjectId: idStr.toUpperCase() }] }
          : { $or: [{ requestId: idStr }, { requestId: idStr.toUpperCase() }, { dashboardProjectId: idStr.toUpperCase() }] }
      ).populate('projectManager', 'name email employeeCode globalRole designation').lean().catch(() => null);

      if (reqDoc && reqDoc.projectId) {
        return await this._findProject(reqDoc.projectId);
      }
      if (reqDoc && reqDoc.dashboardProjectId) {
        return await this._findProject(reqDoc.dashboardProjectId);
      }
    } catch (_) {}

    return null;
  }

  async getMembers(projectId) {
    const project = await this._findProject(projectId);
    const code = project ? (project.projectId || String(project._id)).toUpperCase() : String(projectId).toUpperCase();
    const rawId = project ? project._id : projectId;

    return await ProjectMember.find({
      $or: [
        { projectId: code },
        { project: rawId },
        { project: projectId }
      ].filter(Boolean),
      isActive: true
    })
      .populate('employee', 'name email employeeCode globalRole designation department departmentCode phone')
      .populate('department', 'code name description');
  }

  async getMembersGroupedByDepartment(projectId) {
    const project = await this._findProject(projectId);
    const code = project ? (project.projectId || String(project._id)).toUpperCase() : String(projectId).toUpperCase();
    const rawId = project ? project._id : projectId;

    const members = await ProjectMember.find({
      $or: [
        { projectId: code },
        { project: rawId },
        { project: projectId }
      ].filter(Boolean),
      isActive: true
    })
      .populate('employee', 'name email employeeCode phone designation globalRole department departmentCode')
      .populate('department', 'code name description')
      .lean();

    const teamByDept = members.reduce((acc, m) => {
      const code = m.departmentCode || (m.department && m.department.code) || 'OPS';
      acc[code] = acc[code] || [];
      acc[code].push(m);
      return acc;
    }, {});

    return teamByDept;
  }

  async addOrUpdateMember(projectId, employeeId, designation, actorId) {
    const project = await this._findProject(projectId);
    const code = project ? (project.projectId || String(project._id)).toUpperCase() : String(projectId).toUpperCase();
    const rawId = project ? project._id : projectId;

    let member = await ProjectMember.findOne({
      $or: [
        { projectId: code },
        { project: rawId },
        { project: projectId }
      ].filter(Boolean),
      employee: employeeId
    });

    if (member) {
      member.projectId = code;
      member.project = rawId;
      member.designation = designation;
      member.isActive = true;
      await member.save();
    } else {
      member = await ProjectMember.create({
        projectId: code,
        project: rawId,
        employee: employeeId,
        designation,
        assignedBy: actorId
      });
    }

    await Activity.create({
      projectId: code,
      project: rawId,
      actor: actorId,
      action: 'CONTRIBUTOR_ASSIGNED',
      resourceType: 'ProjectMember',
      resourceId: member._id,
      metadata: { employeeId, designation }
    });

    try {
      const Notification = require('../notifications/notifications.model');
      await Notification.create({
        recipient: employeeId,
        projectId: code,
        project: rawId,
        title: `Project Assignment: ${designation}`,
        message: `You have been added to project ${code} (${project ? project.projectName : ''}) as ${designation}.`,
        type: 'ASSIGNMENT'
      });
    } catch { }

    return member;
  }

  async removeMember(projectId, employeeId, actorId) {
    const project = await this._findProject(projectId);
    const code = project ? (project.projectId || String(project._id)).toUpperCase() : String(projectId).toUpperCase();
    const rawId = project ? project._id : projectId;

    const member = await ProjectMember.findOneAndUpdate(
      {
        $or: [
          { projectId: code },
          { project: rawId },
          { project: projectId }
        ].filter(Boolean),
        employee: employeeId
      },
      { isActive: false },
      { new: true }
    );
    if (!member) throw new AppError('Project member not found.', 404, 'MEMBER_NOT_FOUND');

    await Activity.create({
      projectId: code,
      project: rawId,
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
