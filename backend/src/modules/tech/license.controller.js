const mongoose = require('mongoose');
const License = require('./license.model');
const SchoolHardwareLicense = require('./school-hardware-license.model');

/**
 * Get all licenses with optional filtering by project, school, status, isRegistered
 * GET /api/v1/licenses
 */
const getLicenses = async (req, res) => {
  try {
    const { projectId, schoolId, status, isRegistered, search } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (schoolId) filter.schoolId = schoolId;
    if (status) filter.status = status;
    if (isRegistered !== undefined) filter.isRegistered = isRegistered === 'true';

    if (search) {
      filter.$or = [
        { licenseKey: { $regex: search, $options: 'i' } },
        { registeredTo: { $regex: search, $options: 'i' } },
      ];
    }

    const licenses = await License.find(filter)
      .populate('schoolId', 'name district state')
      .populate('projectId', 'projectId projectName title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: licenses.length,
      data: licenses,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get single license by ID or licenseKey
 * GET /api/v1/licenses/:keyOrId
 */
const getLicenseByKeyOrId = async (req, res) => {
  try {
    const { keyOrId } = req.params;
    let license = null;

    if (keyOrId.match(/^[0-9a-fA-F]{24}$/)) {
      license = await License.findById(keyOrId)
        .populate('schoolId', 'name district state')
        .populate('projectId', 'projectId projectName title');
    }

    if (!license) {
      license = await License.findOne({ licenseKey: keyOrId })
        .populate('schoolId', 'name district state')
        .populate('projectId', 'projectId projectName title');
    }

    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    res.status(200).json({
      success: true,
      data: license,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new license
 * POST /api/v1/licenses
 */
const createLicense = async (req, res) => {
  try {
    const { licenseKey, status, isRegistered, registeredAt, registeredTo, schoolId, projectId } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ success: false, message: 'licenseKey is required' });
    }

    const existing = await License.findOne({ licenseKey });
    if (existing) {
      return res.status(409).json({ success: false, message: 'License key already exists' });
    }

    const license = await License.create({
      licenseKey,
      status: status || 'active',
      isRegistered: !!isRegistered,
      registeredAt: registeredAt || (isRegistered ? new Date() : null),
      registeredTo: registeredTo || null,
      schoolId: schoolId || null,
      projectId: projectId || null,
    });

    res.status(201).json({
      success: true,
      data: license,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Bulk create or update licenses
 * POST /api/v1/licenses/bulk
 */
const bulkCreateLicenses = async (req, res) => {
  try {
    const { licenses } = req.body;
    if (!Array.isArray(licenses) || licenses.length === 0) {
      return res.status(400).json({ success: false, message: 'licenses array is required' });
    }

    const operations = licenses.map((item) => ({
      updateOne: {
        filter: { licenseKey: item.licenseKey },
        update: {
          $set: {
            licenseKey: item.licenseKey,
            status: item.status || 'active',
            isRegistered: item.isRegistered !== undefined ? item.isRegistered : false,
            registeredAt: item.registeredAt || (item.isRegistered ? new Date() : null),
            registeredTo: item.registeredTo || null,
            schoolId: item.schoolId || null,
            projectId: item.projectId || null,
          },
        },
        upsert: true,
      },
    }));

    const result = await License.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: 'Bulk licenses saved successfully',
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Register device for license
 * PATCH /api/v1/licenses/:id/register
 */
const registerLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const { registeredTo } = req.body;

    const license = await License.findById(id);
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    license.isRegistered = true;
    license.registeredAt = new Date();
    license.status = 'registered';
    if (registeredTo) license.registeredTo = registeredTo;

    await license.save();

    res.status(200).json({
      success: true,
      data: license,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update license
 * PUT /api/v1/licenses/:id
 */
const updateLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const license = await License.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    res.status(200).json({
      success: true,
      data: license,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Delete license
 * DELETE /api/v1/licenses/:id
 */
const deleteLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const license = await License.findByIdAndDelete(id);

    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    res.status(200).json({
      success: true,
      message: 'License deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
      if (mongoose.Types.ObjectId.isValid(projectId)) {
        filter.projectId = projectId;
      } else {
        const Project = require('../projects/project.model');
        const proj = await Project.findOne({ projectId: projectId });
        if (proj) {
          filter.projectId = proj._id;
        } else {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
      }
    }

    if (schoolId) {
      if (mongoose.Types.ObjectId.isValid(schoolId)) {
        filter.schoolId = schoolId;
      } else {
        const School = require('../schools/school.model');
        const sch = await School.findOne({ name: schoolId });
        if (sch) {
          filter.schoolId = sch._id;
        } else {
          return res.status(200).json({ success: true, count: 0, data: [] });
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
      .populate('licenseId')
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

    let filter = {};
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      filter = { $or: [{ projectId: new mongoose.Types.ObjectId(projectId) }, { projectId }] };
    } else {
      filter = { projectId };
    }

    const School = require('../schools/school.model');
    const schools = await School.find(filter);

    if (!schools || schools.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No schools found for project',
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

          // 1. Ensure external License entry exists in pool (undisturbed!)
          let licenseDoc = await License.findOne({ licenseKey: licenseCode });
          if (!licenseDoc) {
            licenseDoc = await License.create({
              licenseKey: licenseCode,
              status: 'active',
              isRegistered: false,
              registeredAt: null,
              registeredTo: null,
              schoolId: schId,
              projectId: school.projectId,
            });
          }

          // 2. Ensure relation model mapping exists
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
                licenseId: licenseDoc._id,
                licenseKey: licenseCode,
                status: licenseDoc.isRegistered ? 'REGISTERED' : 'ALLOCATED',
                isRegistered: licenseDoc.isRegistered,
                registeredAt: licenseDoc.registeredAt,
                registeredTo: licenseDoc.registeredTo,
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
      .populate('specId', 'name code description')
      .populate('licenseId');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    // Also synchronize status and serial with the root License model if licenseKey exists
    if (updated.licenseKey) {
      await License.findOneAndUpdate(
        { licenseKey: updated.licenseKey },
        {
          $set: {
            isRegistered: updated.isRegistered,
            registeredTo: updated.registeredTo,
            status: updated.isRegistered ? 'registered' : 'active',
            ...(updated.isRegistered ? { registeredAt: new Date() } : {}),
          },
        }
      );
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
