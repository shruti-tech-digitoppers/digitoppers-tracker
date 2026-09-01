const express = require('express');
const notificationsController = require('./notifications.controller');
const { protect } = require('../../core/auth');

const router = express.Router();

router.route('/')
  .get(protect, notificationsController.getNotifications);

router.route('/read-all')
  .patch(protect, notificationsController.markAllAsRead);

router.route('/:id/read')
  .patch(protect, notificationsController.markAsRead);

module.exports = router;