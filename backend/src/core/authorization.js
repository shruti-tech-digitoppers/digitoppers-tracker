const ProjectMember = require('../modules/projects/project-member.model');
const { GLOBAL_ROLES, DESIGNATIONS } = require('./constants');
const { AppError } = require('./errors');

const checkProjectAccess = async (employeeId, projectId) => {
  return await ProjectMember.findOne({ project: projectId, employee: employeeId, isActive: true });
};

const restrictToGlobal = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.employee.globalRole)) {
      return next(new AppError('You do not have global permissions to perform this action.', 403, 'FORBIDDEN'));
    }
    next();
  };
};

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
      if (!membership) {
        return next(new AppError('You are not an active member of this project.', 403, 'NOT_PROJECT_MEMBER'));
      }

      if (requiredDesignations.length > 0 && !requiredDesignations.includes(membership.designation)) {
        return next(new AppError(`Action requires one of the following designations: ${requiredDesignations.join(', ')}`, 403, 'INSUFFICIENT_DESIGNATION'));
      }

      req.projectMembership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { restrictToGlobal, verifyProjectPermission, checkProjectAccess };
