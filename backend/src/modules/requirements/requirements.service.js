const Requirement = require('./requirements.model');
const notificationService = require('../notifications/notifications.service');
const activityService = require('../activity/activity.service');
const Project = require('../projects/project.model');

/**
 * Deep merge two plain objects. Arrays are replaced (not concatenated) to
 * keep the saved array authoritative. Mixed/Map fields like purchaseIfNeeded.items
 * need this so individual hardware-keyed entries don't overwrite each other.
 */
function deepMerge(target = {}, source = {}) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      output[key] = deepMerge(tgtVal, srcVal);
    } else {
      output[key] = srcVal;
    }
  }
  return output;
}

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
    for (const key of Object.keys(updateData || {})) {
      const incoming = updateData[key];
      const existing = requirement[key]
        ? (requirement[key].toObject ? requirement[key].toObject() : requirement[key])
        : {};

      if (
        typeof incoming === 'object' &&
        incoming !== null &&
        !Array.isArray(incoming)
      ) {
        // Deep merge: recursively merge nested objects so individual sub-keys
        // (e.g. hardware item entries in purchaseIfNeeded.items) don't overwrite each other
        requirement[key] = deepMerge(existing, incoming);
      } else {
        requirement[key] = incoming;
      }
      requirement.markModified(key);
    }
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