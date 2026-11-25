const mongoose = require('mongoose');
const TimelineData = require('./timeline-data.model');
const FormData = require('./form-data.model');
const TimelineNodeStatic = require('../timeline-nodes/timeline-node.model');
const timelineNodesService = require('../timeline-nodes/timeline-nodes.service');
const FormSchema = require('../form-schemas/form-schema.model');
const formSchemasService = require('../form-schemas/form-schemas.service');
const Employee = require('../employees/employee.model');
const Activity = require('../activity/activity.model');
const Notification = require('../notifications/notifications.model');
const notificationService = require('../notifications/notifications.service');
const coreApi = require('../../services/core-api.service');
const Requirements = require('../requirements/requirements.model');
const School = require('../schools/school.model');
const ProjectSchools = require('../project-schools/project-schools.model');
const { NODE_STATUSES, GLOBAL_ROLES, DESIGNATIONS } = require('../../core/constants');
const { AppError } = require('../../core/errors');

class TimelineDataService {
  /**
   * Format a Core Backend school record into canonical + survey-compatible shape
   */
  _formatCanonicalSchool(s, idx = 0) {
    const survey = (s && typeof s.survey === 'object' && s.survey !== null) ? s.survey : {};
    const name = s.name || s.schoolName || `School ${idx + 1}`;
    const address = s.address || s.addressContact || survey.addressContact || '';
    const pocName =
      (typeof s.coordinatorId === 'object' && s.coordinatorId?.name) ||
      s.pocName ||
      survey.pocName ||
      (typeof s.contactPerson === 'object' && s.contactPerson?.name) ||
      (typeof s.contactPerson === 'string' ? s.contactPerson : '') ||
      '';
    const phone =
      s.phone ||
      s.pocContact ||
      survey.pocContact ||
      (typeof s.contactPerson === 'object' && s.contactPerson?.phone) ||
      '';
    const email =
      s.email ||
      (typeof s.contactPerson === 'object' && s.contactPerson?.email) ||
      survey.email ||
      '';
    const principalName =
      s.principalName ||
      survey.principalName ||
      (typeof s.contactPerson === 'object' && s.contactPerson?.name) ||
      '';
    const classes = Array.isArray(s.classes) && s.classes.length > 0
      ? s.classes
      : (Array.isArray(survey.classes) ? survey.classes : []);

    return {
      ...survey,
      id: String(s._id || s.schoolId || s.id || `school-${idx + 1}`),
      _id: String(s._id || s.schoolId || s.id || `school-${idx + 1}`),
      schoolId: s.schoolId || String(s._id || ''),
      name,
      schoolName: name,
      address,
      addressContact: s.addressContact || address,
      principalName,
      principalDetails: s.principalDetails || survey.principalDetails || '',
      pocName,
      pocDesignation: s.pocDesignation || survey.pocDesignation || '',
      pocContact: s.pocContact || survey.pocContact || phone,
      phone,
      email,
      block: s.block || '',
      city: (typeof s.cityId === 'object' && s.cityId?.name) || s.city || '',
      state: (typeof s.stateId === 'object' && s.stateId?.name) || s.state || '',
      country: (typeof s.countryId === 'object' && s.countryId?.name) || s.country || 'India',
      classes,
      numberOfStudents: Number(s.numberOfStudents || survey.totalStudents) || 0,
      numberOfTeachers: Number(s.numberOfTeachers || survey.totalTeachers) || 0,
      totalStudents: survey.totalStudents ?? (s.numberOfStudents || ''),
      totalTeachers: survey.totalTeachers ?? (s.numberOfTeachers || ''),
      numberOfLicenses: Number(s.numberOfLicenses) || 0,
      platforms: s.platforms || [],
      installation: s.installation || {},
      training: s.training || {},
      survey
    };
  }

  /**
   * Merge Core Backend canonical schools with saved FormData survey schools
   * without discarding user-entered School Information fields.
   */
  _mergeCanonicalAndFormSchools(canonicalSchools = [], savedSchools = []) {
    const hasCanonical = Array.isArray(canonicalSchools) && canonicalSchools.length > 0;
    const hasSaved = Array.isArray(savedSchools) && savedSchools.length > 0;

    if (!hasCanonical) return hasSaved ? savedSchools : [];
    if (!hasSaved) return canonicalSchools;

    const usedSavedIndices = new Set();

    const findMatchingSaved = (canon, idx) => {
      const canonIds = [canon._id, canon.id, canon.schoolId].filter(Boolean).map(String);
      const canonName = (canon.schoolName || canon.name || '').trim().toLowerCase();

      let matchIdx = savedSchools.findIndex((sv, i) => {
        if (usedSavedIndices.has(i) || !sv) return false;
        const svIds = [sv._id, sv.id, sv.schoolId].filter(Boolean).map(String);
        return svIds.some((id) => canonIds.includes(id));
      });

      if (matchIdx === -1 && canonName) {
        matchIdx = savedSchools.findIndex((sv, i) => {
          if (usedSavedIndices.has(i) || !sv) return false;
          const svName = (sv.schoolName || sv.name || '').trim().toLowerCase();
          return svName && svName === canonName;
        });
      }

      if (matchIdx === -1 && idx < savedSchools.length && !usedSavedIndices.has(idx)) {
        matchIdx = idx;
      }

      if (matchIdx !== -1) {
        usedSavedIndices.add(matchIdx);
        return savedSchools[matchIdx];
      }
      return null;
    };

    const coreMetaKeys = new Set(['_id', 'schoolId', 'platforms', 'installation', 'training', 'numberOfLicenses', 'survey']);

    const mergedList = canonicalSchools.map((canon, idx) => {
      const saved = findMatchingSaved(canon, idx);
      if (!saved) return canon;
      const merged = { ...canon };
      for (const [key, val] of Object.entries(saved)) {
        if (val === undefined || val === null) continue;
        if (coreMetaKeys.has(key)) continue;
        if (typeof val === 'string' && val.trim() === '' && canon[key]) {
          // Keep non-empty Core value only if saved didn't provide one, unless it's a survey-only field
          if (['name', 'schoolName'].includes(key)) continue;
        }
        merged[key] = val;
      }
      if (merged.schoolName && (!merged.name || saved.schoolName)) {
        merged.name = merged.schoolName;
      } else if (merged.name && !merged.schoolName) {
        merged.schoolName = merged.name;
      }
      return merged;
    });

    savedSchools.forEach((sv, idx) => {
      if (!usedSavedIndices.has(idx) && sv) {
        mergedList.push(sv);
      }
    });

    return mergedList;
  }

