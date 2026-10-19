const Project = require('./project.model');
const ProjectMember = require('../project-members/project-member.model');
const Timeline = require('../timeline/timeline.model');
const TimelineNode = require('../timeline/timeline-node.model');
const Activity = require('../activity/activity.model');
const Employee = require('../employees/employee.model');
const { DESIGNATIONS, PROJECT_STATUSES } = require('../../core/constants');
const { AppError } = require('../../core/errors');
const config = require('../../config/env');
const coreApi = require('../../services/core-api.service');
const mongoose = require('mongoose');

class ProjectService {
  /**
   * getProjects: Fetches live master projects strictly from Core Backend (DB or API)
   * Enriches each project with Tracker metadata (PM, members, schools, timeline)
   */
  async getProjects(employee, query = {}) {
    let coreProjects = [];

    try {
      const rawList = await coreApi.getProjects(query);
      if (Array.isArray(rawList) && rawList.length > 0) {
        coreProjects = rawList.map((p) => ({
          _id: String(p._id),
          projectId: String(p.projectId || p._id).trim(),
          projectName: p.projectName || p.title || 'Untitled Core Project',
          title: p.projectName || p.title || 'Untitled Core Project',
          email: p.email || '',
          phone: p.phone || '',
          address: p.address || '',
          numberOfSchools: p.numberOfSchools || 0,
          numberOfLicenses: p.numberOfLicenses || 0,
          country: typeof p.country === 'object' && p.country ? p.country.name : (p.country || ''),
          isActive: p.isActive !== false,
          createdAt: p.createdAt || new Date(),
          updatedAt: p.updatedAt || new Date(),
          source: 'CORE_BACKEND_API'
        }));
      }
    } catch (apiErr) {
      console.warn('[ProjectService] Core API fetch error:', apiErr.message);
    }

    // If Core Backend returned projects, use them as the primary source of truth
    if (coreProjects && coreProjects.length > 0) {
      const coreCodes = coreProjects.map(cp => cp.projectId);
      const coreCodesUpper = coreCodes.map(c => c.toUpperCase());
      const coreCodesLower = coreCodes.map(c => c.toLowerCase());
      const coreMongoIds = coreProjects.map(cp => cp._id).filter(id => mongoose.isValidObjectId(id));

      // Fetch corresponding Tracker Project records
      const localProjects = await Project.find({
        $or: [
          { projectId: { $in: [...coreCodes, ...coreCodesUpper, ...coreCodesLower] } },
          { _id: { $in: coreMongoIds } }
        ]
      }).lean();

      const localMap = new Map();
      localProjects.forEach(lp => {
        if (lp.projectId) {
          localMap.set(lp.projectId.toLowerCase(), lp);
          localMap.set(lp.projectId.toUpperCase(), lp);
        }
        localMap.set(String(lp._id), lp);
      });

      // Fetch members and project managers for both local and core project IDs
      const localIds = localProjects.map(lp => lp._id);
      const allProjectIds = [
        ...localIds,
        ...coreMongoIds.map(id => new mongoose.Types.ObjectId(id))
      ];

      const allMembers = await ProjectMember.find({
        project: { $in: allProjectIds },
        isActive: true
      }).populate('employee', 'name email employeeCode globalRole designation');

      // Fetch confirmed project requests to resolve PM if not in ProjectMember
      const ProjectRequest = require('../project-requests/project-request.model');
      const allRequests = await ProjectRequest.find({
        $or: [
          { projectId: { $in: allProjectIds } },
          { title: { $in: coreProjects.map(cp => cp.projectName) } }
        ]
      }).populate('projectManager', 'name email employeeCode globalRole designation').lean().catch(() => []);

      const reqPmMap = new Map();
      allRequests.forEach(r => {
        if (r.projectManager) {
          if (r.projectId) reqPmMap.set(String(r.projectId), r.projectManager);
          if (r.title) reqPmMap.set(r.title.toLowerCase(), r.projectManager);
        }
      });

      const pmMap = new Map();
      const membersMap = new Map();

      allMembers.forEach(m => {
        const pid = m.project.toString();
        if (!membersMap.has(pid)) membersMap.set(pid, []);
        if (m.employee) {
          const empData = m.employee.toObject ? m.employee.toObject() : m.employee;
          membersMap.get(pid).push({
            ...empData,
            projectRole: m.designation
          });
          if (m.designation === DESIGNATIONS.PROJECT_MANAGER && !pmMap.has(pid)) {
            pmMap.set(pid, empData);
          }
        }
      });

      let mergedProjects = coreProjects.map(cp => {
        const lp = localMap.get(cp.projectId.toLowerCase()) || localMap.get(cp.projectId.toUpperCase()) || localMap.get(cp._id);
        const pid = lp ? lp._id.toString() : cp._id;
        const assignedPm = (lp && pmMap.get(pid))
          ? pmMap.get(pid)
          : (pmMap.get(cp._id) || reqPmMap.get(cp._id) || reqPmMap.get(cp.projectId.toLowerCase()) || reqPmMap.get(cp.projectId.toUpperCase()) || lp?.projectManager || null);
        const members = (lp && membersMap.get(pid)) ? membersMap.get(pid) : (membersMap.get(cp._id) || []);

        return {
          ...(lp || {}),
          _id: cp._id,
          coreMongoId: cp._id,
          projectId: cp.projectId.toUpperCase(),
          projectName: cp.projectName,
          title: cp.projectName,
          organization: lp?.organization || cp.projectName,
          description: lp?.description || '',
          email: cp.email || lp?.email || '',
          phone: cp.phone || lp?.phone || '',
          address: cp.address || lp?.address || '',
          numberOfSchools: cp.numberOfSchools !== undefined ? cp.numberOfSchools : (lp?.numberOfSchools || 0),
          numberOfLicenses: cp.numberOfLicenses !== undefined ? cp.numberOfLicenses : (lp?.numberOfLicenses || 0),
          country: cp.country || lp?.country || '',
          status: lp?.status || 'ACTIVE',
          projectManager: assignedPm,
          members,
          isActive: cp.isActive !== false,
          createdAt: cp.createdAt || lp?.createdAt,
          updatedAt: cp.updatedAt || lp?.updatedAt,
          source: cp.source || 'CORE_BACKEND'
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

    // Fallback: If Core Backend returned nothing (offline/error), query local Project table
    const filter = { isActive: true };
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }
    const projects = await Project.find(filter).sort({ createdAt: -1 }).lean();
    return projects;
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

    const project = await Project.findByIdAndUpdate(projectDoc._id, data, { new: true, runValidators: true });
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
    const projectDoc = await this._findProject(projectId);
    if (!projectDoc) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    const project = await Project.findByIdAndUpdate(projectDoc._id, { isActive: false, status: PROJECT_STATUSES.ARCHIVED }, { new: true });
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

  async _findProject(projectId) {
    if (!projectId) return null;
    const mongoose = require('mongoose');
    const idStr = String(projectId).trim();

    // 1. Direct local lookup by ObjectId
    if (mongoose.Types.ObjectId.isValid(idStr) && idStr.length === 24) {
      const proj = await Project.findById(idStr);
      if (proj) return proj;
    }

    // 2. Direct local lookup by human code (case-insensitive)
    const byCode = await Project.findOne({
      $or: [
        { projectId: idStr.toUpperCase() },
        { projectId: idStr.toLowerCase() },
        { projectId: idStr }
      ]
    });
    if (byCode) return byCode;

    // 3. Fallback: Lookup via Core Backend API
    try {
      const coreP = await coreApi.getProjectById(idStr);
      if (coreP) {
        const existingLocal = await Project.findOne({
          $or: [
            { projectId: (coreP.projectId || idStr).toUpperCase() },
            { projectId: (coreP.projectId || idStr).toLowerCase() },
            { projectId: (coreP.projectId || idStr) },
            { _id: coreP._id }
          ]
        });
        if (existingLocal) return existingLocal;

        return {
          _id: coreP._id,
          projectId: (coreP.projectId || idStr).toUpperCase(),
          projectName: coreP.projectName || coreP.title || 'Core Project',
          title: coreP.projectName || coreP.title || 'Core Project',
          organization: coreP.projectName || 'Direct Organization',
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
    } catch (e) {
      console.warn('[ProjectService] _findProject Core API check error:', e.message);
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
      const prj = await Project.findById(projectId);
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
