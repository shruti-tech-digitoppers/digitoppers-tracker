const Employee = require('./employee.model');
const Project = require('../projects/project.model');
const ProjectMember = require('../projects/project-member.model');
const bcrypt = require('bcryptjs');
const { DESIGNATIONS } = require('../../core/constants');
const { AppError } = require('../../core/errors');

class EmployeeService {
  async createEmployee(employeeData, actorId) {
    const existingEmail = await Employee.findOne({ email: employeeData.email.toLowerCase().trim() });
    if (existingEmail) {
      throw new AppError(`An employee with email "${employeeData.email}" already exists.`, 409, 'DUPLICATE_EMAIL');
    }

    const existingCode = await Employee.findOne({ employeeCode: employeeData.employeeCode.toUpperCase().trim() });
    if (existingCode) {
      throw new AppError(`An employee with code "${employeeData.employeeCode}" already exists.`, 409, 'DUPLICATE_CODE');
    }

    const { projectRoles, password, ...basicData } = employeeData;
    if (password) {
      basicData.passwordHash = password;
    }
    const employee = await Employee.create(basicData);
    employee.passwordHash = undefined;


    // If initial project roles are provided, assign them and trigger notifications
    if (Array.isArray(projectRoles) && projectRoles.length > 0) {
      const Notification = require('../notifications/notifications.model');
      for (const pr of projectRoles) {
        if (!pr.projectId || !pr.designation || pr.designation === DESIGNATIONS.VIEWER) continue;
        
        const project = await Project.findById(pr.projectId);
        if (!project) continue;

        await ProjectMember.create({
          project: pr.projectId,
          employee: employee._id,
          designation: pr.designation,
          assignedBy: actorId || employee._id,
          isActive: true
        });

        // Create assignment notification
        try {
          await Notification.create({
            recipient: employee._id,
            project: project._id,
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

  async updateEmployee(id, updateData) {
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    } else {
      delete updateData.passwordHash;
    }

    const employee = await Employee.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-passwordHash');
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  }

  async updateStatus(id, isActive) {
    const employee = await Employee.findByIdAndUpdate(id, { isActive }, { new: true }).select('-passwordHash');
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    return employee;
  }

  async deleteEmployee(id) {
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    // Clean up project memberships
    await ProjectMember.deleteMany({ employee: id });
    return { success: true, message: 'Employee deleted successfully' };
  }

  async getEmployeeProjects(employeeId) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');

    // Fetch all active projects
    const allProjects = await Project.find({ isActive: true })
      .select('projectId projectName organization status')
      .lean();

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
          organization: project.organization || ''
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
        employeeCode: employee.employeeCode,
        globalRole: employee.globalRole,
      },
      projectRoles
    };
  }

  async updateEmployeeProjectRole(employeeId, projectId, designation, actorId) {
    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');

    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');

    // If designation is VIEWER, remove any custom membership or set to VIEWER (default access is Viewer)
    if (designation === DESIGNATIONS.VIEWER) {
      await ProjectMember.findOneAndDelete({ project: projectId, employee: employeeId });
      return {
        projectId,
        employeeId,
        designation: DESIGNATIONS.VIEWER,
        isDefault: true,
        message: 'Employee role set to default Viewer'
      };
    }

    let member = await ProjectMember.findOne({ project: projectId, employee: employeeId });
    if (member) {
      member.designation = designation;
      member.isActive = true;
      member.assignedBy = actorId;
      await member.save();
    } else {
      member = await ProjectMember.create({
        project: projectId,
        employee: employeeId,
        designation,
        assignedBy: actorId,
        isActive: true
      });
    }

    // Trigger Notification
    try {
      const Notification = require('../notifications/notifications.model');
      await Notification.create({
        recipient: employeeId,
        project: projectId,
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

