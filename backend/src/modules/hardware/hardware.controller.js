const coreApi = require('../../services/core-api.service');

/**
 * Get all hardware items exclusively from Core Backend API (Single Source of Truth)
 */
const getHardware = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const coreHardware = await coreApi.getHardware(req.query);
    return res.status(200).json({
      success: true,
      source: 'CORE_BACKEND',
      count: Array.isArray(coreHardware) ? coreHardware.length : 0,
      data: coreHardware || [],
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/**
 * Get hardware item by ID or Key exclusively from Core Backend API
 */
const getHardwareById = async (req, res) => {
  try {
    const coreHw = await coreApi.getHardwareById(req.params.id);
    if (!coreHw) {
      return res.status(404).json({ success: false, message: 'Hardware item not found in Core Backend' });
    }
    return res.status(200).json({
      success: true,
      source: 'CORE_BACKEND',
      data: coreHw,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/**
 * Create dynamic hardware item on Core Backend API
 */
const createHardware = async (req, res) => {
  try {
    const created = await coreApi.createHardware(req.body);
    const data = created.data || created.hardware || created;
    return res.status(201).json({
      success: true,
      message: 'Hardware item created successfully in Core Backend',
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/**
 * Update hardware item on Core Backend API
 */
const updateHardware = async (req, res) => {
  try {
    const updated = await coreApi.updateHardware(req.params.id, req.body);
    const data = updated.data || updated.hardware || updated;
    return res.status(200).json({
      success: true,
      message: 'Hardware item updated successfully in Core Backend',
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/**
 * Delete hardware item on Core Backend API
 */
const deleteHardware = async (req, res) => {
  try {
    await coreApi.deleteHardware(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Hardware item deleted successfully in Core Backend',
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getHardware,
  getHardwareById,
  createHardware,
  updateHardware,
  deleteHardware,
};
