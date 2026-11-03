const FormSchema = require('./form-schema.model');
const TimelineNodeStatic = require('../timeline-nodes/timeline-node.model');
const TimelineData = require('../timeline-data/timeline-data.model');
const timelineConfig = require('../../config/timeline');

class FormSchemasService {
  /**
   * Normalize projectId
   */
  _normalizeProjectId(projectId) {
    if (!projectId || projectId === 'null' || projectId === 'undefined') return 'DEFAULT';
    return String(projectId).toUpperCase().trim();
  }

  /**
   * Get form schema definition for a node and project
   * Priority:
   * 1. Project-specific overridden schema (projectId, nodeId)
   * 2. Default master schema ('DEFAULT', nodeId)
   * 3. Static timeline_nodes formSchema
   * @param {string} nodeId
   * @param {string} [projectId='DEFAULT']
   */
  async getSchema(nodeId, projectId = 'DEFAULT') {
    if (!nodeId) return null;
    const projId = this._normalizeProjectId(projectId);

    // 1. Try project-specific schema
    if (projId !== 'DEFAULT') {
      const projectSchema = await FormSchema.findOne({
        projectId: projId,
        nodeId: nodeId,
        isActive: true
      }).lean();
      if (projectSchema) return projectSchema;
    }

    // 2. Try default master schema
    const defaultSchema = await FormSchema.findOne({
      projectId: 'DEFAULT',
      nodeId: nodeId,
      isActive: true
    }).lean();
    if (defaultSchema) return defaultSchema;

    // 3. Fallback: Check TimelineNodeStatic collection
    const staticNode = await TimelineNodeStatic.findOne({ id: nodeId }).lean();
    if (staticNode && staticNode.formSchema && Array.isArray(staticNode.formSchema.fields)) {
      return {
        id: `FS_DEFAULT_${nodeId}`,
        nodeId: nodeId,
        projectId: 'DEFAULT',
        title: `${staticNode.name} Form`,
        fields: staticNode.formSchema.fields,
        version: 'v1',
        isActive: true
      };
    }

    return null;
  }

  /**
   * Get combined schema definition AND runtime form data values
   * "sb usme hi form datahga jisme key jo hogi wo form schema mein values hai wo form data mein hoga"
   *
   * @param {string} nodeId
   * @param {string} projectId
   */
  async getSchemaWithFormData(nodeId, projectId) {
    if (!nodeId || !projectId) {
      throw new Error("Both 'nodeId' and 'projectId' are required.");
    }
    const projId = this._normalizeProjectId(projectId);

    // 1. Get Schema
    let schema = await this.getSchema(nodeId, projId);
    if (!schema) {
      // Auto seed if database schemas empty
      await this.seedMasterFormSchemas(false);
      schema = await this.getSchema(nodeId, projId);
    }

    // 2. Get Runtime Data from timeline_data collection
    const runtimeRecord = await TimelineData.findOne({
      projectId: projId,
      nodeId: nodeId
    }).populate('assignedTo', 'name email employeeCode designation').lean();

    const rawFormData = (runtimeRecord && runtimeRecord.formData) ? runtimeRecord.formData : {};
    const schemaFields = (schema && Array.isArray(schema.fields)) ? schema.fields : [];

    // 3. Build merged fields where every schema key has its runtime value
    const fieldsWithValues = schemaFields.map((field) => {
      const key = field.key;
      const value = rawFormData[key] !== undefined ? rawFormData[key] : (field.defaultValue ?? null);
      return {
        key: field.key,
        label: field.label,
        type: field.type,
        required: Boolean(field.required),
        options: field.options || [],
        hint: field.hint || '',
        placeholder: field.placeholder || '',
        defaultValue: field.defaultValue ?? null,
        value: value
      };
    });

    return {
      nodeId,
      projectId: projId,
      status: runtimeRecord?.status || 'NOT_STARTED',
      assignedTo: runtimeRecord?.assignedTo || null,
      completionDate: runtimeRecord?.completionDate || null,
      remarks: runtimeRecord?.remarks || '',
      schema: {
        id: schema?.id || `FS_${projId}_${nodeId}`,
        title: schema?.title || `${nodeId} Form`,
        version: schema?.version || 'v1',
        fields: schemaFields
      },
      formData: rawFormData,
      fieldsWithValues
    };
  }

