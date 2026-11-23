const Employee = require('./employee.model');
const coreApi = require('../../services/core-api.service');
const ProjectMember = require('../project-members/project-member.model');
const activityService = require('../activity/activity.service');
const bcrypt = require('bcryptjs');
const { DESIGNATIONS } = require('../../core/constants');
const { AppError } = require('../../core/errors');

class EmployeeService {
  async createEmployee(employeeData, actorId) {
    const existingEmail = await Employee.findOne({ email: employeeData.email.toLowerCase().trim() });
    if (existingEmail) {
      throw new AppError(`An employee with email "${employeeData.email}" already exists.`, 409, 'DUPLICATE_EMAIL');
    }

    const { projectRoles, password, ...basicData } = employeeData;
    if (password) {
      basicData.passwordHash = password;
    }
    const employee = await Employee.create(basicData);
    employee.passwordHash = undefined;

    // Log activity
    await activityService.log({
      actor: actorId,
      action: 'EMPLOYEE_CREATED',
      description: `New employee created: ${employee.name} (${employee.email})`,
      resourceType: 'Employee',
      resourceId: employee._id,
      metadata: { employeeName: employee.name, email: employee.email, role: employee.globalRole }
    });

    // If initial project roles are provided, assign them and trigger notifications
    if (Array.isArray(projectRoles) && projectRoles.length > 0) {
      const Notification = require('../notifications/notifications.model');
      for (const pr of projectRoles) {
        if (!pr.projectId || !pr.designation || pr.designation === DESIGNATIONS.VIEWER) continue;
        
        const project = await coreApi.getProjectById(pr.projectId);
        if (!project) continue;
        const targetProjId = project.projectId || String(pr.projectId);

        await ProjectMember.create({
          projectId: targetProjId,
          employee: employee._id,
          designation: pr.designation,
          assignedBy: actorId || employee._id,
          isActive: true
        });

        // Create assignment notification
        try {
          await Notification.create({
            recipient: employee._id,
            projectId: targetProjId,
            title: `Assigned as ${pr.designation === DESIGNATIONS.PROJECT_MANAGER ? 'Project Manager' : 'Contributor'}`,
            message: `You have been assigned as ${pr.designation === DESIGNATIONS.PROJECT_MANAGER ? 'Project Manager' : 'Contributor'} for project ${project.projectId || ''} (${project.projectName || project.title || ''}).`,
            type: 'ASSIGNMENT'
          });
        } catch {}
      }
    }

    return employee;
  }


  async getAllEmployees(query = {}) {
    const filter = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
    if (query.globalRole) filter.globalRole = query.globalRole;
    return await Employee.find(filter).select('-passwordHash').sort({ createdAt: -1 });
  }

  async getEmployeeById(id) {
    const employee = await Employee.findById(id).select('-passwordHash');
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  }

  async updateEmployee(id, updateData, actorId) {
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    } else {
      delete updateData.passwordHash;
    }

    const employee = await Employee.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-passwordHash');
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');

    await activityService.log({
      actor: actorId,
      action: 'EMPLOYEE_UPDATED',
      description: `Employee profile updated: ${employee.name} (${employee.email})`,
      resourceType: 'Employee',
      resourceId: employee._id,
      metadata: { employeeName: employee.name, role: employee.globalRole }
    });

