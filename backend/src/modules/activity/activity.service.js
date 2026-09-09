const Activity = require('./activity.model');

class ActivityService {
  async getProjectActivity(projectId) {
    return await Activity.find({ project: projectId }).populate('actor', 'name email employeeCode').sort({ createdAt: -1 });
  }
}

module.exports = new ActivityService();