  /**
   * Normalize projectId
   */
  _normalizeProjectId(projectId) {
    if (!projectId) return '';
    return String(projectId).trim();
  }

  /**
   * Resolve any node identifier (custom ID 'TLD_...', MongoDB ObjectId, or static ID)
   * to its static clean key (e.g., 'PO_UPLOAD', 'PROJECT_REVIEWER')
   */
  async _resolveNodeKey(nodeId) {
    if (!nodeId) return null;
    let raw = String(nodeId).trim();
    if (raw.startsWith('TLD_')) {
      const parts = raw.split('_');
      if (parts.length >= 3) {
        return parts.slice(2).join('_');
      }
    }

    const staticNode = await TimelineNodeStatic.findOne({
      $or: [{ timelineNodeId: raw }, { id: raw }]
    }).lean();
    if (staticNode) return staticNode.timelineNodeId || staticNode.id;

    if (mongoose.isValidObjectId(raw)) {
      const td = await TimelineData.findById(raw).lean();
      if (td && td.nodeId) return td.nodeId;
      const ts = await TimelineNodeStatic.findById(raw).lean();
      if (ts) return ts.timelineNodeId || ts.id;
    }

    return raw;
  }

  /**
   * Find project metadata from Core Backend or Tracker DB
   */
  async _findProject(projectId) {
    if (!projectId) return null;

    if (typeof projectId === 'object' && (projectId.projectName || projectId.title)) {
      return projectId;
    }

    const idStr = String(typeof projectId === 'object' && projectId._id ? projectId._id : projectId).trim();
    if (!idStr || idStr === '[object Object]' || idStr === 'undefined' || idStr === 'null') {
      return null;
    }

    // Try Core Backend
    try {
      const coreP = await coreApi.getProjectById(idStr);
      if (coreP) {
        return {
          _id: String(coreP._id || idStr),
          projectId: (coreP.projectId || idStr).toUpperCase(),
          projectName: coreP.projectName || coreP.title || 'Project',
          projectManager: coreP.projectManager || null,
          schools: coreP.schools || [],
          source: 'CORE_BACKEND'
        };
      }
    } catch (_) { }



    return {
      _id: idStr,
      projectId: idStr.toUpperCase(),
      projectName: 'Project'
    };
  }

  /**
   * Get all timeline data records for a project
   */
  async getByProject(projectId, filter = {}) {
    const projId = this._normalizeProjectId(projectId);
    const query = { projectId: projId };

    if (filter.status) {
      query.status = filter.status.toUpperCase();
    }
    if (filter.assignedTo) {
      query.assignedTo = filter.assignedTo;
    }
    if (filter.nodeId) {
      query.nodeId = filter.nodeId;
    }

    return await TimelineData.find(query)
      .populate('assignedTo', 'name email designation')
      .populate('node', 'name title order parent_id has_substages dependentOn formSchema')
      .sort({ createdAt: 1 })
      .lean();
  }

  /**
   * Get single node data for a project
   */
  async getNodeData(projectId, nodeId) {
    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this._resolveNodeKey(nodeId);
    return await TimelineData.findOne({ projectId: projId, nodeId: cleanKey })
      .populate('assignedTo', 'name email designation')
      .populate('node')
      .lean();
  }

  /**
   * Initialize timeline_data records for a project based on all static timeline_nodes
   */
  async initializeProjectTimelineData(projectId, pmId = null, coreProject = null) {
    const projId = this._normalizeProjectId(projectId);
    if (!projId) {
      throw new Error('Project ID is required to initialize timeline data.');
    }

    let targetProjectId = projId;
    if (coreProject && coreProject.projectId) {
      targetProjectId = this._normalizeProjectId(coreProject.projectId);
    } else {
      try {
        const p = await this._findProject(projectId);
        if (p && p.projectId) {
          targetProjectId = this._normalizeProjectId(p.projectId);
          coreProject = p;
        }
      } catch (_) {}
    }

    const staticNodes = await TimelineNodeStatic.find().sort({ order: 1 }).lean();
    if (!staticNodes || staticNodes.length === 0) {
      await timelineNodesService.seedStaticTimelineNodes(false);
    }
    const nodes = await TimelineNodeStatic.find().sort({ order: 1 }).lean();

    const results = [];
    for (const node of nodes) {
      const nodeKey = node.timelineNodeId || node.id;
      const isFirstStage = nodeKey === 'PROJECT_REVIEWER' || (node.order === 1 && node.type === 'stage');
      const initialStatus = isFirstStage ? 'IN_PROGRESS' : 'NOT_STARTED';
      const assignedEmployee = (isFirstStage && pmId) ? pmId : null;

      const findQuery = {
        projectId: targetProjectId,
        $or: [
          { timelineNodeId: node._id },
          { nodeId: nodeKey }
        ]
      };

      const record = await TimelineData.findOneAndUpdate(
        findQuery,
        {
          $set: {
            timelineNodeId: node._id,
            node: node._id,
            nodeId: nodeKey,
            projectId: targetProjectId
          },
          $setOnInsert: {
            assignedTo: assignedEmployee,
            status: initialStatus,
            completionDate: null,
            dueDate: null,
            remarks: '',
          }
        },
        { upsert: true, new: true }
      );
      results.push(record);
    }

    return {
      success: true,
      projectId: projId,
      initializedCount: results.length
    };
  }

