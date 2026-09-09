const notificationService = require('./notifications.service');

const getNotifications = async (req, res, next) => {
  try {
    const employeeId = req.employee?._id || req.user?._id || req.user?.id;
    
    const notifications = await notificationService.getEmployeeNotifications(employeeId);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications: notifications,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const employeeId = req.employee?._id || req.user?._id || req.user?.id;
    await notificationService.markAllAsRead(employeeId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};