  /**
   * Save form data for a node and project
   * Saves into 'timeline_data' collection and handles cross-compatibility
   *
   * @param {string} nodeId
   * @param {string} projectId
   * @param {Object} formData
   * @param {Object} [user]
   */
  async saveFormData(nodeId, projectId, formData, user = null) {
    if (!nodeId || !projectId) {
      throw new Error("Both 'nodeId' and 'projectId' are required.");
    }
    const projId = this._normalizeProjectId(projectId);
    const dataToSave = (formData && typeof formData === 'object') ? formData : {};

    // 1. Update timeline_data collection
    const timelineDataService = require('../timeline-data/timeline-data.service');
    const updatedRuntime = await timelineDataService.saveNodeData({
      projectId: projId,
      nodeId: nodeId,
      formData: dataToSave
    });

    // 2. Return full merged representation
    return await this.getSchemaWithFormData(nodeId, projId);
  }

  /**
   * Create or update a custom form schema (e.g. per project customization)
   * @param {Object} payload
   */
  async saveOrUpdateSchema(payload) {
    const {
      id,
      nodeId,
      projectId = 'DEFAULT',
      project = null,
      title,
      description,
      fields = [],
      version = 'v1',
      metadata = {}
    } = payload;

    if (!nodeId) {
      throw new Error("Field 'nodeId' is required.");
    }

    const projId = this._normalizeProjectId(projectId);
    const customId = id || `FS_${projId}_${nodeId}`;

    // Resolve static node ref
    const staticNode = await TimelineNodeStatic.findOne({ id: nodeId }).lean();

    const record = await FormSchema.findOneAndUpdate(
      { projectId: projId, nodeId: nodeId },
      {
        $set: {
          nodeId,
          node: staticNode?._id || null,
          projectId: projId,
          project: project || null,
          title: title || `${nodeId} Form`,
          description: description || '',
          fields,
          version,
          isActive: true,
          metadata
        },
        $setOnInsert: { id: customId }
      },
      { upsert: true, new: true, runValidators: true }
    );

    return record;
  }

  /**
   * Get all form schemas with optional filtering
   * @param {Object} filter
   */
  async getAllSchemas(filter = {}) {
    const query = { isActive: true };
    if (filter.projectId) {
      query.projectId = this._normalizeProjectId(filter.projectId);
    }
    if (filter.nodeId) {
      query.nodeId = filter.nodeId;
    }
    return await FormSchema.find(query).sort({ nodeId: 1 }).lean();
  }

  /**
   * Seed all 30 master form schemas from config/timeline.js into 'form_schemas' collection
   * @param {boolean} forceReset
   */
  async seedMasterFormSchemas(forceReset = false) {
    const existingCount = await FormSchema.countDocuments({ projectId: 'DEFAULT' });
    if (existingCount > 0 && !forceReset) {
      return { message: 'Master form schemas already seeded.', count: existingCount };
    }

    if (forceReset) {
      await FormSchema.deleteMany({ projectId: 'DEFAULT' });
    }

    const seededRecords = [];

    // Recursive helper to traverse config/timeline.js
    const extractSchemas = async (node) => {
      if (node.formSchema && Array.isArray(node.formSchema.fields) && node.formSchema.fields.length > 0) {
        const nodeId = node.key;
        const customId = `FS_DEFAULT_${nodeId}`;
        const staticNode = await TimelineNodeStatic.findOne({ id: nodeId }).lean();

        const schemaDoc = await FormSchema.findOneAndUpdate(
          { projectId: 'DEFAULT', nodeId: nodeId },
          {
            $set: {
              id: customId,
              nodeId: nodeId,
              node: staticNode?._id || null,
              projectId: 'DEFAULT',
              project: null,
              title: `${node.name || nodeId} Form`,
              description: `Standard form schema for ${node.name || nodeId}`,
              fields: node.formSchema.fields,
              version: 'v1',
              isActive: true,
              metadata: node.metadata || {}
            }
          },
          { upsert: true, new: true }
        );
        seededRecords.push(schemaDoc);
      }

      if (Array.isArray(node.substages)) {
        for (const sub of node.substages) {
          await extractSchemas(sub);
        }
      }
      if (Array.isArray(node.nested)) {
        for (const nested of node.nested) {
          await extractSchemas(nested);
        }
      }
    };

    for (const stage of timelineConfig.stages || []) {
      await extractSchemas(stage);
    }

    return {
      message: 'Master form schemas seeded successfully in form_schemas collection.',
      seededCount: seededRecords.length,
      totalInDb: await FormSchema.countDocuments()
    };
  }
}

module.exports = new FormSchemasService();