  /**
   * Compatibility alias for createTimelineForProject
   */
  async createTimelineForProject(project, pmId = null) {
    const projId = project?.projectId || (typeof project === 'string' ? project : '');
    const managerId = pmId || project?.projectManager || null;
    return await this.initializeProjectTimelineData(projId, managerId, project);
  }

  /**
   * Compatibility alias for syncSchoolProgressToTimeline
   */
  async syncSchoolProgressToTimeline(projectId) {
    return Promise.resolve();
  }

  /**
   * Get live project hierarchy tree by merging static blueprint with dynamic runtime timeline_data
   */
  async getProjectHierarchyTree(projectId) {
    const projId = this._normalizeProjectId(projectId);
    let targetProjectId = projId;
    try {
      const coreProj = await coreApi.getProjectById(projectId);
      if (coreProj && coreProj.projectId) {
        targetProjectId = this._normalizeProjectId(coreProj.projectId);
      }
    } catch (_) {}

    // 1. Fetch static hierarchy tree
    const staticTree = await timelineNodesService.getHierarchyTree();

    const candidateProjectIds = Array.from(new Set([
      targetProjectId,
      targetProjectId.toLowerCase(),
      targetProjectId.toUpperCase(),
      projId,
      projId.toLowerCase(),
      projId.toUpperCase(),
    ])).filter(Boolean);

    const projFilter = {
      projectId: { $in: candidateProjectIds }
    };

    // 2. Fetch all runtime data for this project
    const runtimeRecords = await TimelineData.find(projFilter)
      .populate('assignedTo', 'name email designation')
      .lean();

    const formDataRecords = await FormData.find(projFilter)
      .populate('formSchemaId', 'timelineNodeId formSchemaId')
      .lean();

    const formDataMap = new Map();
    for (const fd of formDataRecords) {
      const dataValues = fd.data || fd.formData || {};
      if (fd.timelineData) {
        formDataMap.set(String(fd.timelineData), dataValues);
      }
      if (fd.nodeKey) {
        formDataMap.set(fd.nodeKey, dataValues);
      }
      if (fd.nodeId) {
        formDataMap.set(fd.nodeId, dataValues);
      }
      if (fd.formSchemaId && fd.formSchemaId.timelineNodeId) {
        formDataMap.set(String(fd.formSchemaId.timelineNodeId), dataValues);
      }
      if (fd.formSchemaId && fd.formSchemaId.formSchemaId) {
        formDataMap.set(fd.formSchemaId.formSchemaId, dataValues);
        // Also strip "FS_" prefix (e.g. FS_SCHOOL_ONBOARDING_INFORMATION -> SCHOOL_ONBOARDING_INFORMATION)
        const strippedKey = String(fd.formSchemaId.formSchemaId).replace(/^FS_/, '');
        formDataMap.set(strippedKey, dataValues);
      }
      if (fd.formSchemaId && typeof fd.formSchemaId === 'object' && fd.formSchemaId._id) {
        formDataMap.set(String(fd.formSchemaId._id), dataValues);
      }
    }

    const runtimeMap = new Map();
    for (const r of runtimeRecords) {
      if (r.nodeId) runtimeMap.set(r.nodeId, r);
      if (r.timelineNodeId) runtimeMap.set(String(r.timelineNodeId), r);
      if (r.node) runtimeMap.set(String(r.node), r);
    }

    // Auto-initialize if no records found
    if (runtimeRecords.length === 0) {
      await this.initializeProjectTimelineData(projId);
      return await this.getProjectHierarchyTree(projId);
    }

    // 3. Helper to attach runtime data to static node
    const attachRuntimeData = (staticNode) => {
      const nodeKey = staticNode.timelineNodeId || staticNode.id;
      const runtime = runtimeMap.get(String(staticNode._id)) || runtimeMap.get(nodeKey) || {
        nodeId: nodeKey,
        projectId: projId,
        status: 'NOT_STARTED',
        assignedTo: null,
        completionDate: null,
        dueDate: null,
        remarks: '',
        formData: {}
      };

      const resolvedFormData = (runtime._id && formDataMap.get(String(runtime._id))) ||
        formDataMap.get(String(staticNode._id)) ||
        formDataMap.get(nodeKey) ||
        runtime.formData || {};

      return {
        ...staticNode,
        id: nodeKey,
        timelineNodeId: nodeKey,
        runtimeId: runtime._id ? String(runtime._id) : String(staticNode._id),
        status: runtime.status || 'NOT_STARTED',
        assignedTo: runtime.assignedTo || null,
        assignedEmployee: runtime.assignedTo || null,
        completionDate: runtime.completionDate || null,
        dueDate: runtime.dueDate || null,
        remarks: runtime.remarks || '',
        formData: resolvedFormData,
        dependentOn: staticNode.dependentOn || [],
        dependencies: staticNode.dependentOn || staticNode.dependencies || [],
        updatedAt: runtime.updatedAt || null
      };
    };

    // 4. Merge hierarchy
    const mergedTree = staticTree.map((stage) => {
      const mergedStage = attachRuntimeData(stage);

      if (stage.has_substages && stage.substages) {
        mergedStage.substages = stage.substages.map((sub) => {
          const mergedSub = attachRuntimeData(sub);
          if (sub.tasks) {
            mergedSub.tasks = sub.tasks.map((task) => attachRuntimeData(task));
          }
          return mergedSub;
        });
      } else if (stage.tasks) {
        mergedStage.tasks = stage.tasks.map((task) => attachRuntimeData(task));
      }

      return mergedStage;
    });

    return mergedTree;
  }

