const Activity = require('./activity.model');

class ActivityService {
  async getProjectActivity(projectId) {
    return await Activity.find({ project: projectId }).populate('actor', 'name email employeeCode').sort({ createdAt: -1 });
  }

  async getAllActivities(limit = 100) {
    return await Activity.find()
      .populate('actor', 'name email employeeCode')
      .populate('project', 'projectId projectName organization status')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

module.exports = new ActivityService();

