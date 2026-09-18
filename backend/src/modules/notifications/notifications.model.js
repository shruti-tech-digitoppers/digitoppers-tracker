const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: [true, 'Notification must belong to an employee']
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  title: {
    type: String,
    required: [true, 'Notification title is required']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required']
  },
  type: {
    type: String,
    enum: [
      'ASSIGNMENT',
      'PROJECT_ASSIGNED',
      'TASK_ASSIGNED',
      'MEMBER_ASSIGNED',
      'STATUS_UPDATE',
      'STAGE_UPDATED',
      'TIMELINE_UPDATED',
      'DEPENDENCY_UNLOCKED',
      'GENERAL',
      'PROJECT_REQUEST_REVIEW',
      'PROJECT_REQUEST_APPROVED',
      'PROJECT_REQUEST_REJECTED',
      'UPDATE'
    ],
    default: 'GENERAL'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);