  /**
   * Complete unified timeline hierarchy method matching the frontend contract
   */
  async getTimelineHierarchy(projectId) {
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();

    // Ensure runtime records are initialized
    const existingCount = await TimelineData.countDocuments({ projectId: targetProjectId });
    if (existingCount === 0) {
      await this.initializeProjectTimelineData(targetProjectId, project?.projectManager, project);
    }

    // 1. Get raw hierarchy tree
    const rawTree = await this.getProjectHierarchyTree(targetProjectId);

    // 2. Fetch Form Schemas map
    const formSchemas = await FormSchema.find({
      $or: [{ projectId: targetProjectId }, { projectId: 'DEFAULT' }],
      isActive: true
    }).lean();

    const schemaMap = new Map();
    for (const fs of formSchemas) {
      if (fs.timelineNodeId) {
        schemaMap.set(String(fs.timelineNodeId), fs.fields);
      }
      if (fs.formSchemaId) {
        schemaMap.set(fs.formSchemaId, fs.fields);
      }
      if (fs.nodeId) {
        schemaMap.set(fs.nodeId, fs.fields);
      }
    }

    // 3. Fetch real DB schools for the project from Core Backend API
    let canonicalSchools = [];
    try {
      const coreSchools = await coreApi.getProjectSchools(targetProjectId || projId);
      if (Array.isArray(coreSchools) && coreSchools.length > 0) {
        canonicalSchools = coreSchools.map((s, idx) => this._formatCanonicalSchool(s, idx));
      }
    } catch (_) { }

    // 4. Format into normalized tree structure (Stage 3 School Information & Order Requirement stay strictly manual FormData without Core Backend interruption)
    const STAGE3_KEYS = new Set([
      'ORDER_REQUIREMENT',
      'SCHOOL_ONBOARDING_INFORMATION',
      'SCHOOL_INFORMATION',
      'SCHOOL_ONBOARDING',
      'SOLUTION_SELECTION',
      'HARDWARE_REQUIREMENT',
      'CONTENT_CONFIGURATION'
    ]);

    const formatNode = (node, type, parentKey = null) => {
      let nodeFormData = node.formData || {};
      const nodeKeyUpper = String(node.id || node.key || '').toUpperCase();
      const parentKeyUpper = String(parentKey || '').toUpperCase();
      const isStage3Node = STAGE3_KEYS.has(nodeKeyUpper) || parentKeyUpper === 'ORDER_REQUIREMENT';

      if (!isStage3Node) {
        const mergedSchools = this._mergeCanonicalAndFormSchools(canonicalSchools, nodeFormData.schools);
        if (mergedSchools.length > 0) {
          nodeFormData = {
            ...nodeFormData,
            schools: mergedSchools,
            schoolName: mergedSchools.map((s) => s.schoolName || s.name).filter(Boolean).join('; ') || nodeFormData.schoolName
          };
        }
      }

      const rawFields = schemaMap.get(String(node._id)) || schemaMap.get(node.timelineNodeId || node.id) || (node.formSchema?.fields || node.formSchema) || null;
      const nodeFieldsArray = formSchemasService._ensureFieldsArray(rawFields?.fields || rawFields);
      let effectiveStatus = node.status || 'NOT_STARTED';

      // Validation check: If node is marked COMPLETED, verify all required form fields are filled
      if (effectiveStatus === 'COMPLETED' && Array.isArray(nodeFieldsArray) && nodeFieldsArray.length > 0) {
        for (const f of nodeFieldsArray) {
          if (f.required) {
            const k = f.key || f.name;
            if (k === 'projectName' || k === 'projectTitle') continue;
            const val = nodeFormData[k];
            const isEmpty = val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);
            if (isEmpty) {
              effectiveStatus = 'IN_PROGRESS';
              break;
            }
          }
        }
      }

      return {
        _id: node.runtimeId || node.id,
        id: node.id,
        key: node.id,
        name: node.name,
        type: type,
        order: node.order || 1,
        status: effectiveStatus,
        assignedTo: node.assignedTo || null,
        assignedEmployee: node.assignedTo || null,
        completionDate: effectiveStatus === 'COMPLETED' ? (node.completionDate || new Date()) : null,
        dueDate: node.dueDate || null,
        remarks: node.remarks || '',
        formData: nodeFormData,
        formSchema: nodeFieldsArray.length > 0 ? { fields: nodeFieldsArray } : null,
        parent: parentKey,
        dependentOn: node.dependentOn || [],
        dependencies: node.dependentOn || node.dependencies || [],
        children: []
      };
    };

    let totalCount = 0;
    let completedCount = 0;

    const countNode = (node) => {
      totalCount++;
      if (node.status === 'COMPLETED') completedCount++;
    };

