const mongoose = require('mongoose');
const SchoolHardwareLicense = require('./school-hardware-license.model');
const coreApi = require('../../services/core-api.service');

/**
 * Get all licenses with optional filtering by project, school, status, isRegistered
 * Fetches strictly from Core Backend API (Single Source of Truth - NO LOCAL FALLBACK)
 * GET /api/v1/licenses
 */
const getLicenses = async (req, res) => {
  try {
    const { projectId, schoolId, status, isRegistered, search } = req.query;

    // Fetch live licenses strictly from Core Backend API
    const coreQuery = {};
    if (projectId) coreQuery.projectId = projectId;
    if (schoolId) coreQuery.schoolId = schoolId;
    if (status) coreQuery.status = status;
    if (isRegistered !== undefined) coreQuery.isRegistered = isRegistered;

    let coreLicenses = [];
    try {
      coreLicenses = await coreApi.getLicenses(coreQuery);
    } catch (e) {
      console.warn('[LicenseController] coreApi.getLicenses warning:', e.message);
    }

    if (!Array.isArray(coreLicenses) || coreLicenses.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    let mapped = coreLicenses.map(lic => ({
      _id: String(lic._id || lic.licenseKey),
      id: String(lic._id || lic.licenseKey),
      licenseKey: lic.licenseKey,
      status: lic.status || 'active',
      isRegistered: !!lic.isRegistered,
      registeredAt: lic.registeredAt || null,
      registeredTo: lic.registeredTo || null,
      licenseDays: lic.licenseDays || 365,
      platform: lic.platform || null,
      solution: lic.solution || null,
      schoolId: lic.schoolId,
      schoolName: lic.schoolName || null,
      projectId: lic.projectId,
      createdAt: lic.createdAt || new Date(),
      updatedAt: lic.updatedAt || new Date(),
      source: 'CORE_BACKEND'
    }));

    if (search) {
      const s = String(search).trim().toLowerCase();
      mapped = mapped.filter(l =>
        (l.licenseKey && l.licenseKey.toLowerCase().includes(s)) ||
        (l.registeredTo && l.registeredTo.toLowerCase().includes(s))
      );
    }

    return res.status(200).json({
      success: true,
      count: mapped.length,
      data: mapped,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get single license by ID or licenseKey strictly from Core Backend API
 * (No local MongoDB fallback)
 * GET /api/v1/licenses/:keyOrId
 */
const getLicenseByKeyOrId = async (req, res) => {
  try {
    const { keyOrId } = req.params;

    const coreLic = await coreApi.getLicenseById(keyOrId);
    if (!coreLic) {
      return res.status(404).json({ success: false, message: 'License not found in Core Backend' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: String(coreLic._id || coreLic.licenseKey),
        id: String(coreLic._id || coreLic.licenseKey),
        licenseKey: coreLic.licenseKey,
        status: coreLic.status || 'active',
        isRegistered: !!coreLic.isRegistered,
        registeredAt: coreLic.registeredAt || null,
        registeredTo: coreLic.registeredTo || null,
        licenseDays: coreLic.licenseDays || 365,
        platform: coreLic.platform || null,
        solution: coreLic.solution || null,
        schoolId: coreLic.schoolId,
        projectId: coreLic.projectId,
        createdAt: coreLic.createdAt || new Date(),
        updatedAt: coreLic.updatedAt || new Date(),
        source: 'CORE_BACKEND'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new license - Read-Only in Project Tracker
 * POST /api/v1/licenses
 */
const createLicense = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Master licenses are managed directly by Core Backend. Project Tracker only has read-only access (GET APIs).'
  });
};

/**
 * Bulk create licenses - Read-Only in Project Tracker
 * POST /api/v1/licenses/bulk
 */
const bulkCreateLicenses = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Master licenses are managed directly by Core Backend. Project Tracker only has read-only access (GET APIs).'
  });
};

/**
 * Register device for license - Read-Only in Project Tracker
 * PATCH /api/v1/licenses/:id/register
 */
const registerLicense = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Master licenses are managed directly by Core Backend. Project Tracker only has read-only access (GET APIs).'
  });
};

/**
 * Update license - Read-Only in Project Tracker
 * PUT /api/v1/licenses/:id
 */
const updateLicense = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Master licenses are managed directly by Core Backend. Project Tracker only has read-only access (GET APIs).'
  });
};

/**
 * Delete license - Read-Only in Project Tracker
 * DELETE /api/v1/licenses/:id
 */
