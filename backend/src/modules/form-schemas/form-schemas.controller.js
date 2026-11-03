const formSchemasService = require('./form-schemas.service');

class FormSchemasController {
  async getAll(req, res, next) {
    try {
      const schemas = await formSchemasService.getAllSchemas(req.query);
      res.status(200).json({
        success: true,
        count: schemas.length,
        data: schemas
      });
    } catch (err) {
      next(err);
    }
  }

  async getSchema(req, res, next) {
    try {
      const nodeId = req.params.nodeId;
      const projectId = req.params.projectId || req.query.projectId || 'DEFAULT';
      const schema = await formSchemasService.getSchema(nodeId, projectId);

      if (!schema) {
        return res.status(404).json({
          success: false,
          message: `Form schema for node '${nodeId}' not found.`
        });
      }

      res.status(200).json({
        success: true,
        data: schema
      });
    } catch (err) {
      next(err);
    }
  }

  async getSchemaWithFormData(req, res, next) {
    try {
      const nodeId = req.params.nodeId;
      const projectId = req.params.projectId || req.query.projectId;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'projectId is required to fetch schema with form data.'
        });
      }

      const result = await formSchemasService.getSchemaWithFormData(nodeId, projectId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async saveFormData(req, res, next) {
    try {
      const nodeId = req.params.nodeId;
      const projectId = req.params.projectId || req.body.projectId;
      const formData = (req.body && req.body.formData) ? req.body.formData : req.body;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'projectId is required to save form data.'
        });
      }

      const result = await formSchemasService.saveFormData(nodeId, projectId, formData, req.employee);
      res.status(200).json({
        success: true,
        message: 'Form data saved successfully.',
        data: result
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  async saveOrUpdateSchema(req, res, next) {
    try {
      const result = await formSchemasService.saveOrUpdateSchema({
        ...req.body,
        nodeId: req.params.nodeId || req.body.nodeId,
        projectId: req.params.projectId || req.body.projectId || 'DEFAULT'
      });
      res.status(200).json({
        success: true,
        message: 'Form schema saved successfully.',
        data: result
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
      const result = await formSchemasService.seedMasterFormSchemas(force);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FormSchemasController();
