/**
 * Slack Notification Service for DigiTopper Operations Portal (Option 2 - Targeted Mentions)
 * Dispatches operational alerts to the dedicated #digitoppers-project-tracker channel
 * with direct <@SLACK_MEMBER_ID> tags for the assigned employee so only they receive push alerts.
 */

const { env, slackWebhookUrl, slackBotToken, slackChannel } = require('../../config/env');

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

// In-memory cache for resolved Slack users: employeeId / email -> { id, name, email, mention }
const memberCache = new Map();

// In-memory deduplication cache: drops identical messages dispatched within 6 seconds
const recentDispatches = new Map();

/**
 * Resolve an employee reference to a Slack Member Mention (<@USER_ID>)
 * Resolution hierarchy:
 * 1. Direct Slack User ID format (e.g. U01234567)
 * 2. In-memory cache
 * 3. MongoDB Employee.slackMemberId
 * 4. Slack Web API `users.lookupByEmail` (if SLACK_BOT_TOKEN is configured)
 * 5. Fallback markdown link: *Name* (<mailto:email|email>)
 *
 * @param {string|Object} target - Employee ID, Email, or Employee document
 * @returns {Promise<{ id: string|null, name: string, email: string|null, mention: string }>}
 */
async function resolveSlackMember(target) {
  if (!target) return null;

  // 1. Target is already a raw Slack user ID (starts with U or W, alphanumeric, 9-12 chars)
  if (typeof target === 'string' && /^[UW][A-Z0-9]{8,12}$/.test(target.trim())) {
    const sid = target.trim();
    return { id: sid, name: sid, email: null, mention: `<@${sid}>` };
  }

  // 2. Check in-memory cache
  const cacheKey = typeof target === 'string'
    ? target.trim().toLowerCase()
    : (target._id ? target._id.toString() : null);

  if (cacheKey && memberCache.has(cacheKey)) {
    return memberCache.get(cacheKey);
  }

  const Employee = require('../employees/employee.model');
  let employeeDoc = null;

  if (typeof target === 'object' && target !== null) {
    if (target.slackMemberId && target.slackMemberId.trim()) {
      const sid = target.slackMemberId.trim();
      const res = {
        id: sid,
        name: target.name || 'Team Member',
        email: target.email || null,
        mention: `<@${sid}>`
      };
      if (cacheKey) memberCache.set(cacheKey, res);
      return res;
    }
    if (target._id) {
      employeeDoc = target;
    }
  }

  // 3. Look up employee in MongoDB (only if mongoose is connected)
  const mongoose = require('mongoose');
  if (!employeeDoc && typeof target === 'string' && mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      if (mongoose.Types.ObjectId.isValid(target) && target.length === 24) {
        employeeDoc = await Employee.findById(target).select('name email slackMemberId').lean();
      } else if (target.includes('@')) {
        employeeDoc = await Employee.findOne({ email: target.trim().toLowerCase() }).select('name email slackMemberId').lean();
      }
    } catch (dbErr) {
      console.warn('[SlackService] DB lookup warning:', dbErr.message);
    }
  }

  // If found in MongoDB with saved slackMemberId
  if (employeeDoc && employeeDoc.slackMemberId && employeeDoc.slackMemberId.trim()) {
    const sid = employeeDoc.slackMemberId.trim();
    const res = {
      id: sid,
      name: employeeDoc.name || 'Team Member',
      email: employeeDoc.email || null,
      mention: `<@${sid}>`
    };
    if (employeeDoc._id) memberCache.set(employeeDoc._id.toString(), res);
    if (employeeDoc.email) memberCache.set(employeeDoc.email.toLowerCase(), res);
    return res;
  }

  // 4. If slackMemberId is not yet saved, try looking up by email via Slack API
  const botToken = process.env.SLACK_BOT_TOKEN || slackBotToken;
  const emailToLookup = employeeDoc?.email || (typeof target === 'string' && target.includes('@') ? target.trim() : null);

  if (botToken && emailToLookup) {
    try {
      const url = `https://slack.com/api/users.lookupByEmail?email=${encodeURIComponent(emailToLookup.toLowerCase())}`;
      const apiRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${botToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const data = await apiRes.json();
      if (data && data.ok && data.user && data.user.id) {
        const sid = data.user.id;
        const res = {
          id: sid,
          name: employeeDoc?.name || data.user.real_name || data.user.name || 'Team Member',
          email: emailToLookup,
          mention: `<@${sid}>`
        };

        // Cache in memory
        if (employeeDoc?._id) memberCache.set(employeeDoc._id.toString(), res);
        memberCache.set(emailToLookup.toLowerCase(), res);

        // Asynchronously update MongoDB so future lookups are instant
        if (employeeDoc?._id) {
          Employee.findByIdAndUpdate(employeeDoc._id, { slackMemberId: sid }).catch((err) => {
            console.warn('[SlackService] Could not persist slackMemberId to DB:', err.message);
          });
        }

        return res;
      }
    } catch (apiErr) {
      console.warn('[SlackService] Slack users.lookupByEmail failed:', apiErr.message);
    }
  }

  // 5. Graceful fallback when Slack Member ID cannot be determined
  const displayName = employeeDoc?.name || (typeof target === 'string' && !target.includes('@') ? target : 'Team Member');
  const displayEmail = emailToLookup || employeeDoc?.email || null;
  const fallbackMention = displayEmail ? `*${displayName}* (<mailto:${displayEmail}|${displayEmail}>)` : `*${displayName}*`;

  const fallback = {
    id: null,
    name: displayName,
    email: displayEmail,
    mention: fallbackMention
  };

  if (cacheKey) memberCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Send a notification payload to configured Slack channel
 * Automatically resolves and mentions the assigned employee with <@MEMBER_ID>
 *
 * @param {Object} payload
 * @param {string} payload.title
 * @param {string} payload.message
 * @param {string} [payload.type]
 * @param {string} [payload.projectName]
 * @param {string} [payload.projectId]
 * @param {string|Object|Array} [payload.assignedTo] - Target employee to @mention
 * @param {Array<string>} [payload.recipients]
 * @param {Object} [payload.metadata]
 */
async function sendSlackNotification({
  title,
  message,
  type = 'GENERAL',
  projectName,
  projectId,
  assignedTo,
  recipients = [],
  metadata = {}
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL || slackWebhookUrl;
  const botToken = process.env.SLACK_BOT_TOKEN || slackBotToken;
  const targetChannel = process.env.SLACK_CHANNEL || slackChannel || '#digitoppers-project-tracker';

  if (!webhookUrl && !botToken) {
    // Slack not configured
    return { success: false, skipped: true, reason: 'Neither SLACK_WEBHOOK_URL nor SLACK_BOT_TOKEN configured' };
  }

  // Deduplication guard: ignore identical notification dispatches within 6 seconds
  const dedupeKey = `${title}|${projectId || projectName || ''}|${(typeof message === 'string' ? message.slice(0, 50) : '')}`;
  const now = Date.now();
  if (recentDispatches.has(dedupeKey)) {
    const lastDispatched = recentDispatches.get(dedupeKey);
    if (now - lastDispatched < 6000) {
      return { success: true, skipped: true, reason: 'Duplicate dispatch ignored' };
    }
  }
  recentDispatches.set(dedupeKey, now);

  if (recentDispatches.size > 150) {
    for (const [k, ts] of recentDispatches.entries()) {
      if (now - ts > 60000) recentDispatches.delete(k);
    }
  }

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.GENERAL;

  // Resolve assigned members for targeted @mentioning
  const rawAssignees = Array.isArray(assignedTo) ? assignedTo : (assignedTo ? [assignedTo] : []);
  const resolvedAssignees = [];

  for (const assignee of rawAssignees) {
    if (assignee) {
      try {
        const resolved = await resolveSlackMember(assignee);
        if (resolved) resolvedAssignees.push(resolved);
      } catch (err) {
        console.warn('[SlackService] Member resolution warning:', err.message);
      }
    }
  }

  const mentionStrings = resolvedAssignees.map((r) => r.mention).filter(Boolean);
  const mentionAlert = mentionStrings.length > 0 ? mentionStrings.join(' ') : null;

  // Format the top-level text: This is the field Slack uses for OS push notifications & sound alerts!
  // Including <@MEMBER_ID> here alerts ONLY the tagged person.
  let topLevelText = '';
  if (mentionAlert) {
    topLevelText = `${config.emoji} *[DigiTopper Tracker]* ${mentionAlert} — *${title}*\n${message}`;
  } else {
    topLevelText = `${config.emoji} *[DigiTopper Tracker]* *${title}*\n${message}`;
  }

  const projectDisplay = projectName ? `${projectName} (${projectId || 'N/A'})` : (projectId || null);

  const fields = [
    {
      title: 'Event Category',
      value: `${config.emoji} ${config.label}`,
      short: true
    }
  ];

  if (mentionStrings.length > 0) {
    fields.push({
      title: '👤 Assigned Member',
      value: mentionStrings.join(', '),
      short: true
    });
  }

  if (projectDisplay) {
    fields.push({
      title: '🏢 Project',
      value: projectDisplay,
      short: true
    });
  }

  if (metadata && (metadata.stageName || metadata.stage)) {
    const stageVal = metadata.stageName || metadata.stage;
    const stageStatus = metadata.status ? ` (${metadata.status})` : '';
    fields.push({
      title: '🚀 Stage',
      value: `${stageVal}${stageStatus}`,
      short: true
    });
  }

  if (metadata && (metadata.nodeName || metadata.nodeKey)) {
    fields.push({
      title: '📌 Task Node',
      value: metadata.nodeName || metadata.nodeKey,
      short: true
    });
  }

  if (metadata && (metadata.reviewNotes || metadata.comment)) {
    fields.push({
      title: '📝 Notes',
      value: metadata.reviewNotes || metadata.comment,
      short: false
    });
  }

  if (recipients && recipients.length > 0 && mentionStrings.length === 0) {
    fields.push({
      title: '👥 Notified Team',
      value: recipients.length > 3 ? `${recipients.slice(0, 3).join(', ')} +${recipients.length - 3} more` : recipients.join(', '),
      short: true
    });
  }

  const slackPayload = {
    channel: targetChannel,
    text: topLevelText,
    attachments: [
      {
        color: config.color,
        title: `${config.emoji} ${title}`,
        text: message,
        fields,
        footer: `DigiTopper Ops & Tracker • Channel: ${targetChannel}`,
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };

  try {
    let res;
    if (webhookUrl && webhookUrl.startsWith('http')) {
      // Primary delivery: Incoming Webhook
      res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });
    } else if (botToken) {
      // Secondary delivery: chat.postMessage via Slack Bot Token
      res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slackPayload)
      });
    }

    if (!res || !res.ok) {
      const errText = res ? await res.text() : 'No response';
      console.warn(`[SlackService] Slack responded with status ${res?.status}: ${errText}`);
      return { success: false, status: res?.status, error: errText };
    }

    return {
      success: true,
      channel: targetChannel,
      mentions: mentionStrings
    };
  } catch (error) {
    console.error(`[SlackService] Failed to dispatch Slack notification:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send a test notification to verify channel posting and @mention resolution
 * @param {string} userEmailOrId
 */
async function sendSlackTestMessage(userEmailOrId = 'Admin') {
  return await sendSlackNotification({
    title: 'Slack Targeted Notifications Configured Successfully!',
    message: `Option 2 integration active in #digitoppers-project-tracker. Test alert triggered by ${userEmailOrId}. Assigned users will receive targeted push alerts with their Slack @mention.`,
    type: 'GENERAL',
    projectName: 'DigiTopper System Notification Check',
    projectId: 'SYS-OPS-CHECK',
    assignedTo: userEmailOrId,
    metadata: {
      status: 'VERIFIED',
      stageName: 'Option 2 - Targeted Mentions'
    }
  });
}

module.exports = {
  sendSlackNotification,
  sendSlackTestMessage,
  resolveSlackMember
};
