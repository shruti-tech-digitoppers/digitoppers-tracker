const Activity = require('./activity.model');
const mongoose = require('mongoose');

class ActivityService {
  /**
   * Universal helper to record an activity cleanly without throwing errors to break caller workflows.
   */
  async log({ project, actor, actorName, actorEmail, action, description, resourceType = 'General', resourceId, metadata = {} }) {
    try {
      let projectId = project;
      if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
        // If passed as projectCode or string, search or ignore
        projectId = undefined;
      }

      let actorId = actor;
      if (actorId && !mongoose.Types.ObjectId.isValid(actorId)) {
        actorId = undefined;
      }

      return await Activity.create({
        project: projectId,
        actor: actorId,
        actorName: actorName || 'Team Member',
        actorEmail: actorEmail || '',
        action,
        description: description || action,
        resourceType,
        resourceId,
        metadata: metadata || {}
      });
    } catch (err) {
      console.warn('⚠️ [Activity Log Error]: Failed to record activity:', err.message);
      return null;
    }
  }

  /**
   * Retrieve project-specific activity history with optional filters and limit
   */
  async getProjectActivity(projectId, options = {}) {
    const { limit = 100, page = 1, action, resourceType } = options;
    const filter = {};

    if (mongoose.Types.ObjectId.isValid(projectId)) {
      filter.project = projectId;
    }

    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('actor', 'name email employeeCode department role designation')
        .populate('project', 'projectId projectName organization status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Activity.countDocuments(filter)
    ]);

    return {
      activities,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Retrieve all global activities with multi-faceted filtering, search, and pagination
   */
  async getAllActivities(options = {}) {
    const {
      project,
      actor,
      action,
      resourceType,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = options;

    const filter = {};

    if (project && mongoose.Types.ObjectId.isValid(project)) {
      filter.project = project;
    }

    if (actor && mongoose.Types.ObjectId.isValid(actor)) {
      filter.actor = actor;
    }

    if (action && action !== 'ALL') {
      filter.action = action;
    }

    if (resourceType && resourceType !== 'ALL') {
      filter.resourceType = resourceType;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { action: searchRegex },
        { description: searchRegex },
        { actorName: searchRegex },
        { actorEmail: searchRegex },
        { resourceType: searchRegex },
        { 'metadata.projectName': searchRegex },
        { 'metadata.nodeTitle': searchRegex },
        { 'metadata.requestTitle': searchRegex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('actor', 'name email employeeCode department role designation')
        .populate('project', 'projectId projectName organization status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Activity.countDocuments(filter)
    ]);

    return {
      activities,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take) || 1
    };
  }

  /**
   * Aggregate statistics for activities
   */
  async getActivityStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalActivities, todayActivities, recentActors, actionBreakdown] = await Promise.all([
      Activity.countDocuments(),
      Activity.countDocuments({ createdAt: { $gte: today } }),
      Activity.distinct('actor'),
      Activity.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      totalActivities,
      todayActivities,
      activeContributors: recentActors.filter(Boolean).length,
      topActions: actionBreakdown.map(a => ({ action: a._id, count: a.count }))
    };
  }
}

module.exports = new ActivityService();


