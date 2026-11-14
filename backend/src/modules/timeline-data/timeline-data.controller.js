const timelineDataService = require('./timeline-data.service');
const nodeStatusController = require('./node-status.controller');

class TimelineDataController {
  async getTimeline(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      if (!projectId) {
        return res.status(400).json({ success: false, message: 'projectId is required.' });
      }
      const data = await timelineDataService.getTimelineHierarchy(projectId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRoadmap(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      if (!projectId) {
        return res.status(400).json({ success: false, message: 'projectId is required.' });
      }
      const hierarchy = await timelineDataService.getTimelineHierarchy(projectId);
      res.status(200).json({ success: true, data: hierarchy.timeline || hierarchy });
    } catch (err) {
      next(err);
    }
  }

  async getNode(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const nodeId = req.params.nodeId;
      if (!projectId || !nodeId) {
        return res.status(400).json({ success: false, message: 'projectId and nodeId are required.' });
      }
      const node = await timelineDataService.getNodeById(projectId, nodeId);
      res.status(200).json({ success: true, data: node, node });
    } catch (err) {
      next(err);
    }
  }

  async getChildren(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const nodeId = req.params.nodeId;
      const children = await timelineDataService.getChildren(projectId, nodeId);
      res.status(200).json({ success: true, data: children });
    } catch (err) {
      next(err);
    }
  }

  async assignNode(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const nodeId = req.params.nodeId;
      const employeeId = req.body.employeeId !== undefined ? req.body.employeeId : req.body.assignedTo;
      const actorId = req.employee?._id || null;

      const node = await timelineDataService.assignNode(projectId, nodeId, employeeId, actorId);
      res.status(200).json({
        success: true,
        message: 'Node assigned successfully.',
        data: node,
        node
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    return nodeStatusController.updateStatus(req, res, next);
  }

  async checkEligibility(req, res, next) {
    return nodeStatusController.checkEligibility(req, res, next);
  }

  async getForm(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const nodeId = req.params.nodeId;
      const node = await timelineDataService.getNodeById(projectId, nodeId);
      res.status(200).json({
        success: true,
        data: {
          formSchema: node.formSchema || null,
          formData: node.formData || {}
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateForm(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const nodeId = req.params.nodeId;
      const formData = (req.body && typeof req.body.formData === 'object' && req.body.formData !== null)
        ? req.body.formData
        : (req.body || {});

      const node = await timelineDataService.updateNodeForm(
        projectId,
        nodeId,
        formData,
        req.employee,
        req.projectMembership
      );

      res.status(200).json({
        success: true,
        message: 'Form updated successfully.',
        data: { node, formData: node.formData || {} },
        node
      });
    } catch (err) {
      next(err);
    }
  }

  async resetTimeline(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const result = await timelineDataService.resetTimelineForProject(projectId);
      res.status(200).json({
        success: true,
        message: 'Timeline reset and re-initialized from static blueprint.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  // Collection level / Utility APIs
  async getByProject(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      if (!projectId) {
        return res.status(400).json({ success: false, message: 'projectId is required.' });
      }
      const records = await timelineDataService.getByProject(projectId, req.query);
      res.status(200).json({
        success: true,
        count: records.length,
        data: records
      });
    } catch (err) {
      next(err);
    }
  }

  async getHierarchyTree(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      if (!projectId) {
        return res.status(400).json({ success: false, message: 'projectId is required.' });
      }
      const tree = await timelineDataService.getProjectHierarchyTree(projectId);
      res.status(200).json({
        success: true,
        projectId,
        data: tree
      });
    } catch (err) {
      next(err);
    }
  }

  async getNodeData(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const nodeId = req.params.nodeId;
      const data = await timelineDataService.getNodeData(projectId, nodeId);
      if (!data) {
        return res.status(404).json({ success: false, message: `Data for node '${nodeId}' not found.` });
      }
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async initialize(req, res, next) {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const { pmId, coreProject } = req.body;
      const result = await timelineDataService.initializeProjectTimelineData(projectId, pmId, coreProject);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async saveNodeData(req, res, next) {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const nodeId = req.params.nodeId || req.body.nodeId;
      const record = await timelineDataService.saveNodeData({
        ...req.body,
        projectId,
        nodeId
      });
      res.status(200).json({
        success: true,
        message: 'Timeline data saved successfully.',
        data: record
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateFormData(req, res, next) {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const nodeId = req.params.nodeId || req.body.nodeId;
      const { formData } = req.body;
      const record = await timelineDataService.updateFormData(projectId, nodeId, formData);
      res.status(200).json({
        success: true,
        message: 'Form data updated successfully.',
        data: record
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

    async updateDueDate(req, res, next) {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const nodeId = req.params.nodeId || req.body.nodeId;
      const { dueDate } = req.body;
      const record = await timelineDataService.updateDueDate(projectId, nodeId, dueDate);
      const nodeDetail = await timelineDataService.getNode(projectId, nodeId).catch(() => null);
      res.status(200).json({
        success: true,
        message: 'Due date updated successfully.',
        data: nodeDetail || record
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateRemarks(req, res, next) {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      const nodeId = req.params.nodeId || req.body.nodeId;
      const { remarks } = req.body;
      const record = await timelineDataService.updateRemarks(projectId, nodeId, remarks);
      res.status(200).json({
        success: true,
        message: 'Remarks updated successfully.',
        data: record
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new TimelineDataController();
