const requirementsService = require('./requirements.service');

/**
 * GET /api/v1/requirements/:projectId
 * Fetches the master project requirement document with full populations
 */
const getRequirements = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const requirement = await requirementsService.getProjectRequirements(projectId);

    res.status(200).json({
      success: true,
      data: requirement || {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/requirements/:projectId
 * Saves or updates project requirements (including schools, stages, etc.)
 */
const saveRequirements = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const employeeId = req.user?._id || req.user?.id || '6a8e8fc9cda0c1e389eb4954';

    await requirementsService.upsertRequirements(projectId, req.body, employeeId);
    const updated = await requirementsService.getProjectRequirements(projectId);

    res.status(200).json({
      success: true,
      message: 'Project requirements saved successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/requirements/:projectId/schools
 * Checks and returns the breakdown of all schools for a project, including:
 * School & Branch -> Solutions -> Hardware (according to solution) & Content
 */
const getProjectSchoolRequirements = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const breakdown = await requirementsService.checkProjectSchoolsRequirements(projectId);

    res.status(200).json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/requirements/:projectId/schools
 * Updates the school requirements array for a project
 */
const updateProjectSchoolRequirements = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const employeeId = req.user?._id || req.user?.id || '6a8e8fc9cda0c1e389eb4954';
    const schoolsData = req.body.schools || req.body;

    const updated = await requirementsService.updateProjectSchoolRequirements(
      projectId,
      schoolsData,
      employeeId
    );

    res.status(200).json({
      success: true,
      message: 'School-wise solution, hardware, and content requirements saved successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/requirements/:projectId/schools/:schoolId
 * Checks required solutions, hardware, and content for a single school branch
 */
const checkSchoolRequirements = async (req, res, next) => {
  try {
    const { projectId, schoolId } = req.params;
    const result = await requirementsService.checkSchoolRequiredItems(projectId, schoolId);

    if (!result.found) {
      return res.status(404).json({
        success: false,
        message: `School or branch '${schoolId}' not found in project '${projectId}'`
      });
    }

    res.status(200).json({
      success: true,
      data: result.school
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRequirements,
  saveRequirements,
  getProjectSchoolRequirements,
  updateProjectSchoolRequirements,
  checkSchoolRequirements
};