    return employee;
  }

  async updateStatus(id, isActive, actorId) {
    const employee = await Employee.findByIdAndUpdate(id, { isActive }, { new: true }).select('-passwordHash');
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');

    await activityService.log({
      actor: actorId,
      action: isActive ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
      description: `Employee ${employee.name} was ${isActive ? 'activated' : 'deactivated'}`,
      resourceType: 'Employee',
      resourceId: employee._id,
      metadata: { employeeName: employee.name, isActive }
    });

    return employee;
  }

  async deleteEmployee(id, actorId) {
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    // Clean up project memberships
    await ProjectMember.deleteMany({ employee: id });

    await activityService.log({
      actor: actorId,
      action: 'EMPLOYEE_DELETED',
      description: `Employee deleted: ${employee.name} (${employee.email})`,
      resourceType: 'Employee',
      resourceId: id,
      metadata: { employeeName: employee.name, employeeEmail: employee.email }
    });

    return { success: true, message: 'Employee deleted successfully' };
  }

  async getEmployeeProjects(employeeId) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');

    // Fetch live projects strictly from Core Backend API
    const coreApi = require('../../services/core-api.service');
    let rawProjects = [];
    try {
      const list = await coreApi.getProjects();
      if (Array.isArray(list)) rawProjects = list.filter(p => p.isActive !== false);
    } catch (_) {}
    const allProjects = rawProjects;

    // Fetch explicit project memberships for this employee
    const explicitMemberships = await ProjectMember.find({ employee: employeeId, isActive: true }).lean();
    const memberMap = new Map();
    explicitMemberships.forEach(m => {
      memberMap.set(m.project.toString(), m.designation);
    });

    // Map each project to the employee's role in it
    const projectRoles = allProjects.map(project => {
      const pIdStr = project._id.toString();
      
      let designation = DESIGNATIONS.VIEWER;
      let isDefault = true;

      if (memberMap.has(pIdStr)) {
        designation = memberMap.get(pIdStr);
        isDefault = false;
      }

      return {
        project: {
          _id: project._id,
          projectId: project.projectId || '',
          projectName: project.projectName || 'Untitled Project',
          status: project.status || 'ACTIVE',
        },
        designation,
        isDefault
      };
    });

    return {
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        globalRole: employee.globalRole,
      },
      projectRoles
    };
  }

  async updateEmployeeProjectRole(employeeId, projectId, designation, actorId) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');

    const project = await coreApi.getProjectById(projectId);
    if (!project) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    const targetProjId = project.projectId || String(project._id || projectId);

    // If designation is VIEWER, remove any custom membership or set to VIEWER (default access is Viewer)
    if (designation === DESIGNATIONS.VIEWER) {
      await ProjectMember.findOneAndDelete({ projectId: targetProjId, employee: employeeId });

      await activityService.log({
        projectId: targetProjId,
        actor: actorId,
        action: 'PROJECT_MEMBER_REMOVED',
        description: `${employee.name} reverted to default Viewer for project ${project.projectName || project.projectId}`,
        resourceType: 'ProjectMember',
        resourceId: employeeId,
        metadata: { projectName: project.projectName || project.projectId, employeeName: employee.name }
      });

      return {
        projectId: targetProjId,
        employeeId,
        designation: DESIGNATIONS.VIEWER,
        isDefault: true,
        message: 'Employee role set to default Viewer'
      };
    }

    let member = await ProjectMember.findOne({ projectId: targetProjId, employee: employeeId });
    if (member) {
      member.designation = designation;
      member.isActive = true;
      member.assignedBy = actorId;
      await member.save();
    } else {
      member = await ProjectMember.create({
        projectId: targetProjId,
        employee: employeeId,
        designation,
        assignedBy: actorId,
        isActive: true
      });
    }

    await activityService.log({
      projectId: targetProjId,
      actor: actorId,
      action: 'PROJECT_MEMBER_ASSIGNED',
      description: `${employee.name} assigned as ${designation === DESIGNATIONS.PROJECT_MANAGER ? 'Project Manager' : 'Contributor'} for project ${project.projectName || project.projectId}`,
      resourceType: 'ProjectMember',
      resourceId: member._id,
      metadata: { projectName: project.projectName || project.projectId, employeeName: employee.name, designation }
    });

    // Trigger Notification
    try {
      const Notification = require('../notifications/notifications.model');
      await Notification.create({
        recipient: employeeId,
        projectId: targetProjId,
        title: `Assigned as ${designation === DESIGNATIONS.PROJECT_MANAGER ? 'Project Manager' : 'Contributor'}`,
        message: `You have been assigned as ${designation === DESIGNATIONS.PROJECT_MANAGER ? 'Project Manager' : 'Contributor'} for project ${project.projectId || ''} (${project.projectName || project.title || ''}).`,
        type: 'ASSIGNMENT'
      });
    } catch {}

    return {
      projectId,
      employeeId,
      designation,
      isDefault: false,
      message: `Employee assigned as ${designation}`
    };
  }

}

module.exports = new EmployeeService();
