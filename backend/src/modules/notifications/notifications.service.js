const Notification = require('./notifications.model');

async function getEmployeeNotifications(employeeId, options = {}) {
  let days = null;
  let category = null;
  let subCategory = null;

  if (typeof options === 'object' && options !== null) {
    days = options.days;
    category = options.category;
    subCategory = options.subCategory;
  } else {
    days = options;
  }

  const query = { recipient: employeeId };
  if (days && Number(days) > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(days));
    query.createdAt = { $gte: cutoff };
  }

  if (category === 'ASSIGNMENT') {
    if (subCategory === 'PROJECT') {
      query.$or = [
        { type: { $in: ['PROJECT_ASSIGNED', 'MEMBER_ASSIGNED'] } },
        { type: 'ASSIGNMENT', 'metadata.assignmentType': { $ne: 'TASK' }, 'metadata.nodeKey': { $exists: false } }
      ];
    } else if (subCategory === 'TASK') {
      query.$or = [
        { type: 'TASK_ASSIGNED' },
        { type: 'ASSIGNMENT', 'metadata.nodeKey': { $exists: true } },
        { type: 'ASSIGNMENT', 'metadata.assignmentType': 'TASK' }
      ];
    } else {
      query.type = { $in: ['ASSIGNMENT', 'PROJECT_ASSIGNED', 'TASK_ASSIGNED', 'MEMBER_ASSIGNED'] };
    }
  } else if (category === 'REQUEST') {
    query.$or = [
      { type: { $in: ['PROJECT_REQUEST_REVIEW', 'PROJECT_REQUEST_APPROVED', 'PROJECT_REQUEST_REJECTED'] } },
      { 'metadata.requestId': { $exists: true } }
    ];
  } else if (category === 'UPDATE') {
    query.type = { $in: ['STATUS_UPDATE', 'STAGE_UPDATED', 'TIMELINE_UPDATED', 'DEPENDENCY_UNLOCKED', 'UPDATE', 'GENERAL'] };
  }

  const notifications = await Notification.find(query)
    .populate('project', 'projectId projectName organization status')
    .sort({ createdAt: -1 });
  return notifications;
}

async function notifyWithAdminsAndPMs(data = {}) {
  try {
    const {
      assignedTo,
      projectId,
      title,
      message,
      type = 'STATUS_UPDATE',
      metadata = {},
      excludeUserIds = []
    } = data;

    if (!title || !message) return [];

    const Employee = require('../employees/employee.model');
    const Project = require('../projects/project.model');

    const recipientSet = new Set();
    const excludeSet = new Set((excludeUserIds || []).map((id) => id?.toString()));

    if (assignedTo) {
      const assignedId = typeof assignedTo === 'object' ? assignedTo._id || assignedTo.id : assignedTo;
      if (assignedId) recipientSet.add(assignedId.toString());
    }

    let projectDoc = null;
    if (projectId) {
      projectDoc = await Project.findById(projectId);
      if (projectDoc && projectDoc.projectManager) {
        const pmId = typeof projectDoc.projectManager === 'object'
          ? projectDoc.projectManager._id || projectDoc.projectManager.id
          : projectDoc.projectManager;
        if (pmId) recipientSet.add(pmId.toString());
      }
    }

    // Include all active ADMINs
    const activeAdmins = await Employee.find({ globalRole: 'ADMIN', isActive: true });
    for (const admin of activeAdmins) {
      recipientSet.add(admin._id.toString());
    }

    // Filter out excluded IDs (such as the actor performing the action)
    const validRecipients = Array.from(recipientSet).filter((rId) => !excludeSet.has(rId));
    if (validRecipients.length === 0) return [];

    const docsToCreate = validRecipients.map((recipientId) => ({
      recipient: recipientId,
      project: projectId || undefined,
      title,
      message,
      type,
      metadata: {
        ...metadata,
        projectId: projectDoc?.projectId || metadata.projectId,
        projectName: projectDoc?.projectName || metadata.projectName
      }
    }));

    return await Notification.insertMany(docsToCreate);
  } catch (err) {
    console.error('[NotificationService] notifyWithAdminsAndPMs error:', err.message);
    return [];
  }
}

async function markAsRead(notificationId) {
  return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
}

async function markAllAsRead(employeeId) {
  return await Notification.updateMany({ recipient: employeeId, isRead: false }, { isRead: true });
}

module.exports = {
  getEmployeeNotifications,
  notifyWithAdminsAndPMs,
  markAsRead,
  markAllAsRead
};