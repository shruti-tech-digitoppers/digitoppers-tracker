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
    enum: ['ASSIGNMENT', 'STATUS_UPDATE', 'DEPENDENCY_UNLOCKED', 'GENERAL'],
    default: 'GENERAL'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);