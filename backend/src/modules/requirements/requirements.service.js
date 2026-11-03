const mongoose = require('mongoose');
const Requirement = require('./requirements.model');
const notificationService = require('../notifications/notifications.service');
const activityService = require('../activity/activity.service');
const coreApi = require('../../services/core-api.service');

// Ensure referenced models are registered
require('../schools/school.model');
require('../solutions/solution.model');
require('../hardware/hardware.model');
require('../content/content-section/content-section.model');
require('../content/language/language.model');
require('../content/grade/grade.model');
require('../content/category/l0category.model');
require('../employees/employee.model');

/**
 * Deep merge two plain objects. Arrays are replaced (not concatenated) to
 * keep the saved array authoritative.
 */
function deepMerge(target = {}, source = {}) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (
      srcVal !== null &&
      typeof srcVal === 'object' &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === 'object' &&
      !Array.isArray(tgtVal)
    ) {
      output[key] = deepMerge(tgtVal, srcVal);
    } else {
      output[key] = srcVal;
    }
  }
  return output;
}

/**
 * Resolve project directly from MongoDB first (instantaneous & offline safe),
 * falling back to coreApi only if not found.
 */
async function resolveProject(projectId) {
  if (!projectId) return null;
  try {
    const Project = mongoose.model('Project');
    const code = projectId.toString().trim().toLowerCase();
    const isObjectId = mongoose.Types.ObjectId.isValid(projectId);

    const conditions = [{ projectId: code }, { projectId: code.toUpperCase() }];
    if (isObjectId) {
      conditions.push({ _id: projectId });
    }

    const proj = await Project.findOne({ $or: conditions }).lean();
    if (proj) return proj;
  } catch (e) {
    // Continue to coreApi
  }

  try {
    return await coreApi.getProjectById(projectId);
  } catch (err) {
    return null;
  }
}

/**
 * Build a robust MongoDB query filter matching project code or project ObjectId,
 * without casting invalid strings to ObjectId.
 */
function buildProjectFilter(project, projectId) {
  const code = (project?.projectId || projectId || '').toString().trim().toLowerCase();
  const rawId = project?._id || (mongoose.Types.ObjectId.isValid(projectId) ? projectId : null);

  const orList = [];
  if (code) {
    orList.push({ projectId: code });
    orList.push({ projectId: code.toUpperCase() });
  }
  if (rawId) {
    orList.push({ project: rawId });
    orList.push({ projectId: String(rawId) });
  }

  return orList.length > 0 ? { $or: orList } : { projectId: String(projectId) };
}

/**
 * Populate helper for complete school -> solution -> hardware & content references
 */
function applyRequirementPopulate(query) {
  return query
    .populate('updatedBy', 'name email')

    .populate('schools.school')
    .populate('schools.solutions.solution')
    .populate('schools.solutions.hardware.hardware')
    .populate('schools.solutions.content.content')
    .populate('schools.solutions.content.language', 'name code')
    .populate('schools.solutions.content.grade', 'name grade stream')
    .populate('schools.solutions.content.category', 'name key label')
    .populate('schools.hardware.hardware')
    .populate('schools.content.content')
    .populate('orderRequirement.schools.school')
    .populate('orderRequirement.schools.solutions.solution')
    .populate('orderRequirement.schools.solutions.hardware.hardware')
    .populate('orderRequirement.schools.solutions.content.content');
}

/**
 * Fetch project requirements with all populated school, solution, hardware & content references
 */
async function getProjectRequirements(projectId) {
  const project = await resolveProject(projectId);
  const filter = buildProjectFilter(project, projectId);

  let query = Requirement.findOne(filter);
  query = applyRequirementPopulate(query);
  const requirement = await query.exec();
  return requirement;
}

/**
 * Upsert general requirement document
 */
async function upsertRequirements(projectId, updateData, employeeId) {
  const project = await resolveProject(projectId);
  const filter = buildProjectFilter(project, projectId);
  const code = (project?.projectId || projectId || '').toString().trim().toLowerCase();
  const rawId = project?._id || (mongoose.Types.ObjectId.isValid(projectId) ? projectId : null);

  let requirement = await Requirement.findOne(filter);

  if (!requirement) {
    requirement = await Requirement.create({
      projectId: code || String(rawId),
      ...(rawId ? { project: rawId } : {}),
      ...updateData,
      updatedBy: employeeId
    });
  } else {
    for (const key of Object.keys(updateData || {})) {
      const incoming = updateData[key];
      const existing = requirement[key]
        ? (requirement[key].toObject ? requirement[key].toObject() : requirement[key])
        : {};

      if (
        typeof incoming === 'object' &&
        incoming !== null &&
        !Array.isArray(incoming)
      ) {
        requirement[key] = deepMerge(existing, incoming);
      } else {
        requirement[key] = incoming;
      }
      requirement.markModified(key);
    }
    requirement.updatedBy = employeeId;
    await requirement.save();
  }

  try {
    const changedSections = Object.keys(updateData || {}).join(', ');

    await activityService.log({
      project: projectId,
      actor: employeeId,
      action: 'REQUIREMENTS_UPDATED',
      description: `Project configuration and requirements updated (${changedSections || 'Master Form'})`,
      resourceType: 'Requirement',
      resourceId: requirement._id,
      metadata: {
        projectName: project ? (project.projectName || project.projectId) : undefined,
        sections: Object.keys(updateData || {})
      }
    });

    await notificationService.notifyWithAdminsAndPMs({
      assignedTo: null,
      projectId: projectId,
      title: 'Project Requirements Updated',
      message: `Master project requirements and configurations have been updated.`,
      type: 'STATUS_UPDATE'
    });
  } catch (err) {
    console.log('Activity/Notification error:', err.message);
  }

  return await getProjectRequirements(projectId);
}

