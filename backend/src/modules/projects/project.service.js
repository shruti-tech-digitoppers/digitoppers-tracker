const Project = require('./project.model');
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

class ProjectService {
  /**
   * getProjects: Fetches Tracker master projects from local database
   * Enriches each project with Tracker metadata (PM, members, schools, timeline)
   */
  async getProjects(employee, query = {}) {
    const filter = {};

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    } else {
      filter.isActive = { $ne: false };
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { projectId: searchRegex },
        { projectCode: searchRegex },
        { projectName: searchRegex },
        { organization: searchRegex },
        { email: searchRegex },
        { state: searchRegex },
        { district: searchRegex }
      ];
    }

    // 1. Fetch projects from Tracker's database
    const localProjects = await Project.find(filter)
      .populate('projectManager', 'name email employeeCode globalRole designation')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Fetch approved Project Requests to include any confirmed projects
    const approvedRequests = await ProjectRequest.find({
      status: 'APPROVED',
      isActive: true
    }).populate('projectManager', 'name email employeeCode globalRole designation').lean().catch(() => []);

    const existingProjectIds = new Set(
      localProjects.map(p => (p.projectId || '').toUpperCase())
    );

    const syntheticProjectsFromRequests = [];
    for (const req of approvedRequests) {
      const code = (req.dashboardProjectId || req.requestId || '').toUpperCase();
      if (code && !existingProjectIds.has(code)) {
        syntheticProjectsFromRequests.push({
          _id: req.projectId || req._id,
          projectId: code,
          projectName: req.projectName || req.title,
          title: req.projectName || req.title,
          organization: req.projectName || req.title,
          email: req.email || '',
          phone: req.phone || '',
          address: req.address || '',
          numberOfSchools: 0,
          numberOfLicenses: 0,
          status: 'ACTIVE',
          projectManager: req.projectManager || null,
          isActive: true,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          source: 'PROJECT_REQUEST'
        });
        existingProjectIds.add(code);
      }
    }

    const allProjectsList = [...localProjects, ...syntheticProjectsFromRequests];

    const allProjectMongoIds = allProjectsList
      .map(p => p._id)
      .filter(id => mongoose.isValidObjectId(id))
      .map(id => new mongoose.Types.ObjectId(id));

    // 3. Fetch project members in bulk
    const allMembers = await ProjectMember.find({
      project: { $in: allProjectMongoIds },
      isActive: true
    }).populate('employee', 'name email employeeCode globalRole designation phone department departmentCode').lean();

    const membersMap = new Map();
    allMembers.forEach(m => {
      const pid = String(m.project);
      if (!membersMap.has(pid)) membersMap.set(pid, []);
      if (m.employee) {
        membersMap.get(pid).push({
          ...m.employee,
          projectRole: m.designation
        });
      }
    });

    // 4. Merge PM and members into each project
    let mergedProjects = allProjectsList.map(p => {
      const pIdStr = String(p._id);
      const members = membersMap.get(pIdStr) || [];
      const assignedPm = p.projectManager || members.find(m => m.projectRole === DESIGNATIONS.PROJECT_MANAGER) || null;

      return {
        _id: pIdStr,
        coreMongoId: pIdStr,
        projectId: (p.projectId || p.projectCode || pIdStr).toUpperCase(),
        projectName: p.projectName || p.title || 'Untitled Project',
        title: p.projectName || p.title || 'Untitled Project',
        organization: p.organization || p.projectName || p.title || '',
        email: p.email || '',
        phone: p.phone || '',
        address: p.address || '',
        numberOfSchools: p.numberOfSchools || 0,
        numberOfLicenses: p.numberOfLicenses || 0,
        budget: p.budget || 0,
        country: typeof p.country === 'object' && p.country ? p.country.name : (p.country || ''),
        status: p.status || 'ACTIVE',
        projectManager: assignedPm,
        members,
        clientPoAndPi: p.clientPoAndPi || { purchaseOrders: [], proformaInvoices: [] },
        isActive: p.isActive !== false,
        createdAt: p.createdAt || new Date(),
        updatedAt: p.updatedAt || new Date(),
        source: p.source || 'TRACKER_LOCAL_DB'
      };
    });

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

    const pmMember = await ProjectMember.findOne({
      project: project._id,
      designation: DESIGNATIONS.PROJECT_MANAGER,
      isActive: true
    }).populate('employee', 'name email employeeCode globalRole designation');

    let pm = (pmMember && pmMember.employee) ? pmMember.employee : (project.projectManager || null);
    if (!pm) {
      const ProjectRequest = require('../project-requests/project-request.model');
      const reqDoc = await ProjectRequest.findOne({
        $or: [{ projectId: project._id }, { title: project.projectName }]
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
        School.find({ projectId: project._id, isActive: true })
          .populate('installation.assignedEngineerId', 'name email phone')
          .populate('training.assignedTrainerId', 'name email phone')
          .lean()
          .catch(() => []),
        ProjectSchools.findOne({ project: project._id }).lean().catch(() => null)
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
    const projectDoc = await this._findProject(projectId);
    if (!projectDoc) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    const project = { ...projectDoc, isActive: false, status: PROJECT_STATUSES.ARCHIVED };

    await Activity.create({
      project: project._id,
      actor: actorId,
      action: 'PROJECT_ARCHIVED',
      resourceType: 'Project',
      resourceId: project._id
    });

    return project;
  }

  async _findProject(projectId) {
    if (!projectId) return null;
    const idStr = String(projectId).trim();

    // 1. Fetch live project strictly by ID from Core Backend API
    let coreP = null;
    try {
      coreP = await coreApi.getProjectById(idStr);
    } catch (e) {
      console.warn('[ProjectService] _findProject Core API check error:', e.message);
    }

    // 2. Lookup in Tracker local MongoDB
    const isObjectId = mongoose.isValidObjectId(idStr) && idStr.length === 24;
    const localP = await Project.findOne(
      isObjectId
        ? { $or: [{ _id: idStr }, { projectId: idStr }, { projectId: idStr.toUpperCase() }] }
        : { $or: [{ projectId: idStr }, { projectId: idStr.toUpperCase() }] }
    ).populate('projectManager', 'name email employeeCode globalRole designation').lean().catch(() => null);

    if (coreP) {
      return {
        _id: String(coreP._id || (localP ? localP._id : idStr)),
        projectId: String(coreP.projectId || (localP ? localP.projectId : idStr)).toUpperCase(),
        projectName: coreP.projectName || coreP.title || (localP ? localP.projectName : 'Core Project'),
        title: coreP.projectName || coreP.title || (localP ? localP.title : 'Core Project'),
        organization: coreP.projectName || coreP.client || (localP ? localP.organization : 'Direct Organization'),
        email: coreP.email || (localP ? localP.email : ''),
        phone: coreP.phone || (localP ? localP.phone : ''),
        address: coreP.address || (localP ? localP.address : ''),
        numberOfSchools: coreP.numberOfSchools || (localP ? localP.numberOfSchools : 0),
        numberOfLicenses: coreP.numberOfLicenses || (localP ? localP.numberOfLicenses : 0),
        country: typeof coreP.country === 'object' && coreP.country ? coreP.country.name : (coreP.country || (localP ? localP.country : '')),
        status: localP?.status || 'ACTIVE',
        isActive: coreP.isActive !== false && (localP?.isActive !== false),
        budget: localP?.budget || 0,
        clientPoAndPi: localP?.clientPoAndPi || { purchaseOrders: [], proformaInvoices: [] },
        projectManager: localP?.projectManager || null,
        source: 'CORE_BACKEND_WITH_LOCAL_MERGE'
      };
    }

    if (localP) {
      return {
        ...localP,
        _id: String(localP._id),
        projectId: (localP.projectId || idStr).toUpperCase(),
        projectName: localP.projectName || localP.title,
        title: localP.projectName || localP.title,
        source: 'TRACKER_LOCAL_DB'
      };
    }

    return null;
  }

  async getMembers(projectId) {
    const project = await this._findProject(projectId);
    const pId = project ? project._id : projectId;
    return await ProjectMember.find({ project: pId, isActive: true })
      .populate('employee', 'name email employeeCode globalRole designation department departmentCode phone')
      .populate('department', 'code name description');
  }

  async getMembersGroupedByDepartment(projectId) {
    const project = await this._findProject(projectId);
    const pId = project ? project._id : projectId;

    const members = await ProjectMember.find({ project: pId, isActive: true })
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
      const prj = await this._findProject(projectId);
      await Notification.create({
        recipient: employeeId,
        project: projectId,
        title: `Project Assignment: ${designation}`,
        message: `You have been added to project ${prj ? prj.projectId : ''} (${prj ? prj.projectName : ''}) as ${designation}.`,
        type: 'ASSIGNMENT'
      });
    } catch { }

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