    const tree = rawTree.map((stage) => {
      const stageFormatted = formatNode(stage, 'STAGE', null);

      if (stage.has_substages && stage.substages && stage.substages.length > 0) {
        stageFormatted.children = stage.substages.map((sub) => {
          const subFormatted = formatNode(sub, 'SUBSTAGE', stage.id);
          if (sub.tasks && sub.tasks.length > 0) {
            subFormatted.children = sub.tasks.map((task) => {
              const taskFormatted = formatNode(task, 'TASK', sub.id);
              countNode(taskFormatted);
              return taskFormatted;
            });
            // If any child task is not COMPLETED, substage cannot be COMPLETED
            const hasIncompleteTasks = subFormatted.children.some((c) => c.status !== 'COMPLETED');
            if (hasIncompleteTasks && subFormatted.status === 'COMPLETED') {
              subFormatted.status = 'IN_PROGRESS';
            }
          }
          countNode(subFormatted);
          return subFormatted;
        });

        // If any substage or child task is not COMPLETED, stage cannot be COMPLETED
        const hasIncompleteSubs = stageFormatted.children.some((c) => c.status !== 'COMPLETED');
        if (hasIncompleteSubs && stageFormatted.status === 'COMPLETED') {
          stageFormatted.status = 'IN_PROGRESS';
        }
      } else if (stage.tasks && stage.tasks.length > 0) {
        stageFormatted.children = stage.tasks.map((task) => {
          const taskFormatted = formatNode(task, 'TASK', stage.id);
          countNode(taskFormatted);
          return taskFormatted;
        });
        const hasIncompleteTasks = stageFormatted.children.some((c) => c.status !== 'COMPLETED');
        if (hasIncompleteTasks && stageFormatted.status === 'COMPLETED') {
          stageFormatted.status = 'IN_PROGRESS';
        }
      }

      countNode(stageFormatted);
      return stageFormatted;
    });

    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const timeline = {
      _id: project?._id || targetProjectId,
      project: project?._id || targetProjectId,
      projectId: targetProjectId,
      projectName: project?.projectName || project?.title || 'Project',
      status: progressPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
      progressPercentage,
      projectManager: project?.projectManager || null,
      stages: tree
    };

