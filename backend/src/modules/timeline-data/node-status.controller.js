const timelineDependencyService = require('./timeline-dependency.service');
const nodeStatusService = require('./node-status.service');

class NodeStatusController {
  /**
   * Update node status with validations
   * PATCH /projects/:projectId/timeline/nodes/:nodeId/status
   */
  async updateStatus(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const nodeId = req.params.nodeId;
      const { status, comment, remarks } = req.body;

      if (!projectId || !nodeId) {
        return res.status(400).json({
          success: false,
          message: "'projectId' and 'nodeId' are required."
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "'status' is required."
        });
      }

      const node = await nodeStatusService.updateNodeStatus(
        projectId,
        nodeId,
        status,
        comment || remarks,
        req.employee,
        req.projectMembership
      );

      return res.status(200).json({
        success: true,
        message: 'Status updated successfully.',
        data: node,
        node
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Dedicated node dependency status check
   * GET /projects/:projectId/timeline/nodes/:nodeId/dependencies
   */
  async checkDependencies(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const nodeId = req.params.nodeId;

      if (!projectId || !nodeId) {
        return res.status(400).json({
          success: false,
          message: "'projectId' and 'nodeId' are required."
        });
      }

      const result = await timelineDependencyService.checkNodeDependencies(nodeId, projectId);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Pre-flight status eligibility check
   * GET /projects/:projectId/timeline/nodes/:nodeId/status-check
   */
  async checkEligibility(req, res, next) {
    try {
      const projectId = req.params.projectId || req.query.projectId;
      const nodeId = req.params.nodeId;

      if (!projectId || !nodeId) {
        return res.status(400).json({
          success: false,
          message: "'projectId' and 'nodeId' are required."
        });
      }

      const result = await nodeStatusService.checkEligibility(projectId, nodeId);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NodeStatusController();

