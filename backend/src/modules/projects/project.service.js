const ProjectMember = require('../project-members/project-member.model');
const Activity = require('../activity/activity.model');
const ProjectRequest = require('../project-requests/project-request.model');
const { DESIGNATIONS, PROJECT_STATUSES } = require('../../core/constants');
const { AppError } = require('../../core/errors');
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
      const code = (cp.projectId || String(cp._id)).toLowerCase();
      const cpIdStr = String(cp._id);

      return {
        _id: cpIdStr,
        coreMongoId: cpIdStr,
        projectId: code,
        projectName: cp.projectName || cp.title || 'Core Project',
        title: cp.projectName || cp.title || 'Core Project',
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
    const timelineService = require('../timeline-data/timeline-data.service');
    for (const cp of allProjectsList) {
      if (!initializedProjectTimelines.has(cp.projectId)) {
        initializedProjectTimelines.add(cp.projectId);
        timelineService.createTimelineForProject(cp).catch((e) => {
          initializedProjectTimelines.delete(cp.projectId);
          console.warn(`[ProjectService] Auto-init timeline for ${cp.projectId}:`, e.message);
        });
      }
    }

    // Fetch members for all projects in bulk using both string IDs and Mongo IDs
    const allProjectIds = allProjectsList.map(p => p.projectId).filter(Boolean);
    const allProjectMongoIds = allProjectsList
      .map(p => p._id)
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const allMembers = await ProjectMember.find({
      projectId: { $in: allProjectIds },
      isActive: true
    }).populate('employee', 'name email globalRole designation phone departmentCode').lean().catch(() => []);

    const membersMap = new Map();
    allMembers.forEach(m => {
      const pCode = (m.projectId || '').toLowerCase();
      const keys = [pCode, pCode.toUpperCase(), m.projectId].filter(Boolean);
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
      const pCode = (p.projectId || '').toLowerCase();
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

    const code = (project.projectId || '').toLowerCase();
    const pmMember = await ProjectMember.findOne({
      $or: [
        { projectId: code },
        { projectId: code.toUpperCase() },
        { projectId: project.projectId }
      ].filter(Boolean),
      designation: DESIGNATIONS.PROJECT_MANAGER,
      isActive: true
    }).populate('employee', 'name email globalRole designation');

    let pm = (pmMember && pmMember.employee) ? pmMember.employee : (project.projectManager || null);
    if (!pm) {
      const ProjectRequest = require('../project-requests/project-request.model');
      const reqDoc = await ProjectRequest.findOne({
        $or: [
          { dashboardProjectId: code },
          { dashboardProjectId: code.toUpperCase() },
          { projectId: rawId },
          { title: project.projectName }
        ].filter(Boolean)
      }).populate('projectManager', 'name email globalRole designation');
      if (reqDoc && reqDoc.projectManager) {
        pm = reqDoc.projectManager;
      }
    }

    project.title = project.projectName || project.title;
    project.projectManager = pm || null;

    try {
      const coreSchools = await coreApi.getProjectSchools(code || project.projectId || rawId);
      let formattedSchools = [];
      if (Array.isArray(coreSchools) && coreSchools.length > 0) {
        formattedSchools = coreSchools.map((s, idx) => ({
          id: String(s._id || s.schoolId || `school-${idx + 1}`),
          _id: String(s._id || s.schoolId || `school-${idx + 1}`),
          schoolId: s.schoolId || String(s._id),
          schoolName: s.name || s.schoolName || `School ${idx + 1}`,
          name: s.name || s.schoolName || `School ${idx + 1}`,
          schoolCode: s.schoolId || String(s._id),
          address: s.address || s.addressContact || '',
          addressContact: s.address || s.addressContact || '',
          principalName: s.principalName || s.survey?.principalName || s.contactPerson?.name || (typeof s.contactPerson === 'string' ? s.contactPerson : '') || '',
          principalDetails: s.principalDetails || '',
          pocName: s.coordinatorId?.name || s.pocName || s.contactPerson || '',
          pocDesignation: s.pocDesignation || '',
          pocContact: s.phone || s.pocContact || '',
          phone: s.phone || s.pocContact || '',
          email: s.email || s.contactPerson?.email || '',
          classes: s.classes || [],
          platforms: s.platforms || [],
          installation: s.installation || {},
          training: s.training || {},
          survey: s.survey || {},
          numberOfStudents: Number(s.numberOfStudents) || 0,
          numberOfTeachers: Number(s.numberOfTeachers) || 0,
          numberOfLicenses: Number(s.numberOfLicenses) || 0,
          source: 'CORE_BACKEND'
        }));
      }

      project.schools = formattedSchools;
      if (formattedSchools.length > 0 && (!project.numberOfSchools || project.numberOfSchools === 0)) {
        project.numberOfSchools = formattedSchools.length;
      }
    } catch (e) {
      console.warn('[ProjectService] getProjectById Core schools fetch warning:', e.message);
    }

    return project;
  }

  async updateProject(projectId, updateData, actorId) {
    const projectDoc = await this._findProject(projectId);
    if (!projectDoc) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    const data = { ...updateData };
    if (data.projectId) data.projectId = data.projectId.toLowerCase();

    const project = { ...projectDoc, ...data };
    const code = (project.projectId || '').toLowerCase();
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
    const code = (project.projectId || '').toLowerCase();
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
      const code = String(coreP.projectId || idStr).toLowerCase();
      const rawId = String(coreP._id || idStr);

      const resolvedP = {
        _id: rawId,
        coreMongoId: rawId,
        projectId: code,
        projectName: coreP.projectName || coreP.title || 'Core Project',
        title: coreP.projectName || coreP.title || 'Core Project',
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
        const timelineService = require('../timeline-data/timeline-data.service');
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
          ? { $or: [{ _id: idStr }, { requestId: idStr }, { requestId: idStr.toUpperCase() }, { dashboardProjectId: idStr.toLowerCase() }, { dashboardProjectId: idStr.toUpperCase() }] }
          : { $or: [{ requestId: idStr }, { requestId: idStr.toUpperCase() }, { dashboardProjectId: idStr.toLowerCase() }, { dashboardProjectId: idStr.toUpperCase() }] }
      ).populate('projectManager', 'name email globalRole designation').lean().catch(() => null);

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
    const code = project ? (project.projectId || String(project._id)).toLowerCase() : String(projectId).toLowerCase();
    const rawId = project ? project._id : projectId;

    return await ProjectMember.find({
      $or: [
        { projectId: code },
        { projectId: code.toUpperCase() },
        { projectId: project?.projectId || projectId }
      ].filter(Boolean),
      isActive: true
    })
      .populate('employee', 'name email globalRole designation departmentCode phone');
  }

  async getMembersGroupedByDepartment(projectId) {
    const project = await this._findProject(projectId);
    const code = project ? (project.projectId || String(project._id)).toLowerCase() : String(projectId).toLowerCase();

    const members = await ProjectMember.find({
      $or: [
        { projectId: code },
        { projectId: code.toUpperCase() },
        { projectId: project?.projectId || projectId }
      ].filter(Boolean),
      isActive: true
    })
      .populate('employee', 'name email phone designation globalRole departmentCode')
      .lean();

    const teamByDept = members.reduce((acc, m) => {
      const code = m.departmentCode || 'OPS';
      acc[code] = acc[code] || [];
      acc[code].push(m);
      return acc;
    }, {});

    return teamByDept;
  }

  async addOrUpdateMember(projectId, employeeId, designation, actorId) {
    const project = await this._findProject(projectId);
    const targetProjId = project?.projectId || String(projectId);

    let member = await ProjectMember.findOne({
      $or: [
        { projectId: targetProjId },
        { projectId: targetProjId.toLowerCase() },
        { projectId: targetProjId.toUpperCase() }
      ],
      employee: employeeId
    });

    if (member) {
      member.projectId = targetProjId;
      member.designation = designation;
      member.isActive = true;
      await member.save();
    } else {
      member = await ProjectMember.create({
        projectId: targetProjId,
        employee: employeeId,
        designation,
        assignedBy: actorId
      });
    }

    await Activity.create({
      projectId: targetProjId,
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
        projectId: targetProjId,
        title: `Project Assignment: ${designation}`,
        message: `You have been added to project ${targetProjId} (${project ? project.projectName : ''}) as ${designation}.`,
        type: 'ASSIGNMENT'
      });
    } catch { }

    return member;
  }

  async removeMember(projectId, employeeId, actorId) {
    const project = await this._findProject(projectId);
    const targetProjId = project?.projectId || String(projectId);

    const member = await ProjectMember.findOneAndUpdate(
      {
        $or: [
          { projectId: targetProjId },
          { projectId: targetProjId.toLowerCase() },
          { projectId: targetProjId.toUpperCase() }
        ],
        employee: employeeId
      },
      { isActive: false },
      { new: true }
    );
    if (!member) throw new AppError('Project member not found.', 404, 'MEMBER_NOT_FOUND');

    await Activity.create({
      projectId: targetProjId,
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
