const Notification = require('./notifications.model');

async function getEmployeeNotifications(employeeId) {
  const notifications = await Notification.find({ recipient: employeeId }).sort({ createdAt: -1 });
  return notifications;
}

async function notifyWithAdminsAndPMs(data) {
  // Aapka notification creation logic yahan hoga
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