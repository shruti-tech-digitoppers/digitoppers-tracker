const ProjectSchools = require('./project-schools.model');
const School = require('../schools/school.model');
const { AppError } = require('../../core/errors');
const mongoose = require('mongoose');
const coreApi = require('../../services/core-api.service');

async function resolveProject(paramId) {
  if (!paramId) return null;
  return await coreApi.getProjectById(paramId);
}

// GET /api/v1/project-schools
exports.getAllProjectSchools = async (req, res, next) => {
  try {
    const list = await ProjectSchools.find()
      .populate('project', 'projectId projectName title status numberOfSchools')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/project-schools/project/:projectId
exports.getProjectSchoolsByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await resolveProject(projectId);

    if (!project) {
      return next(new AppError('Project not found', 404, 'NOT_FOUND'));
    }

    const doc = await ProjectSchools.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    })
      .populate('project', 'projectId projectName title status numberOfSchools')
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

// GET /api/v1/project-schools/:id
exports.getProjectSchoolsById = async (req, res, next) => {
  try {
    const doc = await ProjectSchools.findById(req.params.id)
      .populate('project', 'projectId projectName title status')
      .populate('schools.school', 'name address district state contactPerson')
      .populate('schools.installation.assignedEngineer', 'name email phone designation')
      .populate('schools.training.trainer', 'name email phone designation');

    if (!doc) {
      return next(new AppError('ProjectSchools document not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/project-schools/project/:projectId/school/:schoolId
exports.updateSchoolDeployment = async (req, res, next) => {
  try {
    const { projectId, schoolId } = req.params;
    const project = await resolveProject(projectId);

    if (!project) {
      return next(new AppError('Project not found', 404, 'NOT_FOUND'));
    }

    const doc = await ProjectSchools.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    });

    if (!doc) {
      return next(new AppError('ProjectSchools not found for this project', 404, 'NOT_FOUND'));
    }

    const schoolUnit = doc.schools.find(
      s => String(s.school) === String(schoolId) || String(s.schoolId) === String(schoolId) || String(s._id) === String(schoolId)
    );

    if (!schoolUnit) {
      return next(new AppError('School not found in project deployments', 404, 'NOT_FOUND'));
    }

    // Apply updates
    if (req.body.deploymentStatus) schoolUnit.deploymentStatus = req.body.deploymentStatus;
    if (req.body.siteSurvey) Object.assign(schoolUnit.siteSurvey, req.body.siteSurvey);
    if (req.body.installation) Object.assign(schoolUnit.installation, req.body.installation);
    if (req.body.training) Object.assign(schoolUnit.training, req.body.training);
    if (req.body.hardware) schoolUnit.hardware = req.body.hardware;
    if (req.body.solutions) schoolUnit.solutions = req.body.solutions;

    await doc.save();

    res.status(200).json({
      success: true,
      message: 'School deployment updated successfully',
      data: schoolUnit
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/project-schools/project/:projectId/summary
exports.getProjectSchoolsSummary = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await resolveProject(projectId);

    if (!project) {
      return next(new AppError('Project not found', 404, 'NOT_FOUND'));
    }

    const doc = await ProjectSchools.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    }).lean();

    const schools = (doc && doc.schools) || [];
    const totalSchools = schools.length;

    let installationCompleted = 0;
    let installationInProgress = 0;
    let installationScheduled = 0;
    let installationNotStarted = 0;

    let trainingCompleted = 0;
    let trainingScheduled = 0;
    let trainingNotStarted = 0;
    let totalTeachersTrained = 0;

    schools.forEach(s => {
      const inst = s.installation?.status;
      if (inst === 'COMPLETED') installationCompleted++;
      else if (inst === 'IN_PROGRESS') installationInProgress++;
      else if (inst === 'ON_HOLD') installationScheduled++;
      else installationNotStarted++;

      const tr = s.training?.status;
      if (tr === 'COMPLETED') trainingCompleted++;
      else if (tr === 'SCHEDULED') trainingScheduled++;
      else trainingNotStarted++;

      totalTeachersTrained += (s.training?.teachersAttended || 0);
    });

    res.status(200).json({
      success: true,
      data: {
        projectId: project._id,
        projectCode: project.projectId,
        projectName: project.projectName || project.title,
        totalSchools,
        installation: {
          completed: installationCompleted,
          inProgress: installationInProgress,
          scheduled: installationScheduled,
          notStarted: installationNotStarted,
          percent: totalSchools ? Math.round((installationCompleted / totalSchools) * 100) : 0
        },
        training: {
          completed: trainingCompleted,
          scheduled: trainingScheduled,
          notStarted: trainingNotStarted,
          totalTeachersTrained,
          percent: totalSchools ? Math.round((trainingCompleted / totalSchools) * 100) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
