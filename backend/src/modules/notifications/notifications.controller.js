const notificationService = require('./notifications.service');

const getNotifications = async (req, res, next) => {
  try {
    const employeeId = req.employee?._id || req.user?._id || req.user?.id;
    const { days, category, subCategory } = req.query;
    
    const notifications = await notificationService.getEmployeeNotifications(employeeId, {
      days,
      category,
      subCategory
    });

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
    const isRead = req.body?.isRead !== undefined ? Boolean(req.body.isRead) : true;
    const updated = await notificationService.markAsRead(id, isRead);

    res.status(200).json({
      success: true,
      message: `Notification marked as ${isRead ? 'read' : 'unread'}`,
      notification: updated,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const employeeId = req.employee?._id || req.user?._id || req.user?.id;
    const isRead = req.body?.isRead !== undefined ? Boolean(req.body.isRead) : true;
    await notificationService.markAllAsRead(employeeId, { isRead });

    res.status(200).json({
      success: true,
      message: `All notifications marked as ${isRead ? 'read' : 'unread'}`
    });
  } catch (error) {
    next(error);
  }
};

const createNotification = async (req, res, next) => {
  try {
    const actorId = req.employee?._id || req.user?._id || req.user?.id;
    const {
      recipients = [],
      assignedTo,
      projectId,
      title,
      message,
      type = 'TASK_ASSIGNED',
      metadata = {}
    } = req.body;

    const recipientList = Array.isArray(recipients) && recipients.length > 0
      ? recipients
      : (assignedTo ? [assignedTo] : []);

    let allCreated = [];

    if (recipientList.length > 0) {
      for (const rec of recipientList) {
        const created = await notificationService.notifyWithAdminsAndPMs({
          assignedTo: rec,
          projectId,
          title,
          message,
          type,
          metadata
        });
        if (Array.isArray(created)) allCreated.push(...created);
      }
    } else {
      const created = await notificationService.notifyWithAdminsAndPMs({
        projectId,
        title,
        message,
        type,
        metadata
      });
      if (Array.isArray(created)) allCreated.push(...created);
    }

    res.status(201).json({
      success: true,
      count: allCreated.length,
      notifications: allCreated,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
};

const testSlackNotification = async (req, res, next) => {
  try {
    const userTarget = req.employee || req.user?.email || 'Admin';
    const { sendSlackTestMessage } = require('./slack.service');
    const result = await sendSlackTestMessage(userTarget);

    if (result.skipped) {
      return res.status(400).json({
        success: false,
        message: 'SLACK_WEBHOOK_URL is not configured in environment variables. Please add SLACK_WEBHOOK_URL to your .env or Render dashboard.',
        details: result
      });
    }

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: 'Failed to deliver message to Slack Webhook.',
        error: result.error || result
      });
    }

    res.status(200).json({
      success: true,
      message: 'Slack test notification sent successfully! Check your Slack channel.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  testSlackNotification
};