const timelineService = require('./timeline.service');
const { AppError } = require('../../core/errors');
const { GLOBAL_ROLES } = require('../../core/constants');

class TimelineController {
  async getTimeline(req, res, next) {
    try {
      const data = await timelineService.getTimelineHierarchy(req.params.projectId);
      res.status(200).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getNode(req, res, next) {
    try {
      const node = await timelineService.getNodeById(req.params.projectId, req.params.nodeId);
      res.status(200).json({ success: true, data: node });
    } catch (err) { next(err); }
  }

  async getChildren(req, res, next) {
    try {
      const children = await timelineService.getChildren(req.params.projectId, req.params.nodeId);
      res.status(200).json({ success: true, data: children });
    } catch (err) { next(err); }
  }

  async assignNode(req, res, next) {
    try {
      const node = await timelineService.assignNode(req.params.projectId, req.params.nodeId, req.body.employeeId, req.employee._id);
      res.status(200).json({ success: true, data: node, message: 'Node assigned successfully' });
    } catch (err) { next(err); }
  }

  async updateStatus(req, res, next) {
    try {
      const node = await timelineService.updateNodeStatus(
        req.params.projectId,
        req.params.nodeId,
        req.body.status,
        req.body.comment,
        req.employee,
        req.projectMembership
      );
      res.status(200).json({ success: true, data: node, message: 'Node status updated successfully' });
    } catch (err) { next(err); }
  }

  async getForm(req, res, next) {
    try {
      const node = await timelineService.getNodeById(req.params.projectId, req.params.nodeId);
      res.status(200).json({ success: true, data: { formSchema: node.formSchema || null, formData: node.formData || {} } });
    } catch (err) { next(err); }
  }

  async updateForm(req, res, next) {
    try {
      const formData = (req.body && typeof req.body.formData === 'object' && req.body.formData !== null) 
        ? req.body.formData 
        : (req.body || {});

      const node = await timelineService.updateNodeForm(
        req.params.projectId,
        req.params.nodeId,
        formData,
        req.employee,
        req.projectMembership
      );
      res.status(200).json({ 
        success: true, 
        data: { node, formData: node.formData || {} }, 
        message: 'Form updated successfully' 
      });
    } catch (err) { next(err); }
  }

  // Admin / PM only: reset and re-initialize timeline nodes from current config
  async resetTimeline(req, res, next) {
    try {
      // Only PM can reset (admin is system-level, no project authority)
      const result = await timelineService.resetTimelineForProject(req.params.projectId);
      res.status(200).json({ success: true, data: result, message: 'Timeline reset and re-initialized from current config.' });
    } catch (err) { next(err); }
  }
}

module.exports = new TimelineController();
