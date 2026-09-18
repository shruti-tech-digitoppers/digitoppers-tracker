const ProjectMember = require('../modules/projects/project-member.model');
const { GLOBAL_ROLES, DESIGNATIONS } = require('./constants');
const { AppError } = require('./errors');

const checkProjectAccess = async (employeeId, projectId) => {
  return await ProjectMember.findOne({ project: projectId, employee: employeeId, isActive: true });
};

const { restrictTo } = require('./auth');
const restrictToGlobal = restrictTo;

const verifyProjectPermission = (requiredDesignations = []) => {
  return async (req, res, next) => {
    try {
      const employee = req.employee;
      const projectId = req.params.projectId || req.body.projectId;

      if (!projectId) {
        return next(new AppError('Project ID required for authorization.', 400, 'MISSING_PROJECT_ID'));
      }

      if (employee.globalRole === GLOBAL_ROLES.ADMIN) {
        return next();
      }

      const membership = await checkProjectAccess(employee._id, projectId);
      
      // Default to VIEWER for all authenticated employees across all projects
      const designation = membership ? membership.designation : DESIGNATIONS.VIEWER;

      if (requiredDesignations.length > 0 && !requiredDesignations.includes(designation)) {
        return next(new AppError(`Action requires one of the following designations: ${requiredDesignations.join(', ')}`, 403, 'INSUFFICIENT_DESIGNATION'));
      }

      req.projectMembership = membership || { designation: DESIGNATIONS.VIEWER, isDefaultViewer: true };
      next();
    } catch (error) {
      next(error);
    }
  };
};

const canCreateOrRequestProject = (req, res, next) => {
  if (
    req.employee.globalRole === GLOBAL_ROLES.ADMIN ||
    req.employee.canRequestNewProject ||
    (req.employee.permissions && req.employee.permissions.canRequestNewProject)
  ) {
    return next();
  }
  return next(new AppError('You do not have permission to create or request new projects.', 403, 'FORBIDDEN'));
};

module.exports = { restrictToGlobal, verifyProjectPermission, checkProjectAccess, canCreateOrRequestProject };

