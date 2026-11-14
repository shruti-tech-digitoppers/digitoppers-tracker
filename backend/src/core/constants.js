const platformsConstants = require('../constants/platforms.constants');

module.exports = {
  GLOBAL_ROLES: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    EMPLOYEE: 'EMPLOYEE',
    VIEWER: 'VIEWER'
  },
  DESIGNATIONS: {
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    CONTRIBUTOR: 'CONTRIBUTOR',
    VIEWER: 'VIEWER'
  },
  NODE_STATUSES: {
    PENDING: 'PENDING',
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    ON_HOLD: 'ON_HOLD',
    BLOCKED: 'BLOCKED',
    CANCELLED: 'CANCELLED'
  },
  PROJECT_STATUSES: {
    PENDING_REVIEW: 'PENDING_REVIEW',
    ACTIVE: 'ACTIVE',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    ARCHIVED: 'ARCHIVED'
  },
  NODE_TYPES: {
    STAGE: 'STAGE',
    TASK: 'TASK'
  },
  LICENSE_PLATFORMS: platformsConstants.LICENSE_PLATFORMS,
  PLATFORMS: platformsConstants.PLATFORMS,
  PLATFORM_LABELS: platformsConstants.PLATFORM_LABELS,
  PLATFORM_OPTIONS: platformsConstants.PLATFORM_OPTIONS,
  SOLUTIONS: platformsConstants.SOLUTIONS,
  defaultSolutionForPlatform: platformsConstants.defaultSolutionForPlatform
};
