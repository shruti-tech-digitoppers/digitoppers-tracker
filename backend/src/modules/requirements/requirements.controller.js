const requirementsService = require('./requirements.service');

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

const saveRequirements = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    // Fallback ID use ki hai taaki agar req.user na ho toh error na aaye
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

module.exports = {
  getRequirements,
  saveRequirements
};