/**
 * Check required solutions, hardware according to solutions, and content
 * for any project's schools / school branches.
 */
async function checkProjectSchoolsRequirements(projectId) {
  const project = await resolveProject(projectId);
  const filter = buildProjectFilter(project, projectId);
  const code = (project?.projectId || projectId || '').toString().trim().toLowerCase();

  const School = mongoose.model('School');

  // 1. Fetch all registered schools for this project
  const projectSchools = await School.find({
    ...filter,
    isActive: true
  })

    .sort({ order: 1, name: 1 })
    .lean();

  // 2. Fetch existing requirement document with populated references
  const requirement = await getProjectRequirements(projectId);
  const configuredSchools = (requirement?.schools || requirement?.orderRequirement?.schools || []);

  // Map configured schools by school._id or schoolId or schoolBranch
  const configuredMap = new Map();
  for (const item of configuredSchools) {
    const sId = (item.school?._id || item.school || item.schoolId || '').toString();
    const branchKey = `${item.schoolName || ''}_${item.schoolBranch || ''}`.trim().toLowerCase();
    if (sId) configuredMap.set(sId, item);
    if (branchKey) configuredMap.set(branchKey, item);
  }

  // 3. Compile school-by-school requirement breakdown
  let totalHardwareCount = 0;
  let totalContentCount = 0;
  let totalSolutionsCount = 0;

  const schoolBreakdowns = [];

  for (const sch of projectSchools) {
    const sId = sch._id.toString();
    const branchKey = `${sch.name || ''}_${sch.schoolBranch || ''}`.trim().toLowerCase();
    const existingConfig = configuredMap.get(sId) || configuredMap.get(branchKey);

    const solutionsList = [];

    if (existingConfig && existingConfig.solutions && existingConfig.solutions.length > 0) {
      for (const sol of existingConfig.solutions) {
        totalSolutionsCount += (sol.quantity || 1);

        // Hardware items according to this solution
        const hwList = (sol.hardware || []).map((hw) => {
          totalHardwareCount += (hw.quantity || hw.qty || 1);
          return {
            _id: hw._id,
            hardware: hw.hardware,
            hardwareKey: hw.hardwareKey,
            itemName: hw.itemName || hw.hardwareName || hw.hardware?.name || hw.hardware?.label,
            hardwareName: hw.hardwareName || hw.itemName,
            quantity: hw.quantity || hw.qty || 1,
            unit: hw.unit || 'Units',
            specNotes: hw.specNotes || '',
            specs: hw.specs || hw.spec || '',
            serialNotes: hw.serialNotes || '',
            solution: sol.solution?._id || sol.solution,
            solutionKey: sol.solutionKey,
            solutionName: sol.solutionName || sol.label,
            stockCheck: hw.stockCheck || {},
            stockStatus: hw.stockCheck?.stockStatus || 'IN_STOCK',
            readyForInstallation: hw.hardwareReady?.readyForInstallation || 'PENDING'
          };
        });

        // Content items according to this solution
        const contentList = (sol.content || []).map((cnt) => {
          totalContentCount += 1;
          return {
            _id: cnt._id,
            content: cnt.content,
            contentKey: cnt.contentKey || cnt.reqKey,
            title: cnt.title || cnt.name || cnt.content?.name || cnt.categoryName,
            category: cnt.category,
            categoryName: cnt.categoryName || cnt.category?.name,
            language: cnt.language,
            languageName: cnt.languageName || cnt.language?.name,
            grade: typeof cnt.grade === 'object' ? (cnt.grade?.name || cnt.grade?.grade || '') : (cnt.grade || ''),
            gradeName: cnt.gradeName || (typeof cnt.grade === 'object' ? cnt.grade?.name : '') || (cnt.grade || ''),
            board: cnt.board || cnt.content?.board,
            stream: cnt.stream || cnt.content?.stream,
            driveLink: cnt.driveLink || cnt.content?.driveLink,
            sheetUrl: cnt.sheetUrl || cnt.content?.sheetUrl,
            status: cnt.status || 'PENDING',
            remarks: cnt.remarks || ''
          };
        });

        solutionsList.push({
          _id: sol._id,
          solution: sol.solution,
          solutionKey: sol.solutionKey,
          solutionName: sol.solutionName || sol.label || sol.solution?.name || sol.solution?.label,
          label: sol.label || sol.solutionName || sol.solution?.label,
          quantity: sol.quantity || 1,
          description: sol.description || sol.solution?.description || '',
          remarks: sol.remarks || '',
          hardware: hwList,
          content: contentList
        });
      }
    }

    schoolBreakdowns.push({
      school: sch._id,
      schoolDoc: sch,
      schoolId: sch.schoolId || sch._id.toString(),
      schoolName: sch.name,
      schoolBranch: sch.schoolBranch || '',
      schoolBranchId: sch.schoolBranch || sch.schoolId || sch._id.toString(),
      order: sch.order || 1,
      address: sch.address || '',
      contactPerson: sch.contactPerson?.name || sch.principalName || sch.pocName || '',
      phone: sch.contactPerson?.phone || sch.pocContact || '',
      board: sch.board || 'CBSE',
      isConfigured: !!(existingConfig && existingConfig.solutions?.length),
      solutions: solutionsList,
      hardware: existingConfig?.hardware || [],
      content: existingConfig?.content || [],
      readyForInstallation: existingConfig?.readyForInstallation || 'NO',
      allHardwareReceived: existingConfig?.allHardwareReceived || 'NO',
      deliveryDate: existingConfig?.deliveryDate || null,
      remarks: existingConfig?.remarks || ''
    });
  }

  return {
    projectId: code || projectId,
    requirementId: requirement?._id || null,
    project: project ? {
      _id: project._id,
      projectName: project.projectName || project.name,
      projectId: project.projectId,
      title: project.title
    } : null,
    totalSchools: projectSchools.length,
    summary: {
      totalSchools: projectSchools.length,
      configuredSchoolsCount: schoolBreakdowns.filter((s) => s.isConfigured).length,
      totalSolutionsAllocated: totalSolutionsCount,
      totalHardwareUnitsRequired: totalHardwareCount,
      totalContentPackagesRequired: totalContentCount
    },
    schools: schoolBreakdowns
  };
}

