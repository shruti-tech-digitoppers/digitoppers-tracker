const Requirement = require('./requirements.model');
const notificationService = require('../notifications/notifications.service');
const activityService = require('../activity/activity.service');
const Project = require('../projects/project.model');

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
    const project = await Project.findById(projectId).select('projectName projectId');
    const changedSections = Object.keys(updateData || {}).join(', ');

    await activityService.log({
      project: projectId,
      actor: employeeId,
      action: 'REQUIREMENTS_UPDATED',
      description: `Project configuration and requirements updated (${changedSections || 'Master Form'})`,
      resourceType: 'Requirement',
      resourceId: requirement._id,
      metadata: {
        projectName: project ? (project.projectName || project.projectId) : undefined,
        sections: Object.keys(updateData || {})
      }
    });

    await notificationService.notifyWithAdminsAndPMs({
      assignedTo: null,
      projectId: projectId,
      title: 'Project Requirements Updated',
      message: `Master project requirements and configurations have been updated.`,
      type: 'STATUS_UPDATE'
    });
  } catch (err) {
    console.log('Activity/Notification error:', err.message);
  }

  return requirement;
}

module.exports = {
  getProjectRequirements,
  upsertRequirements
};