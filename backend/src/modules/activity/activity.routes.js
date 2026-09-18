const express = require('express');
const router = express.Router({ mergeParams: true });
const activityService = require('./activity.service');
const { protect } = require('../../core/auth');

router.get('/', protect, async (req, res, next) => {
  try {
    if (req.params.projectId) {
      const activities = await activityService.getProjectActivity(req.params.projectId);
      return res.status(200).json({ success: true, count: activities.length, data: activities });
    }
    const activities = await activityService.getAllActivities(100);
    return res.status(200).json({ success: true, count: activities.length, data: activities });
  } catch (err) { next(err); }
});

module.exports = router;

