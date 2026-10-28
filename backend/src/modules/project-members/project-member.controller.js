
const ProjectMember = require('./project-member.model');
const Employee = require('../employees/employee.model');
const { AppError } = require('../../core/errors');
const mongoose = require('mongoose');
const coreApi = require('../../services/core-api.service');

async function resolveProjectId(paramId) {
  if (!paramId) return null;
  const p = await coreApi.getProjectById(paramId);
  return p ? p._id : (mongoose.Types.ObjectId.isValid(paramId) ? paramId : null);
}

// GET /api/v1/project-members
exports.getAllProjectMembers = async (req, res, next) => {
  try {
    const filter = {};
    const { project, employee, department, isActive, isDepartmentLead } = req.query;

    if (project) {
      const pId = await resolveProjectId(project);
      if (pId) filter.project = pId;
    }
    if (employee) filter.employee = employee;
    if (department) filter.department = department;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';
    if (typeof isDepartmentLead !== 'undefined') filter.isDepartmentLead = isDepartmentLead === 'true';

    const members = await ProjectMember.find(filter)
      .populate('project', 'projectId projectName title status budget')
      .populate('employee', 'name email phone designation avatar employeeId')
      .populate('department', 'name code')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/project-members/project/:projectId or /api/v1/projects/:projectId/members
exports.getProjectMembersByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await coreApi.getProjectById(projectId);
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
      .populate('employee', 'name email phone designation avatar employeeId department')
      .populate('department', 'name code')
      .populate('assignedBy', 'name email')
      .sort({ isDepartmentLead: -1, createdAt: 1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/project-members/:id
exports.getProjectMemberById = async (req, res, next) => {
  try {
    const member = await ProjectMember.findById(req.params.id)
      .populate('project', 'projectId projectName title status')
      .populate('employee', 'name email phone designation avatar employeeId')
      .populate('department', 'name code')
      .populate('assignedBy', 'name email');

    if (!member) {
      return next(new AppError('Project member not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/project-members or POST /api/v1/projects/:projectId/members
exports.addProjectMember = async (req, res, next) => {
  try {
    let projectId = req.params.projectId || req.body.project || req.body.projectId;
    const targetProject = await coreApi.getProjectById(projectId);
    const pId = targetProject ? targetProject._id : (mongoose.Types.ObjectId.isValid(projectId) ? projectId : null);
    const code = targetProject ? (targetProject.projectId || String(targetProject._id)).toUpperCase() : String(projectId).toUpperCase();

    if (!pId && !targetProject) {
      return next(new AppError('Target project not found', 404, 'NOT_FOUND'));
    }

    const employeeId = req.body.employee || req.body.employeeId;
    if (!employeeId) {
      return next(new AppError('Employee ID is required', 400, 'BAD_REQUEST'));
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return next(new AppError('Employee not found', 404, 'NOT_FOUND'));
    }

    // Check duplicate
    const existing = await ProjectMember.findOne({
      $or: [
        { projectId: code },
        { project: pId },
        { project: projectId }
      ].filter(Boolean),
      employee: employeeId
    });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.projectId = code;
        existing.project = pId || code;
        existing.designation = req.body.designation || employee.designation;
        existing.projectRole = req.body.projectRole || existing.projectRole;
        existing.isDepartmentLead = req.body.isDepartmentLead ?? existing.isDepartmentLead;
        await existing.save();
        return res.status(200).json({
          success: true,
          message: 'Project member reactivated successfully',
          data: existing
        });
      }
      return next(new AppError('Employee is already assigned to this project', 409, 'ALREADY_ASSIGNED'));
    }

    const currentUserId = req.employee?._id || req.employee?.id || req.user?.id || employeeId;

    const newMember = await ProjectMember.create({
      projectId: code,
      project: pId || code,
      employee: employeeId,
      department: req.body.department || employee.department || null,
      departmentCode: req.body.departmentCode || null,
      designation: req.body.designation || employee.designation,
      projectRole: req.body.projectRole || '',
      isDepartmentLead: Boolean(req.body.isDepartmentLead),
      assignedBy: currentUserId,
      isActive: true
    });

    const populated = await ProjectMember.findById(newMember._id)
      .populate('project', 'projectId projectName')
      .populate('employee', 'name email designation employeeId')
      .populate('department', 'name code');

    res.status(201).json({
      success: true,
      message: 'Project member assigned successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/project-members/:id
exports.updateProjectMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await ProjectMember.findById(id);

    if (!member) {
      return next(new AppError('Project member not found', 404, 'NOT_FOUND'));
    }

    const allowed = ['designation', 'projectRole', 'isDepartmentLead', 'isActive', 'department', 'departmentCode'];
    allowed.forEach(field => {
      if (typeof req.body[field] !== 'undefined') {
        member[field] = req.body[field];
      }
    });

    await member.save();

    const populated = await ProjectMember.findById(member._id)
      .populate('project', 'projectId projectName')
      .populate('employee', 'name email designation employeeId')
      .populate('department', 'name code');

    res.status(200).json({
      success: true,
      message: 'Project member updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/project-members/:id
exports.removeProjectMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await ProjectMember.findById(id);

    if (!member) {
      return next(new AppError('Project member not found', 404, 'NOT_FOUND'));
    }

    await ProjectMember.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Project member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
