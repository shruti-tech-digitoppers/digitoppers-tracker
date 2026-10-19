const Training = require('./training.model');
const Project = require('../projects/project.model');
const ProjectSchools = require('../project-schools/project-schools.model');
const School = require('../schools/school.model');
const { AppError } = require('../../core/errors');
const mongoose = require('mongoose');

// Helper to resolve project by ObjectId or projectId code
async function resolveProject(paramId) {
  if (!paramId) return null;
  if (mongoose.Types.ObjectId.isValid(paramId) && String(paramId).length === 24) {
    const p = await Project.findById(paramId);
    if (p) return p;
  }
  return await Project.findOne({
    $or: [{ projectId: String(paramId).toUpperCase() }, { projectId: String(paramId) }]
  });
}

// Helper: Ensure or initialize Training document from Project & ProjectSchools
async function ensureTrainingDoc(project) {
  let trainingDoc = await Training.findOne({
    $or: [{ project: project._id }, { projectId: project.projectId }]
  });

  if (!trainingDoc) {
    // Check if ProjectSchools exists
    const psDoc = await ProjectSchools.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    }).populate('schools.school');

    const schoolsList = [];
    const plansMap = {};
    const execsMap = {};

    if (psDoc && Array.isArray(psDoc.schools)) {
      psDoc.schools.forEach((su) => {
        const tr = su.training || {};
        const schId = String(su.school?._id || su.school || su._id);
        const unit = {
          school: su.school?._id || su.school || su._id,
          schoolId: schId,
          schoolName: su.schoolName || su.school?.name || 'School',
          address: su.school?.address || '',
          contactPerson: su.school?.pocName || su.school?.contactPerson || '',
          contactPhone: su.school?.pocContact || '',
          planningStatus: tr.status === 'SCHEDULED' ? 'SCHEDULED' : tr.status || 'PENDING',
          planOutDate: tr.planOutDate || '',
          assignedTrainerId: tr.trainer || null,
          trainerName: tr.trainerName || '',
          trainerPhone: tr.trainerPhone || '',
          trainers: tr.trainers || [],
          executionStatus: tr.status === 'COMPLETED' ? 'COMPLETED' : 'NOT_STARTED',
          trainingDate: tr.trainingDate || null,
          teachersTrainedCount: tr.teachersAttended || 0,
          deliveryConfirmationSheetUrl: tr.deliveryConfirmationSheetUrl || '',
          appreciationLetterUrl: tr.appreciationLetterUrl || '',
          workCompletionLetterUrl: tr.workCompletionLetterUrl || '',
          teachersDetailsDocUrl: tr.teachersDetailsDocUrl || '',
          attendanceSheetUrl: tr.attendanceSheetUrl || '',
          checklist: tr.checklist || {},
          photographyPhotosUrl: tr.photographyPhotosUrl || '',
          googleReviewsNotes: tr.googleReviewsNotes || '',
          feedbackRating: tr.feedbackRating || null,
          issuesNoted: tr.issuesNoted || '',
          onGroundFeedback: tr.onGroundFeedback || '',
          remarks: tr.remarks || ''
        };
        schoolsList.push(unit);
        plansMap[schId] = unit;
        execsMap[schId] = unit;
      });
    }

    trainingDoc = await Training.create({
      project: project._id,
      projectId: project.projectId,
      projectName: project.projectName || project.title || 'Project',
      overallStatus: psDoc?.training?.overallStatus || 'NOT_STARTED',
      schools: schoolsList,
      schoolWiseTrainingPlans: psDoc?.training?.schoolWiseTrainingPlans || plansMap,
      schoolWiseTrainingExecutions: psDoc?.training?.schoolWiseTrainingExecutions || execsMap,
      totalSchools: schoolsList.length,
      scheduledSchools: schoolsList.filter((s) => s.planningStatus === 'SCHEDULED').length,
      completedSchools: schoolsList.filter((s) => s.executionStatus === 'COMPLETED').length,
      issuesNoted: psDoc?.training?.issuesNoted || '',
      onGroundFeedback: psDoc?.training?.onGroundFeedback || '',
      remarks: psDoc?.training?.remarks || ''
    });
  }

  return trainingDoc;
}

// ── 1. GET /api/v1/training ──
exports.getAllTrainings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status) {
      filter.overallStatus = status.toUpperCase();
    }
    if (search) {
      filter.$or = [
        { projectId: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } },
        { 'schools.schoolName': { $regex: search, $options: 'i' } },
        { 'schools.trainerName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [trainings, total] = await Promise.all([
      Training.find(filter)
        .populate('project', 'projectId projectName title status numberOfSchools')
        .populate('schools.school', 'name address district state contactPerson')
        .populate('schools.assignedTrainerId', 'name email phone designation')
        .populate('schools.trainers.trainerId', 'name email phone designation')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Training.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: trainings.length,
      total,
      data: trainings
    });
  } catch (error) {
    next(error);
  }
};

