const mongoose = require('mongoose');
const FormSchema = require('./form-schema.model');
const FormData = require('./form-data.model');
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
   * Helper to ensure fields are returned as an array when required by UI
   */
  _ensureFieldsArray(fields) {
    if (!fields) return [];
    if (Array.isArray(fields)) return fields;
    if (typeof fields === 'object') {
      return Object.entries(fields).map(([key, def]) => ({
        key,
        name: key,
        label: def?.label || key,
        type: def?.type || 'text',
        required: Boolean(def?.required),
        options: def?.options || [],
        hint: def?.hint || '',
        placeholder: def?.placeholder || '',
        defaultValue: def?.defaultValue !== undefined ? def?.defaultValue : null,
        metadata: def?.metadata || {}
      }));
    }
    return [];
  }

  /**
   * Get form schema definition for a node
   * @param {string|ObjectId} nodeId
   */
  async getSchema(nodeId) {
    if (!nodeId) return null;

    // Resolve static node ObjectId if needed
    let nodeMongoId = null;
    let nodeKey = String(nodeId).trim();
    let staticNode = null;

    if (mongoose.isValidObjectId(nodeId)) {
      staticNode = await TimelineNodeStatic.findById(nodeId).lean();
      if (staticNode) {
        nodeMongoId = staticNode._id;
        nodeKey = staticNode.timelineNodeId || staticNode.id;
      } else {
        nodeMongoId = new mongoose.Types.ObjectId(nodeId);
      }
    } else {
      staticNode = await TimelineNodeStatic.findOne({
        $or: [{ timelineNodeId: nodeKey }, { timelineNodeId: nodeKey.toUpperCase() }, { id: nodeKey }]
      }).lean();
      if (staticNode) {
        nodeMongoId = staticNode._id;
        nodeKey = staticNode.timelineNodeId || staticNode.id;
      }
    }

    const orConditions = [];
    if (nodeMongoId) orConditions.push({ timelineNodeId: nodeMongoId });
    if (mongoose.isValidObjectId(nodeKey)) {
      orConditions.push({ _id: new mongoose.Types.ObjectId(nodeKey) });
    }
    orConditions.push({ formSchemaId: nodeKey });
    orConditions.push({ formSchemaId: { $regex: nodeKey, $options: 'i' } });

    // Fallback for subtasks to inherit parent stage schema if not individually defined
    if (staticNode && staticNode.parentId) {
      orConditions.push({ timelineNodeId: staticNode.parentId });
    }
    if (nodeKey === 'TASK_PROJECT_REVIEWER') {
      orConditions.push({ formSchemaId: 'PROJECT_REVIEWER' });
    }

    const schema = await FormSchema.findOne({
      $or: orConditions,
      isActive: true
    }).lean();

    if (schema) {
      return {
        ...schema,
        fieldsArray: this._ensureFieldsArray(schema.fields)
      };
    }

    return null;
  }

  /**
   * Get combined schema definition AND runtime form data values
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
      await this.seedMasterFormSchemas(false);
      schema = await this.getSchema(nodeId, projId);
    }

    // 2. Get Runtime Data from timeline_data
    const staticNode = await TimelineNodeStatic.findOne({
      $or: [{ id: nodeId }, { _id: mongoose.isValidObjectId(nodeId) ? nodeId : null }].filter(Boolean)
    }).lean();

    const runtimeRecord = await TimelineData.findOne({
      projectId: projId,
      $or: [
        { nodeId: staticNode?.id || nodeId },
        staticNode ? { timelineNodeId: staticNode._id } : null
      ].filter(Boolean)
    }).populate('assignedTo', 'name email designation').lean();

    // 3. Get FormData from decoupled form_data collection
    let rawFormData = {};
    const coreApi = require('../../services/core-api.service');
    let projectMongoId = mongoose.isValidObjectId(projectId) ? new mongoose.Types.ObjectId(projectId) : null;
    if (!projectMongoId) {
      try {
        const coreProj = await coreApi.getProjectById(projectId);
        if (coreProj && coreProj._id && mongoose.isValidObjectId(coreProj._id)) {
          projectMongoId = new mongoose.Types.ObjectId(coreProj._id);
        }
      } catch (_) {}
    }

    if (schema?._id && projectMongoId) {
      const formDataDoc = await FormData.findOne({
        projectId: projectMongoId,
        formSchemaId: schema._id
      }).lean();
      rawFormData = formDataDoc?.data || formDataDoc?.formData || {};
    }

    const schemaFieldsArray = this._ensureFieldsArray(schema?.fields);

    // 4. Build merged fields where every schema key has its runtime value
    const fieldsWithValues = schemaFieldsArray.map((field) => {
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
      nodeId: staticNode?.id || nodeId,
      projectId: projId,
      status: runtimeRecord?.status || 'NOT_STARTED',
      assignedTo: runtimeRecord?.assignedTo || null,
      completionDate: runtimeRecord?.completionDate || null,
      dueDate: runtimeRecord?.dueDate || null,
      remarks: runtimeRecord?.remarks || '',
      schema: {
        _id: schema?._id,
        timelineNodeId: schema?.timelineNodeId,
        title: schema?.title || `${nodeId} Form`,
        version: schema?.version || 'v1',
        fields: schema?.fields || {},
        fieldsArray: schemaFieldsArray
      },
      formData: rawFormData,
      fieldsWithValues
    };
  }

  /**
   * Save form data for a node and project
   * Persists actual values in the decoupled 'form_data' collection
   * Referencing timelineDataId (Mongo _id) and formSchemaId (Mongo _id)
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

    // Validate schema fields
    const schema = await this.getSchema(nodeId, projId);
    const schemaFieldsArray = this._ensureFieldsArray(schema?.fields);

    let hasMissingRequired = false;
    for (const field of schemaFieldsArray) {
      const k = field.key;
      const val = dataToSave[k];

      if (field.required) {
        if (k === 'projectName' || k === 'projectTitle') {
          // headline check handled elsewhere
        } else {
          const isEmpty = val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);
          if (isEmpty) {
            hasMissingRequired = true;
          }
        }
      }

      const isContact = (
        (field.type === 'tel' || field.type === 'phone' || /(phone|mobile|tel|contactno|contactnumber|poccontact|supportingorgcontact)/i.test(k) || /\b(phone|mobile|contact\s*no|contact\s*number)\b/i.test(field.label || '')) &&
        !/(person|address|name)/i.test(k) &&
        !/(person|address|name)/i.test(field.label || '') &&
        field.type !== 'textarea'
      );

      if (isContact && val !== undefined && val !== null && String(val).trim() !== '') {
        const strVal = String(val).trim();
        if (/[a-zA-Z]/.test(strVal)) {
          const { AppError } = require('../../core/errors');
          throw new AppError(`Field '${field.label || k}' must contain only numbers, no alphabets are allowed.`, 400, 'INVALID_CONTACT_NUMBER');
        }
      }
    }

    // Resolve static node
    const staticNode = await TimelineNodeStatic.findOne({
      $or: [{ id: nodeId }, { _id: mongoose.isValidObjectId(nodeId) ? nodeId : null }].filter(Boolean)
    }).lean();

    // 1. Resolve project custom ID (e.g. 'PRJ-001') strictly from Core Backend
    let targetProjectId = projId;
    try {
      const coreProj = await coreApi.getProjectById(projectId);
      if (coreProj && coreProj.projectId) {
        targetProjectId = this._normalizeProjectId(coreProj.projectId);
      }
    } catch (_) {}

    // 2. Ensure TimelineData record exists
    const nodeMatchConditions = [
      { nodeId: staticNode?.id || nodeId }
    ];
    if (staticNode?._id) {
      nodeMatchConditions.push({ timelineNodeId: staticNode._id });
    }

    let timelineDataDoc = await TimelineData.findOne({
      projectId: targetProjectId,
      $or: nodeMatchConditions
    });

    let statusToApply = timelineDataDoc?.status || 'IN_PROGRESS';
    if (hasMissingRequired) {
      statusToApply = 'IN_PROGRESS';
    } else if (statusToApply === 'NOT_STARTED') {
      statusToApply = 'IN_PROGRESS';
    }

    if (!timelineDataDoc) {
      timelineDataDoc = await TimelineData.create({
        projectId: targetProjectId,
        nodeId: staticNode?.id || nodeId,
        timelineNodeId: staticNode?._id || new mongoose.Types.ObjectId(),
        node: staticNode?._id || null,
        status: statusToApply,
        remarks: dataToSave.remarks || ''
      });
    } else {
      timelineDataDoc.status = statusToApply;
      if (dataToSave.remarks !== undefined) {
        timelineDataDoc.remarks = dataToSave.remarks;
      }
      timelineDataDoc.projectId = targetProjectId;
      await timelineDataDoc.save();
    }

    // 3. Upsert into normalized form_data collection
    if (targetProjectId && schema?._id) {
      const formDataId = `FD_${targetProjectId}_${schema.formSchemaId || staticNode?._id}`;
      const existingFormDataDoc = await FormData.findOne({
        projectId: targetProjectId,
        formSchemaId: schema._id
      });
      const mergedValues = { ...(existingFormDataDoc?.data || existingFormDataDoc?.formData || {}), ...dataToSave };

      await FormData.findOneAndUpdate(
        {
          projectId: targetProjectId,
          formSchemaId: schema._id
        },
        {
          $set: {
            formDataId,
            formSchemaId: schema._id,
            projectId: targetProjectId,
            nodeKey: staticNode?.id || nodeId,
            nodeId: staticNode?.id || nodeId,
            timelineData: timelineDataDoc?._id || null,
            status: 'SUBMITTED',
            submittedBy: user?._id || null,
            data: mergedValues,
            ...(dataToSave.dashboardSchoolsId || mergedValues.dashboardSchoolsId ? {
              dashboardSchoolsId: dataToSave.dashboardSchoolsId || mergedValues.dashboardSchoolsId
            } : {})
          }
        },
        { upsert: true, new: true }
      );
    }

    // 4. Return full merged representation
    return await this.getSchemaWithFormData(nodeId, projId);
  }

  /**
   * Create or update a form schema
   * @param {Object} payload
   */
  async saveOrUpdateSchema(payload) {
    const {
      nodeId,
      timelineNodeId,
      name,
      title,
      formSchemaId,
      fields = {},
      isActive = true
    } = payload;

    if (!nodeId && !timelineNodeId) {
      throw new Error("Field 'nodeId' or 'timelineNodeId' is required.");
    }

    // Resolve static node ref
    const staticNode = await TimelineNodeStatic.findOne({
      $or: [
        timelineNodeId ? { _id: timelineNodeId } : null,
        nodeId ? { timelineNodeId: nodeId } : null,
        nodeId ? { id: nodeId } : null
      ].filter(Boolean)
    }).lean();

    if (!staticNode) {
      throw new Error(`Static timeline node not found for nodeId: '${nodeId || timelineNodeId}'`);
    }

    // Convert fields array to key-values object if array provided
    let fieldsObject = {};
    if (Array.isArray(fields)) {
      for (const f of fields) {
        if (!f) continue;
        const key = f.key || f.name;
        if (!key) continue;
        fieldsObject[key] = {
          label: f.label || key,
          type: f.type || 'text',
          required: Boolean(f.required),
          options: f.options || [],
          hint: f.hint || '',
          placeholder: f.placeholder || '',
          defaultValue: f.defaultValue !== undefined ? f.defaultValue : null,
          metadata: f.metadata || {}
        };
      }
    } else if (typeof fields === 'object') {
      fieldsObject = fields;
    }

    const nodeOrder = staticNode.order || 1;
    const nodeIdentifier = (staticNode.timelineNodeId || staticNode.name).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const finalFormSchemaId = formSchemaId || `${nodeOrder}_${nodeIdentifier}`;

    const record = await FormSchema.findOneAndUpdate(
      { timelineNodeId: staticNode._id },
      {
        $set: {
          formSchemaId: finalFormSchemaId,
          timelineNodeId: staticNode._id, // Mongo _id reference!
          name: name || title || `${staticNode.name} Form`,
          fields: fieldsObject, // key and values object format
          isActive: isActive !== undefined ? Boolean(isActive) : true
        }
      },
      { upsert: true, new: true, runValidators: true }
    );

    return record;
  }

  /**
   * Get all form schemas
   * @param {Object} filter
   */
  async getAllSchemas(filter = {}) {
    const query = { isActive: true };
    if (filter.formSchemaId) {
      query.formSchemaId = filter.formSchemaId;
    }
    if (filter.timelineNodeId) {
      query.timelineNodeId = filter.timelineNodeId;
    }
    return await FormSchema.find(query).sort({ formSchemaId: 1 }).lean();
  }

  /**
   * Seed all master form schemas from config/timeline.js into 'form_schemas' collection
   * Referencing timeline nodes by MongoDB ObjectId (timelineNodeId)
   * Saving fields as key and values object format
   *
   * @param {boolean} forceReset
   */
  async seedMasterFormSchemas(forceReset = false) {
    const existingCount = await FormSchema.countDocuments({});
    if (existingCount > 0 && !forceReset) {
      return { message: 'Master form schemas already seeded.', count: existingCount };
    }

    if (forceReset) {
      await FormSchema.deleteMany({});
    }

    const seededRecords = [];

    // Recursive helper to traverse config/timeline.js
    const extractSchemas = async (node) => {
      if (node.formSchema && Array.isArray(node.formSchema.fields) && node.formSchema.fields.length > 0) {
        const nodeId = node.key;
        const staticNode = await TimelineNodeStatic.findOne({
          $or: [{ timelineNodeId: nodeId }, { id: nodeId }]
        }).lean();

        if (staticNode) {
          // Convert fields array to key and values object
          const fieldsObject = {};
          for (const f of node.formSchema.fields) {
            const key = f.key || f.name;
            if (!key) continue;
            fieldsObject[key] = {
              label: f.label || key,
              type: f.type || 'text',
              required: Boolean(f.required),
              options: Array.isArray(f.options) ? f.options : [],
              hint: f.hint || '',
              placeholder: f.placeholder || '',
              defaultValue: f.defaultValue !== undefined ? f.defaultValue : null,
              metadata: f.metadata || {}
            };
          }

          const nodeOrder = staticNode.order || 1;
          const nodeIdentifier = (staticNode.timelineNodeId || staticNode.name).replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
          const formSchemaId = `${nodeOrder}_${nodeIdentifier}`;

          const schemaDoc = await FormSchema.findOneAndUpdate(
            { timelineNodeId: staticNode._id },
            {
              $set: {
                formSchemaId,
                timelineNodeId: staticNode._id, // MongoDB ObjectId reference!
                name: `${node.name || nodeId} Form`,
                fields: fieldsObject, // key and values object
                isActive: true
              }
            },
            { upsert: true, new: true }
          );
          seededRecords.push(schemaDoc);

          // Handle TASK_PROJECT_REVIEWER alias if needed
          if (nodeId === 'PROJECT_REVIEWER') {
            const taskStaticNode = await TimelineNodeStatic.findOne({
              $or: [{ timelineNodeId: 'TASK_PROJECT_REVIEWER' }, { id: 'TASK_PROJECT_REVIEWER' }]
            }).lean();
            if (taskStaticNode) {
              const taskOrder = taskStaticNode.order || 1;
              const taskSchemaId = `${taskOrder}_TASK_PROJECT_REVIEWER`;
              await FormSchema.findOneAndUpdate(
                { timelineNodeId: taskStaticNode._id },
                {
                  $set: {
                    formSchemaId: taskSchemaId,
                    timelineNodeId: taskStaticNode._id,
                    name: `${node.name || nodeId} Form`,
                    fields: fieldsObject,
                    isActive: true
                  }
                },
                { upsert: true, new: true }
              );
            }
          }
        }
      }

      if (Array.isArray(node.substages)) {
        for (const sub of node.substages) {
          await extractSchemas(sub);
        }
      }
      if (Array.isArray(node.tasks)) {
        for (const task of node.tasks) {
          await extractSchemas(task);
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
      message: 'Master form schemas seeded successfully in normalized form_schemas collection.',
      seededCount: seededRecords.length,
      totalInDb: await FormSchema.countDocuments()
    };
  }
}

module.exports = new FormSchemasService();
