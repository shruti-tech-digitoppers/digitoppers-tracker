/**
 * Slack Notification Service for DigiTopper Operations Portal
 * Dispatches real-time operational notifications and milestone updates to Slack channels via Webhook.
 */

const { env } = require('../../config/env');

// Type-to-Color & Emoji Map
const TYPE_CONFIG = {
  PROJECT_ASSIGNED: { emoji: '🏢', color: '#3B82F6', label: 'Project Assigned' },
  MEMBER_ASSIGNED: { emoji: '👤', color: '#3B82F6', label: 'Member Assigned' },
  TASK_ASSIGNED: { emoji: '📌', color: '#0EA5E9', label: 'Task Assigned' },
  ASSIGNMENT: { emoji: '🎯', color: '#0284C7', label: 'Assignment' },
  STATUS_UPDATE: { emoji: '🔄', color: '#10B981', label: 'Status Update' },
  STAGE_UPDATED: { emoji: '🚀', color: '#059669', label: 'Stage Milestone Updated' },
  TIMELINE_UPDATED: { emoji: '⏱️', color: '#10B981', label: 'Timeline Updated' },
  DEPENDENCY_UNLOCKED: { emoji: '🔓', color: '#F59E0B', label: 'Dependency Unlocked' },
  PROJECT_REQUEST_REVIEW: { emoji: '📋', color: '#F59E0B', label: 'Project Request Pending Review' },
  PROJECT_REQUEST_APPROVED: { emoji: '✅', color: '#10B981', label: 'Project Request Approved' },
  PROJECT_REQUEST_REJECTED: { emoji: '❌', color: '#EF4444', label: 'Project Request Rejected' },
  GENERAL: { emoji: '🔔', color: '#6366F1', label: 'Notification' }
};

/**
 * Send a notification payload to configured Slack Webhook
 * @param {Object} payload
 * @param {string} payload.title
 * @param {string} payload.message
 * @param {string} [payload.type]
 * @param {string} [payload.projectName]
 * @param {string} [payload.projectId]
 * @param {Array<string>} [payload.recipients]
 * @param {Object} [payload.metadata]
 */
async function sendSlackNotification({
  title,
  message,
  type = 'GENERAL',
  projectName,
  projectId,
  recipients = [],
  metadata = {}
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('http')) {
    // Slack not configured or disabled
    return { success: false, skipped: true, reason: 'SLACK_WEBHOOK_URL not configured' };
  }

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.GENERAL;
  const projectDisplay = projectName ? `${projectName} (${projectId || 'N/A'})` : (projectId || null);

  const fields = [
    {
      title: 'Event Category',
      value: `${config.emoji} ${config.label}`,
      short: true
    }
  ];

  if (projectDisplay) {
    fields.push({
      title: 'Project',
      value: projectDisplay,
      short: true
    });
  }

  if (metadata && metadata.stageName) {
    fields.push({
      title: 'Stage',
      value: `${metadata.stageName} (${metadata.status || 'UPDATED'})`,
      short: true
    });
  }

  if (metadata && metadata.nodeName) {
    fields.push({
      title: 'Task Node',
      value: metadata.nodeName,
      short: true
    });
  }

  if (recipients && recipients.length > 0) {
    fields.push({
      title: 'Notified Team',
      value: recipients.length > 3 ? `${recipients.slice(0, 3).join(', ')} +${recipients.length - 3} more` : recipients.join(', '),
      short: true
    });
  }

  const slackPayload = {
    text: `${config.emoji} *[DigiTopper Tracker]* ${title}: ${message}`,
    attachments: [
      {
        color: config.color,
        title: `${config.emoji} ${title}`,
        text: message,
        fields,
        footer: 'DigiTopper Ops & Project Tracker Portal',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[SlackService] Webhook responded with status ${res.status}: ${errText}`);
      return { success: false, status: res.status, error: errText };
    }

    return { success: true };
  } catch (error) {
    console.error(`[SlackService] Failed to send Slack notification:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a quick test notification to verify Slack connectivity
 */
async function sendSlackTestMessage(userEmail = 'Admin') {
  return await sendSlackNotification({
    title: 'Slack Integration Verified Successfully!',
    message: `DigiTopper Project Tracker has successfully established real-time notification integration with Slack. Triggered by ${userEmail}.`,
    type: 'GENERAL',
    projectName: 'DigiTopper System Notification Check',
    projectId: 'SYS-OPS-CHECK',
    recipients: [userEmail],
    metadata: {
      status: 'VERIFIED',
      stageName: 'System Integration'
    }
  });
}

module.exports = {
  sendSlackNotification,
  sendSlackTestMessage
};
