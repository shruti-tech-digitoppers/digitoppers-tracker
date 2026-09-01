const Requirement = require('./requirements.model');
const notificationService = require('../notifications/notifications.service');

async function getProjectRequirements(projectId) {
  const requirement = await Requirement.findOne({ project: projectId }).populate('updatedBy', 'name email');
  return requirement;
}

async function upsertRequirements(projectId, updateData, employeeId) {
  let requirement = await Requirement.findOne({ project: projectId });

  if (!requirement) {
    requirement = await Requirement.create({
      project: projectId,
      ...updateData,
      updatedBy: employeeId
    });
  } else {
    Object.assign(requirement, updateData);
    requirement.updatedBy = employeeId;
    await requirement.save();
  }

  try {
    await notificationService.notifyWithAdminsAndPMs({
      assignedTo: null,
      projectId: projectId,
      title: 'Project Requirements Updated',
      message: `Master project requirements and configurations have been updated.`,
      type: 'STATUS_UPDATE'
    });
  } catch (err) {
    console.log('Notification error:', err.message);
  }

  return requirement;
}

module.exports = {
  getProjectRequirements,
  upsertRequirements
};