// ── 2. GET /api/v1/training/project/:projectId ──
exports.getTrainingByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await resolveProject(projectId);

    if (!project) {
      return next(new AppError('Project not found', 404, 'NOT_FOUND'));
    }

    let training = await Training.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    })
      .populate('project', 'projectId projectName title status numberOfSchools')
      .populate('schools.school', 'name address district state contactPerson')
      .populate('schools.assignedTrainerId', 'name email phone designation')
      .populate('schools.trainers.trainerId', 'name email phone designation')
      .populate('planning.submittedBy', 'name email designation');

    if (!training) {
      training = await ensureTrainingDoc(project);
    }

    res.status(200).json({
      success: true,
      data: training
    });
  } catch (error) {
    next(error);
  }
};

// ── 3. GET /api/v1/training/summary ──
exports.getTrainingSummary = async (req, res, next) => {
  try {
    const all = await Training.find().lean();

    let totalSchools = 0;
    let scheduledSchools = 0;
    let completedSchools = 0;
    let totalTeachersTrained = 0;

    all.forEach((t) => {
      totalSchools += t.totalSchools || (t.schools?.length || 0);
      scheduledSchools += t.scheduledSchools || 0;
      completedSchools += t.completedSchools || 0;
      if (Array.isArray(t.schools)) {
        t.schools.forEach((s) => {
          totalTeachersTrained += s.teachersTrainedCount || 0;
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalProjects: all.length,
        totalSchools,
        scheduledSchools,
        completedSchools,
        pendingSchools: Math.max(0, totalSchools - scheduledSchools - completedSchools),
        totalTeachersTrained,
        completionRate: totalSchools > 0 ? Math.round((completedSchools / totalSchools) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── 4. POST /api/v1/training/project/:projectId/plan (Planning & Scheduling Stage) ──
exports.saveTrainingPlanning = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await resolveProject(projectId);
    if (!project) return next(new AppError('Project not found', 404, 'NOT_FOUND'));

    const formData = req.body || {};
    const employee = req.user;

    // 1. Ensure Training doc exists
    let trainingDoc = await Training.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    });
    if (!trainingDoc) {
      trainingDoc = await ensureTrainingDoc(project);
    }

    // 2. Extract planned schools list
    let plannedList = [];
    if (Array.isArray(formData.plannedSchools) && formData.plannedSchools.length > 0) {
      plannedList = formData.plannedSchools;
    } else if (Array.isArray(formData.trainingPlanning) && formData.trainingPlanning.length > 0) {
      plannedList = formData.trainingPlanning;
    } else if (formData.schoolWiseTrainingPlans && typeof formData.schoolWiseTrainingPlans === 'object') {
      plannedList = Object.values(formData.schoolWiseTrainingPlans);
    }

    // Update Planning Meta
    trainingDoc.planning = {
      trainingType: formData.trainingType || trainingDoc.planning?.trainingType || 'Teacher Training',
      expectedParticipants: formData.expectedParticipants || trainingDoc.planning?.expectedParticipants || 0,
      trainingRosterUrl: formData.trainingRosterUrl || trainingDoc.planning?.trainingRosterUrl || '',
      plannedDates: formData.plannedDates || trainingDoc.planning?.plannedDates || '',
      remarks: formData.remarks || formData.planningRemarks || trainingDoc.planning?.remarks || '',
      submittedBy: employee?._id || trainingDoc.planning?.submittedBy,
      submittedAt: new Date()
    };

    const plansMap = { ...(trainingDoc.schoolWiseTrainingPlans || {}) };

    // 3. Update schools array & canonical plans map
    for (const item of plannedList) {
      const rawSchId = item.schoolId || item.id || item._id;
      if (!rawSchId && !item.schoolName) continue;

      let schRecord = null;
      if (rawSchId) {
        schRecord = await School.findById(rawSchId).catch(() => null);
      }
      if (!schRecord && item.schoolName) {
        schRecord = await School.findOne({ projectId: project._id, name: item.schoolName }).catch(() => null);
      }

      const realSchId = String(schRecord?._id || rawSchId);
      const schName = schRecord?.name || item.schoolName || 'School';
      const trainerId = item.trainerId || item.assignedTrainerId || item.technicalPersonId || (item.trainers && item.trainers[0]?.trainerId);
      const trainerName = item.trainerName || item.technicalPersonName || (item.trainers && item.trainers[0]?.name) || '';
      const trainerPhone = item.trainerPhone || item.contactNumber || (item.trainers && item.trainers[0]?.phone) || '';
      const planOutDate = item.planOutDate || item.trainingDate || '';

      // Update school unit in Training doc
      let unit = trainingDoc.schools.find(
        (s) => String(s.school) === realSchId || String(s.schoolId) === realSchId || s.schoolName === schName
      );

      if (!unit) {
        unit = {
          school: schRecord ? schRecord._id : realSchId,
          schoolId: realSchId,
          schoolName: schName,
          address: schRecord?.address || item.address || '',
          contactPerson: schRecord?.pocName || item.contactPerson || '',
          contactPhone: schRecord?.pocContact || item.contactPhone || '',
          planningStatus: 'SCHEDULED',
          planOutDate,
          assignedTrainerId: trainerId || null,
          trainerName,
          trainerPhone,
          trainers: item.trainers || [],
          executionStatus: 'NOT_STARTED'
        };
        trainingDoc.schools.push(unit);
      } else {
        unit.planningStatus = 'SCHEDULED';
        unit.planOutDate = planOutDate;
        unit.assignedTrainerId = trainerId || null;
        unit.trainerName = trainerName;
        unit.trainerPhone = trainerPhone;
        if (Array.isArray(item.trainers)) unit.trainers = item.trainers;
      }

      plansMap[realSchId] = {
        ...item,
        schoolId: realSchId,
        schoolName: schName,
        planOutDate,
        trainerId,
        trainerName,
        trainerPhone,
        trainers: item.trainers || unit.trainers || []
      };

      // Also Sync School collection
      if (schRecord) {
        await School.findByIdAndUpdate(schRecord._id, {
          $set: {
            'training.status': 'SCHEDULED',
            'training.assignedTrainerId': trainerId || null,
            'training.trainerName': trainerName,
            'training.trainerPhone': trainerPhone,
            'training.planOutDate': planOutDate,
            ...(Array.isArray(item.trainers) ? { 'training.trainers': item.trainers } : {})
          }
        }).catch(() => null);
      }
    }

    trainingDoc.schoolWiseTrainingPlans = plansMap;
    trainingDoc.totalSchools = trainingDoc.schools.length;
    trainingDoc.scheduledSchools = trainingDoc.schools.filter((s) => s.planningStatus === 'SCHEDULED').length;
    if (trainingDoc.overallStatus === 'NOT_STARTED' && trainingDoc.scheduledSchools > 0) {
      trainingDoc.overallStatus = 'SCHEDULED';
    }

    await trainingDoc.save();

    // 4. Sync to ProjectSchools for full backwards compatibility
    const psDoc = await ProjectSchools.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    });
    if (psDoc) {
      psDoc.training = psDoc.training || {};
      psDoc.training.planning = trainingDoc.planning;
      psDoc.training.schoolWiseTrainingPlans = plansMap;
      psDoc.markModified('training');
      await psDoc.save().catch(() => null);
    }

    res.status(200).json({
      success: true,
      message: 'Training planning and scheduling saved successfully',
      data: trainingDoc
    });
  } catch (error) {
    next(error);
  }
};

// ── 5. POST /api/v1/training/project/:projectId/execution (Execution & Completion Stage) ──
exports.saveTrainingExecution = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await resolveProject(projectId);
    if (!project) return next(new AppError('Project not found', 404, 'NOT_FOUND'));

    const formData = req.body || {};
    const employee = req.user;

    let trainingDoc = await Training.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    });
    if (!trainingDoc) {
      trainingDoc = await ensureTrainingDoc(project);
    }

    // Update execution meta
    trainingDoc.execution = {
      actualStartDate: formData.actualStartDate || trainingDoc.execution?.actualStartDate,
      actualEndDate: formData.actualEndDate || trainingDoc.execution?.actualEndDate,
      conductedBy: formData.conductedBy || trainingDoc.execution?.conductedBy || [],
      totalTeachersTrained: formData.totalTeachersTrained || 0,
      overallRemarks: formData.remarks || trainingDoc.execution?.overallRemarks || '',
      issuesNoted: formData.issuesNoted || trainingDoc.execution?.issuesNoted || '',
      onGroundFeedback: formData.onGroundFeedback || trainingDoc.execution?.onGroundFeedback || '',
      submittedBy: employee?._id || trainingDoc.execution?.submittedBy,
      submittedAt: new Date()
    };

    trainingDoc.issuesNoted = formData.issuesNoted || trainingDoc.issuesNoted || '';
    trainingDoc.onGroundFeedback = formData.onGroundFeedback || trainingDoc.onGroundFeedback || '';
    trainingDoc.remarks = formData.remarks || trainingDoc.remarks || '';

    // Handle school executions
    const execsMap = { ...(trainingDoc.schoolWiseTrainingExecutions || {}) };
    let executionList = [];

    if (formData.schoolWiseTrainingExecutions && typeof formData.schoolWiseTrainingExecutions === 'object') {
      executionList = Object.values(formData.schoolWiseTrainingExecutions);
    } else if (Array.isArray(formData.schools)) {
      executionList = formData.schools;
    }

    for (const item of executionList) {
      const schId = String(item.schoolId || item.id || item._id);
      if (!schId) continue;

      let unit = trainingDoc.schools.find((s) => String(s.school) === schId || String(s.schoolId) === schId);
      if (unit) {
        unit.executionStatus = item.status === 'COMPLETED' || item.executionStatus === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';
        unit.completedDate = item.completedDate || new Date();
        unit.deliveryConfirmationSheetUrl = item.deliveryConfirmationSheetUrl || unit.deliveryConfirmationSheetUrl || '';
        unit.appreciationLetterUrl = item.appreciationLetterUrl || unit.appreciationLetterUrl || '';
        unit.workCompletionLetterUrl = item.workCompletionLetterUrl || unit.workCompletionLetterUrl || '';
        unit.teachersDetailsDocUrl = item.teachersDetailsDocUrl || unit.teachersDetailsDocUrl || '';
        unit.attendanceSheetUrl = item.attendanceSheetUrl || unit.attendanceSheetUrl || '';
        unit.checklist = item.checklist || unit.checklist || {};
        unit.photographyPhotosUrl = item.photographyPhotosUrl || unit.photographyPhotosUrl || '';
        unit.googleReviewsNotes = item.googleReviewsNotes || unit.googleReviewsNotes || '';
        unit.feedbackRating = item.feedbackRating || unit.feedbackRating;
        unit.hardwareSerials = item.hardwareSerials || unit.hardwareSerials || {};
        unit.issuesNoted = item.issuesNoted || unit.issuesNoted || '';
        unit.onGroundFeedback = item.onGroundFeedback || unit.onGroundFeedback || '';
        unit.remarks = item.remarks || unit.remarks || '';
      }

      execsMap[schId] = {
        ...item,
        schoolId: schId
      };
    }

    trainingDoc.schoolWiseTrainingExecutions = execsMap;
    trainingDoc.completedSchools = trainingDoc.schools.filter((s) => s.executionStatus === 'COMPLETED').length;
    if (trainingDoc.completedSchools === trainingDoc.schools.length && trainingDoc.schools.length > 0) {
      trainingDoc.overallStatus = 'COMPLETED';
    } else if (trainingDoc.completedSchools > 0) {
      trainingDoc.overallStatus = 'IN_PROGRESS';
    }

    await trainingDoc.save();

    res.status(200).json({
      success: true,
      message: 'Training execution and completion saved successfully',
      data: trainingDoc
    });
  } catch (error) {
    next(error);
  }
};