    return { timeline, structure: tree, nodes: tree };
  }

  /**
   * Get single node detail with form schema and runtime values
   */
  async getNodeById(projectId, nodeId) {
    const projId = this._normalizeProjectId(projectId);
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || projId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();

    const cleanKey = await this._resolveNodeKey(nodeId);
    const staticNode = cleanKey ? await TimelineNodeStatic.findOne({
      $or: [{ timelineNodeId: cleanKey }, { id: cleanKey }]
    }).lean() : null;

    const candidateIds = Array.from(new Set([
      targetProjectId,
      targetProjectId.toLowerCase(),
      targetProjectId.toUpperCase(),
      projId,
      projId.toLowerCase(),
      projId.toUpperCase(),
      project?._id ? String(project._id) : null,
      project?.projectId ? String(project.projectId) : null,
    ])).filter(Boolean);

    let runtimeRecord = await TimelineData.findOne({
      projectId: { $in: candidateIds },
      $or: [
        cleanKey ? { nodeId: cleanKey } : null,
        { id: nodeId },
        mongoose.isValidObjectId(nodeId) ? { _id: nodeId } : null
      ].filter(Boolean)
    }).populate('assignedTo', 'name email designation').lean();

    if (!runtimeRecord && cleanKey) {
      await this.saveNodeData({
        projectId: targetProjectId,
        nodeId: cleanKey,
        status: 'NOT_STARTED'
      });
      runtimeRecord = await TimelineData.findOne({
        projectId: { $in: candidateIds },
        nodeId: cleanKey
      }).populate('assignedTo', 'name email designation').lean();
    }

    const dynamicSchema = cleanKey ? await formSchemasService.getSchema(cleanKey, targetProjectId) : null;
    const effectiveKey = cleanKey || runtimeRecord?.nodeId || nodeId;

    const rawNodeFields = dynamicSchema?.fields || (staticNode?.formSchema?.fields || staticNode?.formSchema);
    const nodeFieldsArray = formSchemasService._ensureFieldsArray(rawNodeFields?.fields || rawNodeFields);

    const STAGE3_KEYS = new Set([
      'ORDER_REQUIREMENT',
      'SCHOOL_ONBOARDING_INFORMATION',
      'SCHOOL_INFORMATION',
      'SCHOOL_ONBOARDING',
      'SOLUTION_SELECTION',
      'HARDWARE_REQUIREMENT',
      'CONTENT_CONFIGURATION'
    ]);
    const isStage3Node = STAGE3_KEYS.has(String(effectiveKey || '').toUpperCase());

    // Fetch canonical schools from Core Backend ONLY for non-Stage-3 (Execution/Deployment) nodes
    let canonicalSchools = [];
    if (!isStage3Node) {
      try {
        const coreSchools = await coreApi.getProjectSchools(targetProjectId || projId);
        if (Array.isArray(coreSchools) && coreSchools.length > 0) {
          canonicalSchools = coreSchools.map((s, idx) => this._formatCanonicalSchool(s, idx));
        }
      } catch (_) { }
    }

    const nodeObj = {
      _id: runtimeRecord?._id ? String(runtimeRecord._id) : effectiveKey,
      id: effectiveKey,
      key: effectiveKey,
      name: staticNode?.name || effectiveKey,
      type: (staticNode?.type || staticNode?.title || 'stage').toUpperCase(),
      order: staticNode?.order || 1,
      status: runtimeRecord?.status || 'NOT_STARTED',
      assignedTo: runtimeRecord?.assignedTo || null,
      assignedEmployee: runtimeRecord?.assignedTo || null,
      completionDate: runtimeRecord?.completionDate || null,
      dueDate: runtimeRecord?.dueDate || null,
      remarks: runtimeRecord?.remarks || '',
      formData: (await (async () => {
        if (!runtimeRecord) return (!isStage3Node && canonicalSchools.length > 0) ? { schools: canonicalSchools } : {};
        const formSchema = await formSchemasService.getSchema(effectiveKey);
        const fd = await FormData.findOne({
          $or: [
            runtimeRecord?._id ? { timelineData: runtimeRecord._id } : null,
            formSchema?._id ? { projectId: { $in: candidateIds }, formSchemaId: formSchema._id } : null
          ].filter(Boolean)
        }).lean();
        const baseData = (fd ? (fd.data || fd.formData) : runtimeRecord?.formData) || {};
        if (isStage3Node) {
          return baseData;
        }
        const mergedSchools = this._mergeCanonicalAndFormSchools(canonicalSchools, baseData.schools);
        if (mergedSchools.length > 0) {
          return {
            ...baseData,
            schools: mergedSchools,
            schoolName: mergedSchools.map((s) => s.schoolName || s.name).filter(Boolean).join('; ') || baseData.schoolName
          };
        }
        return baseData;
      })()),
      formSchema: nodeFieldsArray.length > 0 ? { fields: nodeFieldsArray } : null,
      parent: staticNode?.parentId || null,
      parentNode: staticNode?.parentId || null,
      children: []
    };

    // Attach children referencing parentId (MongoDB ObjectId)
    const staticChildren = staticNode?._id
      ? await TimelineNodeStatic.find({ parentId: staticNode._id }).sort({ order: 1 }).lean()
      : [];

    if (staticChildren.length > 0) {
      const childKeys = staticChildren.map((c) => c.timelineNodeId || c.id);
      const childRuntimes = await TimelineData.find({
        projectId: { $in: candidateIds },
        $or: [
          { timelineNodeId: { $in: staticChildren.map(c => c._id) } },
          { nodeId: { $in: childKeys } }
        ]
      }).populate('assignedTo', 'name email designation').lean();

      const childRuntimeMap = new Map();
      for (const cr of childRuntimes) {
        if (cr.timelineNodeId) childRuntimeMap.set(String(cr.timelineNodeId), cr);
        if (cr.nodeId) childRuntimeMap.set(cr.nodeId, cr);
      }

      nodeObj.children = staticChildren.map((sc) => {
        const scKey = sc.timelineNodeId || sc.id;
        const cr = childRuntimeMap.get(String(sc._id)) || childRuntimeMap.get(scKey);
        return {
          _id: cr?._id ? String(cr._id) : String(sc._id),
          id: scKey,
          timelineNodeId: scKey,
          key: scKey,
          name: sc.name,
          type: (sc.type || 'tasks').toUpperCase(),
          order: sc.order || 1,
          status: cr?.status || 'NOT_STARTED',
          assignedTo: cr?.assignedTo || null,
          assignedEmployee: cr?.assignedTo || null,
          completionDate: cr?.completionDate || null,
          dueDate: cr?.dueDate || null,
          remarks: cr?.remarks || '',
          formData: cr?.formData || {},
          parent: sc.parentId,
          children: []
        };
      });
    }

    return nodeObj;
  }

  /**
   * Get children of a node
   */
  async getChildren(projectId, nodeId) {
    const projId = this._normalizeProjectId(projectId);
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || projId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();

    const cleanKey = await this._resolveNodeKey(nodeId);
    const staticNode = await TimelineNodeStatic.findOne({
      $or: [{ timelineNodeId: cleanKey }, { id: cleanKey }]
    }).lean();

    const staticChildren = staticNode?._id
      ? await TimelineNodeStatic.find({ parentId: staticNode._id }).sort({ order: 1 }).lean()
      : [];

    if (staticChildren.length === 0) return [];

    const candidateIds = Array.from(new Set([
      targetProjectId,
      targetProjectId.toLowerCase(),
      targetProjectId.toUpperCase(),
      projId,
      projId.toLowerCase(),
      projId.toUpperCase(),
      project?._id ? String(project._id) : null,
      project?.projectId ? String(project.projectId) : null,
    ])).filter(Boolean);

    const childKeys = staticChildren.map((c) => c.timelineNodeId || c.id);
    const childRuntimes = await TimelineData.find({
      projectId: { $in: candidateIds },
      $or: [
        { timelineNodeId: { $in: staticChildren.map(c => c._id) } },
        { nodeId: { $in: childKeys } }
      ]
    }).populate('assignedTo', 'name email designation').lean();

    const childRuntimeMap = new Map();
    for (const cr of childRuntimes) {
      if (cr.timelineNodeId) childRuntimeMap.set(String(cr.timelineNodeId), cr);
      if (cr.nodeId) childRuntimeMap.set(cr.nodeId, cr);
    }

    return staticChildren.map((sc) => {
      const scKey = sc.timelineNodeId || sc.id;
      const cr = childRuntimeMap.get(String(sc._id)) || childRuntimeMap.get(scKey);
      return {
        _id: cr?._id ? String(cr._id) : String(sc._id),
        id: scKey,
        timelineNodeId: scKey,
        key: scKey,
        name: sc.name,
        type: (sc.type || 'tasks').toUpperCase(),
        order: sc.order || 1,
        status: cr?.status || 'NOT_STARTED',
        assignedTo: cr?.assignedTo || null,
        assignedEmployee: cr?.assignedTo || null,
        completionDate: cr?.completionDate || null,
        dueDate: cr?.dueDate || null,
        remarks: cr?.remarks || '',
        formData: cr?.formData || {},
        parent: sc.parentId
      };
    });
  }

  /**
   * Save or update runtime node data
   */
  async saveNodeData(payload) {
    const {
      id,
      projectId,
      nodeId,
      project,
      assignedTo,
      status,
      completionDate,
      dueDate,
      remarks,
      formData,
    } = payload;

    if (!projectId || !nodeId) {
      throw new Error("Both 'projectId' and 'nodeId' are required.");
    }

    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this._resolveNodeKey(nodeId);

    let targetProjectId = projId;
    try {
      const p = await this._findProject(projectId);
      if (p && p.projectId) {
        targetProjectId = this._normalizeProjectId(p.projectId);
      }
    } catch (_) {}

    const staticNode = await TimelineNodeStatic.findOne({
      $or: [{ timelineNodeId: cleanKey }, { id: cleanKey }]
    }).lean();

    const updateFields = {};
    if (assignedTo !== undefined) updateFields.assignedTo = assignedTo || null;
    if (status !== undefined) updateFields.status = String(status).toUpperCase();
    if (completionDate !== undefined) updateFields.completionDate = completionDate;
    if (dueDate !== undefined) updateFields.dueDate = dueDate ? new Date(dueDate) : null;
    if (remarks !== undefined) updateFields.remarks = String(remarks || '').trim();
    if (staticNode) {
      updateFields.timelineNodeId = staticNode._id;
      updateFields.node = staticNode._id;
    }
    updateFields.projectId = targetProjectId;
    updateFields.nodeId = cleanKey;
    delete updateFields.project;

    // Enforce required fields check: A subtask/stage CANNOT be COMPLETED if required fields are missing
    if (updateFields.status === 'COMPLETED') {
      const nodeStatusService = require('./node-status.service');
      const fieldCheck = await nodeStatusService.validateRequiredFields(cleanKey, targetProjectId, formData);
      const childCheck = await nodeStatusService.validateChildSubtasks(cleanKey, targetProjectId);

      if (!fieldCheck.valid || !childCheck.valid) {
        updateFields.status = 'IN_PROGRESS';
        updateFields.completionDate = null;
      }
    }

    if (updateFields.status === 'COMPLETED' && !updateFields.completionDate) {
      updateFields.completionDate = new Date();
    } else if (updateFields.status && updateFields.status !== 'COMPLETED') {
      updateFields.completionDate = null;
    }

    const findQuery = {
      projectId: targetProjectId,
      nodeId: cleanKey
    };

    const record = await TimelineData.findOneAndUpdate(
      findQuery,
      {
        $set: updateFields
      },
      { upsert: true, new: true, runValidators: true }
    )
            .populate('assignedTo', 'name email designation')
      .populate('node');

    if (updateFields.status === 'COMPLETED') {
      try {
        const timelineDependencyService = require('./timeline-dependency.service');
        await timelineDependencyService.handleNodeCompletionCascade(cleanKey, projId);
      } catch (cascadeErr) {
        console.error('[DependencyCascade] Error in cascade handler:', cascadeErr.message);
      }
    }

    if (formData !== undefined) {
      await formSchemasService.saveFormData(cleanKey, projId, formData);
    }

    return record;
  }

  /**
   * Update node status with permissions and dependency checks
   */
  async updateNodeStatus(projectId, nodeId, newStatus, comment, employee, projectMembership) {
    const nodeStatusService = require('./node-status.service');
    return await nodeStatusService.updateNodeStatus(
      projectId,
      nodeId,
      newStatus,
      comment,
      employee,
      projectMembership
    );
  }

  /**
   * Assign a node to an employee
   */
  async assignNode(projectId, nodeId, employeeId, actorId = null) {
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();
    const cleanKey = await this._resolveNodeKey(nodeId);

    const validEmpId = (employeeId && employeeId !== 'null' && employeeId !== 'undefined' && mongoose.Types.ObjectId.isValid(employeeId))
      ? employeeId
      : null;

    let updatedRuntime = await this.saveNodeData({
      projectId: targetProjectId,
      nodeId: cleanKey,
      assignedTo: validEmpId
    });

    if (validEmpId && (updatedRuntime.status === 'NOT_STARTED' || updatedRuntime.status === 'PENDING')) {
      updatedRuntime = await this.saveNodeData({
        projectId: targetProjectId,
        nodeId: cleanKey,
        status: 'IN_PROGRESS'
      });
    }

    // Activity & Notification
    await Activity.create({
      projectId: targetProjectId,
      actor: actorId || null,
      action: 'CONTRIBUTOR_ASSIGNED',
      resourceType: 'TimelineData',
      resourceId: updatedRuntime._id,
      metadata: { nodeId: cleanKey, employeeId: validEmpId }
    }).catch(() => { });

    if (validEmpId) {
      try {
        const staticNode = await TimelineNodeStatic.findOne({
      $or: [{ timelineNodeId: cleanKey }, { id: cleanKey }]
    }).lean();
        const nodeName = staticNode?.name || cleanKey;
        await Notification.create({
          recipient: validEmpId,
          projectId: targetProjectId,
          title: `Task Assigned: ${nodeName}`,
          message: `You have been assigned to "${nodeName}" in project ${targetProjectId}.`,
          type: 'TASK_ASSIGNED',
          metadata: {
            nodeId: updatedRuntime._id,
            nodeName: nodeName,
            nodeKey: cleanKey,
            projectId: targetProjectId
          }
        });
      } catch (_) { }
    }

    return await this.getNodeById(targetProjectId, cleanKey);
  }

  /**
   * Update formData and remarks for a node
   */
  async updateNodeForm(projectId, nodeId, formData, employee, projectMembership) {
    const project = await this._findProject(projectId);
    const targetProjectId = (project?.projectId || (typeof projectId === 'string' ? projectId : '')).trim().toUpperCase();
    const cleanKey = await this._resolveNodeKey(nodeId);

    const existingDoc = await TimelineData.findOne({ projectId: targetProjectId, nodeId: cleanKey }).lean();
    const mergedFormData = { ...(existingDoc?.formData || {}), ...formData };

    // Validate compulsory fields and contact number fields against node schema
    const schema = await formSchemasService.getSchema(cleanKey, targetProjectId);
    const missingRequiredFields = [];

    if (schema && Array.isArray(schema.fields)) {
      for (const field of schema.fields) {
        const k = field.key || field.name;
        const val = mergedFormData[k];

        // 1. Mandatory / Compulsory fields check
        if (field.required) {
          if ((k === 'projectName' || k === 'projectTitle') && (project?.projectName || project?.title)) {
            // headline project title is auto-provided
          } else {
            const isEmpty = val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);
            if (isEmpty) {
              missingRequiredFields.push(field.label || k);
            }
          }
        }

        // 2. Contact / Phone number fields validation: only numbers, strictly NO alphabets
        const isContact = (
          (field.type === 'tel' || field.type === 'phone' || /(phone|mobile|tel|contactno|contactnumber|poccontact|supportingorgcontact)/i.test(k) || /\b(phone|mobile|contact\s*no|contact\s*number)\b/i.test(field.label || '')) &&
          !/(person|address|name)/i.test(k) &&
          !/(person|address|name)/i.test(field.label || '') &&
          field.type !== 'textarea'
        );

        if (isContact && val !== undefined && val !== null && String(val).trim() !== '') {
          const strVal = String(val).trim();
          if (/[a-zA-Z]/.test(strVal)) {
            throw new AppError(`Field '${field.label || k}' must contain only numbers, no alphabets are allowed.`, 400, 'INVALID_CONTACT_NUMBER');
          }
        }
      }
    }

    const remarksToSave = formData.remarks !== undefined ? formData.remarks : (existingDoc?.remarks || '');

    // Determine status: If any required field is missing, status MUST NOT be COMPLETED — it must be IN_PROGRESS
    let calculatedStatus = existingDoc?.status || 'IN_PROGRESS';
    if (missingRequiredFields.length > 0) {
      calculatedStatus = 'IN_PROGRESS';
    } else if (['PROJECT_CREATED', 'LEAD_CREATION', 'PROJECT_REVIEWER'].includes(cleanKey)) {
      if (formData.confirmed === 'YES' || formData.pmReviewStatus === 'APPROVED' || formData.projectReviewed === 'YES' || formData.projectCreated === 'YES' || formData.autoComplete === true) {
        calculatedStatus = 'COMPLETED';
      }
    } else if (calculatedStatus === 'NOT_STARTED') {
      calculatedStatus = 'IN_PROGRESS';
    }

    const updatedRuntime = await this.saveNodeData({
      projectId: targetProjectId,
      nodeId: cleanKey,
      status: calculatedStatus,
      remarks: remarksToSave
    });

    // Save form values into form_data collection (single write)
    await formSchemasService.saveFormData(cleanKey, targetProjectId, mergedFormData, employee);

    // Auto-complete Stage 1 if confirmed and all required fields are filled
    if (['PROJECT_CREATED', 'LEAD_CREATION', 'PROJECT_REVIEWER'].includes(cleanKey)) {
      if ((formData.confirmed === 'YES' || formData.pmReviewStatus === 'APPROVED' || formData.projectReviewed === 'YES' || formData.projectCreated === 'YES' || formData.autoComplete === true) && missingRequiredFields.length === 0) {
        await this.saveNodeData({
          projectId: targetProjectId,
          nodeId: cleanKey,
          status: 'COMPLETED'
        });
      }
    }

    // Activity log
    await Activity.create({
      projectId: targetProjectId,
      actor: employee?._id || null,
      action: 'FORM_UPDATED',
      resourceType: 'TimelineData',
      resourceId: updatedRuntime._id,
      metadata: { nodeId: cleanKey, keys: Object.keys(formData) }
    }).catch(() => { });

    return await this.getNodeById(targetProjectId, cleanKey);
  }

  /**
   * Reset timeline data for a project (re-creates clean state from static blueprint)
   */
  async resetTimelineForProject(projectId) {
    const targetProjectId = this._normalizeProjectId(projectId);
    await TimelineData.deleteMany({ projectId: targetProjectId });
    await this.initializeProjectTimelineData(targetProjectId);
    return await this.getTimelineHierarchy(targetProjectId);
  }

  /**
   * Quick update status
   */
  async updateStatus(projectId, nodeId, status, completionDate = null) {
    return await this.saveNodeData({
      projectId,
      nodeId,
      status,
      completionDate
    });
  }

  /**
   * Quick update formData
   */
  async updateFormData(projectId, nodeId, formData) {
    return await this.saveNodeData({
      projectId,
      nodeId,
      formData
    });
  }

  /**
   * Quick update remarks
   */
    /**
   * Update node due date
   */
  async updateDueDate(projectId, nodeId, dueDate) {
    const projId = this._normalizeProjectId(projectId);
    const cleanKey = await this._resolveNodeKey(nodeId);
    const parsedDate = dueDate ? new Date(dueDate) : null;

    const record = await TimelineData.findOneAndUpdate(
      { projectId: projId, nodeId: cleanKey },
      { $set: { dueDate: parsedDate } },
      { new: true, upsert: true }
    );
    return record;
  }

  async updateRemarks(projectId, nodeId, remarks) {
    return await this.saveNodeData({
      projectId,
      nodeId,
      remarks
    });
  }
}

module.exports = new TimelineDataService();
