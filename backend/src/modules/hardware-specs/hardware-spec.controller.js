const mongoose = require('mongoose');
const HardwareSpec = require('./hardware-spec.model');
const Hardware = require('../hardware/hardware.model');

/**
 * Get all hardware specs with optional filtering by hardwareId, hardwareKey, or search
 * GET /api/v1/hardware-specs
 */
const getHardwareSpecs = async (req, res) => {
  try {
    const { hardwareId, hardwareKey, search, includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };

    if (hardwareId) {
      if (mongoose.Types.ObjectId.isValid(hardwareId)) {
        filter.hardwareId = hardwareId;
      } else {
        // In case client passed key or name
        const hw = await Hardware.findOne({
          $or: [{ key: hardwareId.toUpperCase() }, { label: hardwareId }]
        });
        if (hw) {
          filter.hardwareId = hw._id;
        } else {
          return res.status(200).json({ success: true, count: 0, data: [] });
        }
      }
    }

    if (hardwareKey) {
      filter.hardwareKey = hardwareKey.toUpperCase();
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const specs = await HardwareSpec.find(filter)
      .populate('hardwareId', 'label name key category unit icon')
      .sort({ index: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: specs.length,
      data: specs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get single hardware spec by ID
 * GET /api/v1/hardware-specs/:id
 */
const getHardwareSpecById = async (req, res) => {
  try {
    const { id } = req.params;
    let spec = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      spec = await HardwareSpec.findById(id).populate(
        'hardwareId',
        'label name key category unit icon'
      );
    }

    if (!spec) {
      spec = await HardwareSpec.findOne({ code: id.toUpperCase() }).populate(
        'hardwareId',
        'label name key category unit icon'
      );
    }

    if (!spec) {
      return res.status(404).json({ success: false, message: 'Hardware spec not found' });
    }

    res.status(200).json({
      success: true,
      data: spec,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new hardware spec
 * POST /api/v1/hardware-specs
 */
const createHardwareSpec = async (req, res) => {
  try {
    const { name, code, hardwareId, hardwareKey, description, attributes, index, isActive } =
      req.body;

    if (!name || !code || !hardwareId) {
      return res.status(400).json({
        success: false,
        message: 'name, code, and hardwareId are required fields',
      });
    }

    // Verify hardware foreign key exists
    let hw = null;
    if (mongoose.Types.ObjectId.isValid(hardwareId)) {
      hw = await Hardware.findById(hardwareId);
    }
    if (!hw) {
      hw = await Hardware.findOne({ key: String(hardwareId).toUpperCase() });
    }

    if (!hw) {
      return res.status(404).json({
        success: false,
        message: `Referenced Hardware not found for id/key: ${hardwareId}`,
      });
    }

    const resolvedHardwareId = hw._id;
    const resolvedHardwareKey = (hardwareKey || hw.key || '').toUpperCase();

    const spec = await HardwareSpec.create({
      name,
      code: code.toUpperCase(),
      hardwareId: resolvedHardwareId,
      hardwareKey: resolvedHardwareKey,
      description: description || '',
      attributes: attributes || {},
      index: index !== undefined ? index : 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    const populated = await HardwareSpec.findById(spec._id).populate(
      'hardwareId',
      'label name key category unit icon'
    );

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Update an existing hardware spec
 * PATCH /api/v1/hardware-specs/:id
 */
const updateHardwareSpec = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    if (updateData.hardwareId) {
      const hw = await Hardware.findById(updateData.hardwareId);
      if (hw) {
        updateData.hardwareKey = hw.key.toUpperCase();
      }
    }

    const updated = await HardwareSpec.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('hardwareId', 'label name key category unit icon');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Hardware spec not found' });
    }

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Delete a hardware spec
 * DELETE /api/v1/hardware-specs/:id
 */
const deleteHardwareSpec = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await HardwareSpec.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Hardware spec not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Hardware spec deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getHardwareSpecs,
  getHardwareSpecById,
  createHardwareSpec,
  updateHardwareSpec,
  deleteHardwareSpec,
};
