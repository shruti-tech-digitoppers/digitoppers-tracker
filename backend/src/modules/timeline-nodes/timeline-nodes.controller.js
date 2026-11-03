const timelineNodesService = require('./timeline-nodes.service');

class TimelineNodesController {
  async getAll(req, res, next) {
    try {
      const nodes = await timelineNodesService.getAllNodes(req.query);
      res.status(200).json({
        success: true,
        count: nodes.length,
        data: nodes
      });
    } catch (err) {
      next(err);
    }
  }

  async getTree(req, res, next) {
    try {
      const tree = await timelineNodesService.getHierarchyTree();
      res.status(200).json({
        success: true,
        count: tree.length,
        data: tree
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const node = await timelineNodesService.getNodeById(req.params.id);
      if (!node) {
        return res.status(404).json({
          success: false,
          message: `Static timeline node '${req.params.id}' not found.`
        });
      }
      res.status(200).json({
        success: true,
        data: node
      });
    } catch (err) {
      next(err);
    }
  }

  async checkHasSubstages(req, res, next) {
    try {
      const hasSub = await timelineNodesService.hasSubstages(req.params.id);
      res.status(200).json({
        success: true,
        stageId: req.params.id,
        hasSubstages: hasSub
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const node = await timelineNodesService.createNode(req.body);
      res.status(201).json({
        success: true,
        message: 'Static timeline node created successfully.',
        data: node
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  async update(req, res, next) {
    try {
      const node = await timelineNodesService.updateNode(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Static timeline node updated successfully.',
        data: node
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  async delete(req, res, next) {
    try {
      const result = await timelineNodesService.deleteNode(req.params.id);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  async seed(req, res, next) {
    try {
      const force = req.query.force === 'true' || req.body.force === true;
      const result = await timelineNodesService.seedStaticTimelineNodes(force);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TimelineNodesController();

