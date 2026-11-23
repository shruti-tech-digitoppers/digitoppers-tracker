const { AppError } = require('../../core/errors');
const coreApi = require('../../services/core-api.service');
const mongoose = require('mongoose');

/**
 * School Controller (Strict Core Backend Gateway)
 *
 * NO local database fallbacks: Core Backend is the STRICT and ONLY source of truth.
 * All school master data operations proxy directly to Core Backend via coreApi service.
 * Tracker deployment operations (installation, training, vendor PO/PI) use ProjectSchools.
 */

// GET /api/v1/schools/core or /api/v1/projects/:projectId/core-schools
exports.getCoreSchools = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    if (!projectId) {
      return res.status(200).json({
        success: true,
        source: 'CORE_BACKEND',
        count: 0,
        data: []
      });
    }

    const schools = await coreApi.getProjectSchools(projectId);

    return res.status(200).json({
      success: true,
      source: 'CORE_BACKEND',
      count: Array.isArray(schools) ? schools.length : 0,
      data: schools || []
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/projects/:projectId/schools or /api/v1/schools?projectId=...
exports.getSchools = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    let schools = [];

    if (projectId) {
      schools = await coreApi.getProjectSchools(projectId);
    } else {
      schools = await coreApi.getSchools(req.query);
    }

    return res.status(200).json({
      success: true,
      source: 'CORE_BACKEND',
      count: Array.isArray(schools) ? schools.length : 0,
      data: schools || []
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/schools/:id - Fetch single school from Core Backend
exports.getSchoolById = async (req, res, next) => {
  try {
    const schoolId = req.params.id || req.params.schoolId;
    const school = await coreApi.getSchoolById(schoolId);

    if (!school) {
      return next(new AppError(`School '${schoolId}' not found in Core Backend`, 404, 'NOT_FOUND'));
    }

    return res.status(200).json({
      success: true,
      source: 'CORE_BACKEND',
      data: school
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/schools - Create School in Core Backend
exports.createSchool = async (req, res, next) => {
  try {
    const created = await coreApi.createSchool(req.body);

    return res.status(201).json({
      success: true,
      source: 'CORE_BACKEND',
      message: 'School created successfully in Core Backend',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/schools/bulk - Bulk Create Schools in Core Backend
exports.bulkCreateSchools = async (req, res, next) => {
  try {
    const { projectId, schools } = req.body;
    if (!Array.isArray(schools) || schools.length === 0) {
      return next(new AppError('schools array is required', 400, 'BAD_REQUEST'));
    }

    const createdList = [];
    for (const item of schools) {
      const s = await coreApi.createSchool({ ...item, projectId });
      createdList.push(s);
    }

    res.status(201).json({
      success: true,
      source: 'CORE_BACKEND',
      message: `Successfully created ${createdList.length} schools in Core Backend`,
      count: createdList.length,
      data: createdList
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/schools/:id - Update School in Core Backend
exports.updateSchool = async (req, res, next) => {
  try {
    const schoolId = req.params.id || req.params.schoolId;
    const updated = await coreApi.updateSchool(schoolId, req.body);

    return res.status(200).json({
      success: true,
      source: 'CORE_BACKEND',
      message: 'School updated successfully in Core Backend',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/schools/:id - Delete School in Core Backend
exports.deleteSchool = async (req, res, next) => {
  try {
    const schoolId = req.params.id || req.params.schoolId;
    await coreApi.deleteSchool(schoolId);

    return res.status(200).json({
      success: true,
      source: 'CORE_BACKEND',
      message: 'School deleted successfully in Core Backend'
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/schools/:id/installation
exports.updateSchoolInstallation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ProjectSchools = require('../project-schools/project-schools.model');

    const updateDoc = await ProjectSchools.findOneAndUpdate(
      { "schools._id": id },
      { $set: { "schools.$.installation": req.body } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'School installation status updated successfully',
      data: req.body
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/schools/:id/training
exports.updateSchoolTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ProjectSchools = require('../project-schools/project-schools.model');

    const updateDoc = await ProjectSchools.findOneAndUpdate(
      { "schools._id": id },
      { $set: { "schools.$.training": req.body } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'School training status updated successfully',
      data: req.body
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/projects/:projectId/schools/execution
exports.getProjectSchoolsExecution = async (req, res, next) => {
  try {
    const paramId = req.params.projectId || req.query.projectId;
    const ProjectSchools = require('../project-schools/project-schools.model');

    const projectObj = await coreApi.getProjectById(paramId);

    const queryFilter = projectObj 
      ? { $or: [{ project: projectObj._id }, { projectId: projectObj.projectId }] }
      : { projectId: paramId };

    const doc = await ProjectSchools.findOne(queryFilter)
      .populate('schools.installation.assignedEngineer', 'name email phone designation')
      .populate('schools.training.trainer', 'name email phone designation');

    res.status(200).json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/projects/:projectId/schools/summary
exports.getProjectSchoolProgress = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    const ProjectSchools = require('../project-schools/project-schools.model');

    const project = await coreApi.getProjectById(projectId);
    const pCode = (project?.projectId || projectId || '').toString().toLowerCase();
    const rawId = project?._id;

    const doc = await ProjectSchools.findOne({
      $or: [{ project: rawId }, { projectId: pCode }, { projectId: pCode.toUpperCase() }, { projectId: project?.projectId }].filter(Boolean)
    }).lean();

    const schools = (doc && doc.schools) || [];
    const totalSchools = schools.length;

    let installationCompleted = 0;
    let installationInProgress = 0;
    let installationScheduled = 0;
    let installationPending = 0;
    let trainingCompleted = 0;
    let trainingScheduled = 0;
    let trainingPending = 0;
    let totalTeachersTrained = 0;

    schools.forEach(s => {
      const inst = s.installation?.status;
      if (inst === 'COMPLETED') installationCompleted++;
      else if (inst === 'IN_PROGRESS') installationInProgress++;
      else if (inst === 'ON_HOLD' || inst === 'SCHEDULED') installationScheduled++;
      else installationPending++;

      const tr = s.training?.status;
      if (tr === 'COMPLETED') trainingCompleted++;
      else if (tr === 'SCHEDULED') trainingScheduled++;
      else trainingPending++;

      totalTeachersTrained += (s.training?.teachersAttended || 0);
    });

    res.status(200).json({
      success: true,
      data: {
        totalSchools,
        installationCompleted,
        installationInProgress,
        installationScheduled,
        installationPending,
        trainingCompleted,
        trainingScheduled,
        trainingPending,
        totalTeachersTrained
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/projects/:projectId/schools/:schoolId/hardware/:hardwareKey/vendor-po
exports.raiseVendorPO = async (req, res, next) => {
  try {
    const { projectId, schoolId, hardwareKey } = req.params;
    const { poNumber, poDate, poDocumentUrl, poAmount, issuingOrganization, remarks } = req.body;
    const ProjectSchools = require('../project-schools/project-schools.model');

    const project = await coreApi.getProjectById(projectId);
    if (!project) return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));

    const poEntry = {
      poNumber: poNumber || `VPO-${Date.now()}`,
      poDate: poDate ? new Date(poDate) : new Date(),
      poDocumentUrl: poDocumentUrl || '',
      issuingOrganization: issuingOrganization || 'Digitoppers EdTech',
      poAmount: Number(poAmount) || 0,
      submittedByDept: 'OPS',
      submittedBy: req.employee ? req.employee._id : null,
      remarks: remarks || ''
    };

    const updated = await ProjectSchools.findOneAndUpdate(
      { project: project._id },
      {
        $push: {
          "schools.$[s].hardware.$[h].poAndPi.purchaseOrders": poEntry
        }
      },
      {
        arrayFilters: [
          { "s.schoolId": schoolId },
          { "h.hardwareKey": hardwareKey }
        ],
        new: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Vendor PO raised successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/projects/:projectId/schools/:schoolId/hardware/:hardwareKey/vendor-pi
exports.clearVendorPI = async (req, res, next) => {
  try {
    const { projectId, schoolId, hardwareKey } = req.params;
    const { piNumber, piDate, piDocumentUrl, ewayBillNumber, paymentStatus, paymentReferenceUTR, remarks } = req.body;
    const ProjectSchools = require('../project-schools/project-schools.model');

    const project = await coreApi.getProjectById(projectId);
    if (!project) return next(new AppError('Project not found', 404, 'PROJECT_NOT_FOUND'));

    const piEntry = {
      piNumber: piNumber || `VPI-${Date.now()}`,
      piDate: piDate ? new Date(piDate) : new Date(),
      ewayBillNumber: ewayBillNumber || '',
      paymentStatus: paymentStatus || 'PAID',
      piDocumentUrl: piDocumentUrl || '',
      paymentReferenceUTR: paymentReferenceUTR || '',
      approvedByDept: 'FIN',
      approvedBy: req.employee ? req.employee._id : null,
      remarks: remarks || ''
    };

    const updated = await ProjectSchools.findOneAndUpdate(
      { project: project._id },
      {
        $set: {
          "schools.$[s].hardware.$[h].poAndPi.paymentStatus": paymentStatus || 'PAID'
        },
        $push: {
          "schools.$[s].hardware.$[h].poAndPi.proformaInvoices": piEntry
        }
      },
      {
        arrayFilters: [
          { "s.schoolId": schoolId },
          { "h.hardwareKey": hardwareKey }
        ],
        new: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Vendor PI cleared and recorded successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/engineers/:engineerId/schools
exports.getFieldEngineerSchools = async (req, res, next) => {
  try {
    const { engineerId } = req.params;
    const { projectId } = req.query;
    const ProjectSchools = require('../project-schools/project-schools.model');

    const matchCriteria = {};
    if (projectId) {
      const project = await coreApi.getProjectById(projectId);
      if (project) matchCriteria.project = project._id;
    }

    const mySites = await ProjectSchools.aggregate([
      ...(Object.keys(matchCriteria).length > 0 ? [{ $match: matchCriteria }] : []),
      { $unwind: "$schools" },
      { $match: { "schools.installation.assignedEngineer": new mongoose.Types.ObjectId(engineerId) } },
      { $project: {
        projectId: "$projectId",
        projectName: "$projectName",
        schoolId: "$schools.schoolId",
        schoolName: "$schools.schoolName",
        hardware: "$schools.hardware",
        installation: "$schools.installation",
        deploymentStatus: "$schools.deploymentStatus"
      }}
    ]);

    res.status(200).json({
      success: true,
      count: mySites.length,
      data: mySites
    });
  } catch (error) {
    next(error);
  }
};
