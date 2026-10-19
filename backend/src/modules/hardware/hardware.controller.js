const Hardware = require('./hardware.model');
const Solution = require('../solutions/solution.model');

/**
 * Get all hardware items from Database with dynamic filtering & populated solutions
 */
const getHardware = async (req, res) => {
  try {
    const { solutionId, solutionIds, solutionKey, solutionKeys, includeInactive } = req.query;
    
    const filter = includeInactive === 'true' ? {} : { isActive: true };

    // Support single or multiple solution IDs
    if (solutionIds || solutionId) {
      const rawIds = (solutionIds || solutionId).split(',').map((s) => s.trim()).filter(Boolean);
      if (rawIds.length === 1) {
        filter.solutions = rawIds[0];
      } else if (rawIds.length > 1) {
        filter.solutions = { $in: rawIds };
      }
    } 
    // Support single or multiple solution Keys (e.g. STEM_LAB,ASTRONOMY)
    else if (solutionKeys || solutionKey) {
      const rawKeys = (solutionKeys || solutionKey)
        .split(',')
        .map((k) => k.trim().toUpperCase())
        .filter(Boolean);

      const matchedSolutions = await Solution.find({ key: { $in: rawKeys } }).select('_id');
      const matchedIds = matchedSolutions.map((s) => s._id);

      if (matchedIds.length > 0) {
        filter.solutions = { $in: matchedIds };
      } else {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    const hardwareList = await Hardware.find(filter)
      .populate('solutions', 'key label name icon')
      .populate('department', 'name code description')
      .sort({ index: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: hardwareList,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get hardware item by ID
 */
const getHardwareById = async (req, res) => {
  try {
    const item = await Hardware.findById(req.params.id)
      .populate('solutions', 'key label name icon')
      .populate('department', 'name code description');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Hardware item not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create dynamic hardware item
 */
const createHardware = async (req, res) => {
  try {
    const { key, label, name, icon, desc, description, unit, solutions, index, isActive } = req.body;

    if (!key || (!label && !name)) {
      return res.status(400).json({ success: false, message: 'Key and label/name are required' });
    }

    const existing = await Hardware.findOne({ key: key.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Hardware with key '${key}' already exists` });
    }

    const item = await Hardware.create({
      key: key.trim().toUpperCase(),
      label: label || name,
      name: name || label,
      icon: icon || '🖥️',
      description: description || desc || '',
      unit: unit || 'Units',
      solutions: Array.isArray(solutions) ? solutions : [],
      index: index !== undefined ? Number(index) : 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    const populated = await Hardware.findById(item._id).populate('solutions', 'key label name icon');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update hardware item
 */
const updateHardware = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.key) {
      updateData.key = updateData.key.trim().toUpperCase();
    }
    if (updateData.label && !updateData.name) {
      updateData.name = updateData.label;
    }
    if (updateData.name && !updateData.label) {
      updateData.label = updateData.name;
    }

    const item = await Hardware.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('solutions', 'key label name icon');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Hardware item not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete hardware item
 */
const deleteHardware = async (req, res) => {
  try {
    const item = await Hardware.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Hardware item not found' });
    }
    res.status(200).json({ success: true, message: 'Hardware item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getHardware,
  getHardwareById,
  createHardware,
  updateHardware,
  deleteHardware,
};
