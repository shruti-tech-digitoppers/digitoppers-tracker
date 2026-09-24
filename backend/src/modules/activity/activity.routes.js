const express = require('express');
const router = express.Router({ mergeParams: true });
const activityService = require('./activity.service');
const { protect } = require('../../core/auth');

// Stats aggregation endpoint (mounted on /api/v1/activities/stats)
router.get('/stats', protect, async (req, res, next) => {
  try {
    const stats = await activityService.getActivityStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// Activity list endpoint (mounted on both /api/v1/activities and /api/v1/projects/:projectId/activity)
router.get('/', protect, async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.query.project;
    if (projectId) {
      const result = await activityService.getProjectActivity(projectId, req.query);
      return res.status(200).json({
        success: true,
        count: result.activities.length,
        total: result.total,
        page: result.page,
        pages: result.pages,
        data: result.activities,
        activities: result.activities
      });
    }

    const result = await activityService.getAllActivities(req.query);
    return res.status(200).json({
      success: true,
      count: result.activities.length,
      total: result.total,
      page: result.page,
      pages: result.pages,
      data: result.activities,
      activities: result.activities
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


