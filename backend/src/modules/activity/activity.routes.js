const express = require('express');
const router = express.Router({ mergeParams: true });
const activityService = require('./activity.service');
const { protect } = require('../../core/auth');
const { verifyProjectPermission } = require('../../core/authorization');
const { DESIGNATIONS } = require('../../core/constants');

router.get('/', protect, verifyProjectPermission([DESIGNATIONS.PROJECT_MANAGER, DESIGNATIONS.CONTRIBUTOR, DESIGNATIONS.VIEWER]), async (req, res, next) => {
  try {
    const activities = await activityService.getProjectActivity(req.params.projectId);
    res.status(200).json({ success: true, count: activities.length, data: activities });
  } catch (err) { next(err); }
});

module.exports = router;