/**
 * Update project school requirements (schools -> solutions -> hardware & content)
 */
async function updateProjectSchoolRequirements(projectId, schoolsData, employeeId) {
  const project = await resolveProject(projectId);
  const filter = buildProjectFilter(project, projectId);
  const code = (project?.projectId || projectId || '').toString().trim().toLowerCase();
  const rawId = project?._id || (mongoose.Types.ObjectId.isValid(projectId) ? projectId : null);

  let requirement = await Requirement.findOne(filter);

  if (!requirement) {
    requirement = await Requirement.create({
      projectId: code || String(rawId),
      ...(rawId ? { project: rawId } : {}),
      schools: schoolsData,
      updatedBy: employeeId
    });
  } else {
    requirement.schools = schoolsData;
    if (!requirement.orderRequirement) requirement.orderRequirement = {};
    requirement.orderRequirement.schools = schoolsData;
    requirement.updatedBy = employeeId;
    requirement.markModified('schools');
    requirement.markModified('orderRequirement');
    await requirement.save();
  }

  try {
    await activityService.log({
      project: projectId,
      actor: employeeId,
      action: 'SCHOOL_REQUIREMENTS_UPDATED',
      description: `Project school-wise requirements updated (${Array.isArray(schoolsData) ? schoolsData.length : 0} schools)`,
      resourceType: 'Requirement',
      resourceId: requirement._id,
      metadata: {
        totalSchools: Array.isArray(schoolsData) ? schoolsData.length : 0
      }
    });

    await notificationService.notifyWithAdminsAndPMs({
      assignedTo: null,
      projectId: projectId,
      title: 'School Requirements Updated',
      message: `School-wise solutions, hardware, and content requirements have been updated.`,
      type: 'STATUS_UPDATE'
    });
  } catch (err) {
    console.log('Activity/Notification error:', err.message);
  }

  return await checkProjectSchoolsRequirements(projectId);
}

/**
 * Check requirements for a specific school or branch
 */
async function checkSchoolRequiredItems(projectId, schoolIdentifier) {
  const projectData = await checkProjectSchoolsRequirements(projectId);
  const targetId = (schoolIdentifier || '').toString().trim().toLowerCase();

  const found = projectData.schools.find((s) => {
    return (
      (s.school && s.school.toString().toLowerCase() === targetId) ||
      (s.schoolId && s.schoolId.toString().toLowerCase() === targetId) ||
      (s.schoolBranch && s.schoolBranch.toString().toLowerCase() === targetId) ||
      (s.schoolBranchId && s.schoolBranchId.toString().toLowerCase() === targetId)
    );
  });

  return {
    projectId: projectData.projectId,
    project: projectData.project,
    found: !!found,
    school: found || null
  };
}

module.exports = {
  getProjectRequirements,
  upsertRequirements,
  checkProjectSchoolsRequirements,
  updateProjectSchoolRequirements,
  checkSchoolRequiredItems
};
