const School = require('./school.model');
const { AppError } = require('../../core/errors');
const coreApi = require('../../services/core-api.service');

async function resolveProject(paramId) {
  if (!paramId) return null;
  return await coreApi.getProjectById(paramId);
}

// GET /api/v1/projects/:projectId/schools or /api/v1/schools?projectId=...
exports.getSchools = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    const filter = { isActive: true };

    if (projectId) {
      const proj = await resolveProject(projectId);
      const code = proj ? (proj.projectId || String(proj._id)).toUpperCase() : String(projectId).toUpperCase();
      const rawId = proj ? proj._id : projectId;

      filter.$or = [
        { projectId: code },
        { projectId: String(rawId) },
        { projectId: rawId }
      ].filter(Boolean);
    }
    if (req.query.installationStatus) filter['installation.status'] = req.query.installationStatus;
    if (req.query.trainingStatus) filter['training.status'] = req.query.trainingStatus;
    if (req.query.assignedEngineerId) filter['installation.assignedEngineerId'] = req.query.assignedEngineerId;
    if (req.query.assignedTrainerId) filter['training.assignedTrainerId'] = req.query.assignedTrainerId;
    if (req.query.district) filter.district = new RegExp(req.query.district, 'i');
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { district: new RegExp(req.query.search, 'i') }
      ];
    }

    const schools = await School.find(filter)
      .populate('solutions.solutionId', 'label name icon key')
      .populate('hardware.hardwareId', 'label name category unit')
      .populate('installation.assignedEngineerId', 'name email phone designation')
      .populate('training.assignedTrainerId', 'name email phone designation')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: schools.length,
      data: schools
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/schools/:id
exports.getSchoolById = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id)
      
      .populate('solutions.solutionId', 'label name icon key')
      .populate('hardware.hardwareId', 'label name category unit modelNumber')
      .populate('installation.assignedEngineerId', 'name email phone designation')
      .populate('training.assignedTrainerId', 'name email phone designation');

    if (!school) {
      return next(new AppError('School not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/schools
exports.createSchool = async (req, res, next) => {
  try {
    const school = await School.create(req.body);
    
    // Master project school count is managed by Core Backend

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/schools/bulk
exports.bulkCreateSchools = async (req, res, next) => {
  try {
    const { projectId, schools } = req.body;
    if (!projectId || !Array.isArray(schools) || schools.length === 0) {
      return next(new AppError('projectId and non-empty schools array are required', 400, 'BAD_REQUEST'));
    }

    const preparedSchools = schools.map(s => ({ ...s, projectId }));
    const insertedSchools = await School.insertMany(preparedSchools);

    res.status(201).json({
      success: true,
      message: `Successfully created ${insertedSchools.length} schools`,
      count: insertedSchools.length,
      data: insertedSchools
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/schools/:id
exports.updateSchool = async (req, res, next) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!school) {
      return next(new AppError('School not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: school
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/schools/:id/installation
exports.updateSchoolInstallation = async (req, res, next) => {
  try {
    const updates = {};
    for (const [key, val] of Object.entries(req.body)) {
      updates[`installation.${key}`] = val;
    }

    const school = await School.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('installation.assignedEngineerId', 'name email phone');

    if (!school) {
      return next(new AppError('School not found', 404, 'NOT_FOUND'));
    }

    // Sync to ProjectSchools & Timeline roll-up
    try {
      const ProjectSchools = require('../project-schools/project-schools.model');
      const timelineService = require('../timeline/timeline.service');
      if (school.projectId) {
        await ProjectSchools.updateOne(
          { project: school.projectId, "schools.school": school._id },
          { $set: { "schools.$.installation": school.installation } }
        );
        if (timelineService.syncSchoolProgressToTimeline) {
          await timelineService.syncSchoolProgressToTimeline(school.projectId);
        }
      }
    } catch (syncErr) {
      console.warn('Note on school installation roll-up sync:', syncErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'School installation status updated successfully',
      data: school.installation
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/schools/:id/training
exports.updateSchoolTraining = async (req, res, next) => {
  try {
    const updates = {};
    for (const [key, val] of Object.entries(req.body)) {
      updates[`training.${key}`] = val;
    }

    const school = await School.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('training.assignedTrainerId', 'name email phone');

    if (!school) {
      return next(new AppError('School not found', 404, 'NOT_FOUND'));
    }

    // Sync to ProjectSchools & Timeline roll-up
    try {
      const ProjectSchools = require('../project-schools/project-schools.model');
      const timelineService = require('../timeline/timeline.service');
      if (school.projectId) {
        await ProjectSchools.updateOne(
          { project: school.projectId, "schools.school": school._id },
          { $set: { "schools.$.training": school.training } }
        );
        if (timelineService.syncSchoolProgressToTimeline) {
          await timelineService.syncSchoolProgressToTimeline(school.projectId);
        }
      }
    } catch (syncErr) {
      console.warn('Note on school training roll-up sync:', syncErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'School training status updated successfully',
      data: school.training
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/projects/:projectId/schools/execution (ProjectSchools aggregator)
exports.getProjectSchoolsExecution = async (req, res, next) => {
  try {
    const paramId = req.params.projectId || req.query.projectId;
    const ProjectSchools = require('../project-schools/project-schools.model');

    const projectObj = await resolveProject(paramId);

    const queryFilter = projectObj 
      ? { $or: [{ project: projectObj._id }, { projectId: projectObj.projectId }] }
      : { projectId: paramId };

    const doc = await ProjectSchools.findOne(queryFilter)
      .populate('schools.school', 'name address district state contactPerson')
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
    const { projectId } = req.params;
    const mongoose = require('mongoose');

    const proj = await resolveProject(projectId);
    let pId = proj ? proj._id : (mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : null);

    if (!pId) {
      return res.status(200).json({
        success: true,
        data: {
          totalSchools: 0,
          installationCompleted: 0,
          installationInProgress: 0,
          installationScheduled: 0,
          installationPending: 0,
          trainingCompleted: 0,
          trainingScheduled: 0,
          trainingPending: 0,
          totalTeachersTrained: 0
        }
      });
    }

    const progressStats = await School.aggregate([
      { $match: { projectId: pId, isActive: true } },
      {
        $group: {
          _id: '$projectId',
          totalSchools: { $sum: 1 },
          installationCompleted: {
            $sum: { $cond: [{ $eq: ['$installation.status', 'COMPLETED'] }, 1, 0] }
          },
          installationInProgress: {
            $sum: { $cond: [{ $eq: ['$installation.status', 'IN_PROGRESS'] }, 1, 0] }
          },
          installationScheduled: {
            $sum: { $cond: [{ $eq: ['$installation.status', 'SCHEDULED'] }, 1, 0] }
          },
          installationPending: {
            $sum: { $cond: [{ $eq: ['$installation.status', 'PENDING'] }, 1, 0] }
          },
          trainingCompleted: {
            $sum: { $cond: [{ $eq: ['$training.status', 'COMPLETED'] }, 1, 0] }
          },
          trainingScheduled: {
            $sum: { $cond: [{ $eq: ['$training.status', 'SCHEDULED'] }, 1, 0] }
          },
          trainingPending: {
            $sum: { $cond: [{ $eq: ['$training.status', 'PENDING'] }, 1, 0] }
          },
          totalTeachersTrained: { $sum: '$training.teachersTrainedCount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: progressStats[0] || {
        totalSchools: 0,
        installationCompleted: 0,
        installationInProgress: 0,
        installationScheduled: 0,
        installationPending: 0,
        trainingCompleted: 0,
        trainingScheduled: 0,
        trainingPending: 0,
        totalTeachersTrained: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/projects/:projectId/schools/:schoolId/hardware/:hardwareKey/vendor-po (Recipe 4)
exports.raiseVendorPO = async (req, res, next) => {
  try {
    const { projectId, schoolId, hardwareKey } = req.params;
    const { poNumber, poDate, poDocumentUrl, poAmount, issuingOrganization, remarks } = req.body;
    const mongoose = require('mongoose');
    const ProjectSchools = require('../project-schools/project-schools.model');

    const project = await resolveProject(projectId);
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

// POST /api/v1/projects/:projectId/schools/:schoolId/hardware/:hardwareKey/vendor-pi (Recipe 5)
exports.clearVendorPI = async (req, res, next) => {
  try {
    const { projectId, schoolId, hardwareKey } = req.params;
    const { piNumber, piDate, piDocumentUrl, ewayBillNumber, paymentStatus, paymentReferenceUTR, remarks } = req.body;
    const mongoose = require('mongoose');
    const ProjectSchools = require('../project-schools/project-schools.model');

    const project = await resolveProject(projectId);
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

// GET /api/v1/engineers/:engineerId/schools (Recipe 3)
exports.getFieldEngineerSchools = async (req, res, next) => {
  try {
    const { engineerId } = req.params;
    const { projectId } = req.query;
    const mongoose = require('mongoose');
    const ProjectSchools = require('../project-schools/project-schools.model');

    const matchCriteria = {};
    if (projectId) {
      const project = await resolveProject(projectId);
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