const deleteLicense = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Master licenses are managed directly by Core Backend. Project Tracker only has read-only access (GET APIs).'
  });
};

/**
 * Get all school hardware license allocations
 * GET /api/v1/licenses/allocations
 */
const getHardwareAllocations = async (req, res) => {
  try {
    const { projectId, schoolId, hardwareKey, status } = req.query;
    const filter = {};

    if (projectId) {
      const orConditions = [{ projectId }];
      if (mongoose.Types.ObjectId.isValid(projectId)) {
        orConditions.push({ projectId: new mongoose.Types.ObjectId(projectId) });
      }
      try {
        const coreApi = require('../../services/core-api.service');
        const proj = await coreApi.getProjectById(projectId);
        if (proj && proj._id) {
          orConditions.push({ projectId: proj._id });
          if (proj.projectId) {
            orConditions.push({ projectId: proj.projectId });
            orConditions.push({ projectId: proj.projectId.toLowerCase() });
            orConditions.push({ projectId: proj.projectId.toUpperCase() });
          }
        }
      } catch (_) {
        // Non-blocking fallback
      }
      filter.$or = orConditions;
    }

    if (schoolId) {
      if (mongoose.Types.ObjectId.isValid(schoolId)) {
        filter.schoolId = schoolId;
      } else {
        const sch = await coreApi.getSchoolById(schoolId);
        if (sch && sch._id) {
          filter.schoolId = sch._id;
        } else {
          filter.schoolId = schoolId;
        }
      }
    }

    if (hardwareKey) filter.hardwareKey = hardwareKey;
    if (status) filter.status = status;

    const allocations = await SchoolHardwareLicense.find(filter)
      .populate('schoolId', 'name district state')
      .populate('projectId', 'projectId projectName title')
      .populate('hardwareId', 'label name key icon unit')
      .populate('specId', 'name code description')
      .sort({ schoolId: 1, hardwareKey: 1, unitIndex: 1 });

    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create or update school hardware license allocation
 * POST /api/v1/licenses/allocations
 */
const upsertHardwareAllocation = async (req, res) => {
  try {
    const {
      projectId,
      schoolId,
      schoolName,
      hardwareKey,
      hardwareName,
      unitIndex,
      licenseKey,
      licenseId,
      remarks,
    } = req.body;

    if (!projectId || !schoolId || !hardwareKey || !licenseKey) {
      return res.status(400).json({
        success: false,
        message: 'projectId, schoolId, hardwareKey, and licenseKey are required',
      });
    }

    const allocation = await SchoolHardwareLicense.findOneAndUpdate(
      { schoolId, hardwareKey, unitIndex: unitIndex || 1 },
      {
        $set: {
          projectId,
          schoolId,
          schoolName: schoolName || '',
          hardwareKey,
          hardwareName: hardwareName || hardwareKey,
          unitIndex: unitIndex || 1,
          licenseKey,
          licenseId: licenseId || null,
          status: 'ALLOCATED',
          remarks: remarks || '',
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: allocation,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Bulk create / sync allocations
 * POST /api/v1/licenses/allocations/bulk
 */
const bulkUpsertAllocations = async (req, res) => {
  try {
    const { allocations } = req.body;
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ success: false, message: 'allocations array is required' });
    }

    const operations = allocations.map((item) => ({
      updateOne: {
        filter: {
          schoolId: item.schoolId,
          hardwareKey: item.hardwareKey,
          unitIndex: item.unitIndex || 1,
        },
        update: {
          $set: {
            projectId: item.projectId,
            schoolId: item.schoolId,
            schoolName: item.schoolName || '',
            hardwareKey: item.hardwareKey,
            hardwareName: item.hardwareName || item.hardwareKey,
            unitIndex: item.unitIndex || 1,
            licenseKey: item.licenseKey,
            licenseId: item.licenseId || null,
            status: item.status || 'ALLOCATED',
            remarks: item.remarks || '',
          },
        },
        upsert: true,
      },
    }));

    const result = await SchoolHardwareLicense.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: 'Bulk allocations synced successfully',
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Automatically sync / auto-generate school hardware license mappings for a project
 * POST /api/v1/licenses/allocations/sync-project/:projectId
 */
const syncProjectHardwareAllocations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const mongoose = require('mongoose');

    const schools = await coreApi.getProjectSchools(projectId);

    if (!Array.isArray(schools) || schools.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No schools found for project in Core Backend',
        count: 0,
        data: [],
      });
    }

    const createdOrUpdatedAllocations = [];

    for (const school of schools) {
      const schId = school._id;
      const schName = school.name;
      const schCode = school.schoolId || String(schId).slice(-6).toUpperCase();
      const cleanCode = schCode.replace(/[^0-9A-Za-z]/g, '').slice(-6) || 'SCH';

      const hardwareItems = Array.isArray(school.hardware) && school.hardware.length > 0
        ? school.hardware
        : [
            {
              hardwareKey: 'SMART_CLASS',
              itemName: 'Smart Classroom Software Bundle',
              allocatedQuantity: 1,
            },
          ];

      for (const hw of hardwareItems) {
        const hwKey = (hw.hardwareKey || 'DEVICE').toUpperCase();
        // Skip purely mechanical items
        if (hwKey === 'WALL_MOUNT' || hwKey === 'MOUNT' || hwKey === 'CABLE') {
          continue;
        }

        const qty = Math.max(1, hw.allocatedQuantity || 1);
        const hwName = hw.itemName || hw.name || hwKey;

        for (let unit = 1; unit <= qty; unit++) {
          const unitStr = String(unit).padStart(2, '0');
          const cleanKey = hwKey.slice(0, 8);
          const licenseCode = `LIC-${cleanCode}-${cleanKey}-${unitStr}`;

          // Ensure relation model mapping exists (External license keys referenced without local Mongo License collection)
          const allocation = await SchoolHardwareLicense.findOneAndUpdate(
            { schoolId: schId, hardwareKey: hwKey, unitIndex: unit },
            {
              $set: {
                projectId: school.projectId,
                schoolId: schId,
                schoolName: schName,
                hardwareId: hw.hardwareId?._id || hw.hardwareId || null,
                hardwareKey: hwKey,
                hardwareName: hwName,
                unitIndex: unit,
                licenseKey: licenseCode,
                status: 'ALLOCATED',
                isRegistered: false,
                registeredAt: null,
                registeredTo: null,
              },
              $setOnInsert: {
                allocatedAt: new Date(),
              },
            },
            { upsert: true, new: true }
          );

          createdOrUpdatedAllocations.push(allocation);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Hardware license allocations synced successfully',
      count: createdOrUpdatedAllocations.length,
      data: createdOrUpdatedAllocations,
    });
  } catch (err) {
    console.error('Error in syncProjectHardwareAllocations:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update an allocation by its _id
 * PATCH /api/v1/licenses/allocations/:id
 */
const updateAllocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hardwareId,
      hardwareKey,
      hardwareName,
      specId,
      specName,
      specKey,
      licenseKey,
      isRegistered,
      registeredTo,
      status,
      remarks,
    } = req.body;

    const update = {};
    if (hardwareId !== undefined) update.hardwareId = hardwareId;
    if (hardwareKey !== undefined) update.hardwareKey = hardwareKey;
    if (hardwareName !== undefined) update.hardwareName = hardwareName;
    if (specId !== undefined) update.specId = specId;
    if (specName !== undefined) update.specName = specName;
    if (specKey !== undefined) update.specKey = specKey;
    if (licenseKey !== undefined) update.licenseKey = licenseKey;
    if (isRegistered !== undefined) {
      update.isRegistered = !!isRegistered;
      if (update.isRegistered && (!status || status === 'ALLOCATED')) {
        update.status = 'REGISTERED';
      } else if (!update.isRegistered && status === 'REGISTERED') {
        update.status = 'ALLOCATED';
      }
    }
    if (registeredTo !== undefined) update.registeredTo = registeredTo;
    if (status !== undefined) update.status = status;
    if (remarks !== undefined) update.remarks = remarks;

    const updated = await SchoolHardwareLicense.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    )
      .populate('schoolId', 'name district state')
      .populate('projectId', 'projectId projectName title')
      .populate('hardwareId', 'label name key icon unit')
      .populate('specId', 'name code description');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Delete an allocation by its _id
 * DELETE /api/v1/licenses/allocations/:id
 */
const deleteAllocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SchoolHardwareLicense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }
    res.status(200).json({ success: true, message: 'Allocation deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getLicenses,
  getLicenseByKeyOrId,
  createLicense,
  bulkCreateLicenses,
  registerLicense,
  updateLicense,
  deleteLicense,
  getHardwareAllocations,
  upsertHardwareAllocation,
  bulkUpsertAllocations,
  syncProjectHardwareAllocations,
  updateAllocationById,
  deleteAllocationById,
};