// ── 6. PATCH /api/v1/training/project/:projectId/school/:schoolId ──
exports.updateSchoolTraining = async (req, res, next) => {
  try {
    const { projectId, schoolId } = req.params;
    const project = await resolveProject(projectId);
    if (!project) return next(new AppError('Project not found', 404, 'NOT_FOUND'));

    let trainingDoc = await Training.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    });
    if (!trainingDoc) {
      trainingDoc = await ensureTrainingDoc(project);
    }

    let unit = trainingDoc.schools.find((s) => String(s.school) === String(schoolId) || String(s.schoolId) === String(schoolId));
    if (!unit) {
      return next(new AppError('School not found in training rollout', 404, 'NOT_FOUND'));
    }

    Object.assign(unit, req.body);
    await trainingDoc.save();

    res.status(200).json({
      success: true,
      message: 'School training status updated',
      data: unit
    });
  } catch (error) {
    next(error);
  }
};

// ── 7. PUT /api/v1/training/project/:projectId ──
exports.updateOverallTraining = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await resolveProject(projectId);
    if (!project) return next(new AppError('Project not found', 404, 'NOT_FOUND'));

    let trainingDoc = await Training.findOne({
      $or: [{ project: project._id }, { projectId: project.projectId }]
    });
    if (!trainingDoc) {
      trainingDoc = await ensureTrainingDoc(project);
    }

    Object.assign(trainingDoc, req.body);
    await trainingDoc.save();

    res.status(200).json({
      success: true,
      message: 'Training project updated successfully',
      data: trainingDoc
    });
  } catch (error) {
    next(error);
  }
};
