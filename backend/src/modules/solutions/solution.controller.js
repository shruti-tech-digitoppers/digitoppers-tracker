const coreApi = require('../../services/core-api.service');

/**
 * Get all solutions exclusively from Core Backend API (Single Source of Truth)
 */
const getSolutions = async (req, res) => {
  try {
    const coreSolutions = await coreApi.getSolutions(req.query);
    return res.status(200).json({
      success: true,
      source: 'CORE_BACKEND',
      count: Array.isArray(coreSolutions) ? coreSolutions.length : 0,
      data: coreSolutions || [],
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/**
 * Get solution by ID or Key exclusively from Core Backend API
 */
const getSolutionById = async (req, res) => {
  try {
    const coreSol = await coreApi.getSolutionById(req.params.id);
    if (!coreSol) {
      return res.status(404).json({ success: false, message: 'Solution not found in Core Backend' });
    }
    return res.status(200).json({
      success: true,
      source: 'CORE_BACKEND',
      data: coreSol,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/**
 * Create solution on Core Backend API
 */
const createSolution = async (req, res) => {
  try {
    const created = await coreApi.createSolution(req.body);
    const data = created.data || created.solution || created;
    return res.status(201).json({
      success: true,
      message: 'Solution created successfully in Core Backend',
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/**
 * Update solution on Core Backend API
 */
const updateSolution = async (req, res) => {
  try {
    const updated = await coreApi.updateSolution(req.params.id, req.body);
    const data = updated.data || updated.solution || updated;
    return res.status(200).json({
      success: true,
      message: 'Solution updated successfully in Core Backend',
      data,
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/**
 * Delete solution on Core Backend API
 */
const deleteSolution = async (req, res) => {
  try {
    await coreApi.deleteSolution(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Solution deleted successfully in Core Backend',
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSolutions,
  getSolutionById,
  createSolution,
  updateSolution,
  deleteSolution,
};
