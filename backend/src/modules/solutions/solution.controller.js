const Solution = require('./solution.model');

/**
 * Get all solutions from Database
 */
const getSolutions = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const filter = includeInactive ? {} : { isActive: true };
    const solutions = await Solution.find(filter).sort({ index: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: solutions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get solution by ID
 */
const getSolutionById = async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    if (!solution) {
      return res.status(404).json({ success: false, message: 'Solution not found' });
    }
    res.status(200).json({ success: true, data: solution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Create a new dynamic solution
 */
const createSolution = async (req, res) => {
  try {
    const { key, label, name, icon, desc, description, index, isActive } = req.body;
    
    if (!key || (!label && !name)) {
      return res.status(400).json({ success: false, message: 'Key and label/name are required' });
    }

    const existing = await Solution.findOne({ key: key.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: `Solution with key '${key}' already exists` });
    }

    const solution = await Solution.create({
      key: key.trim().toUpperCase(),
      label: label || name,
      name: name || label,
      icon: icon || '🔬',
      desc: desc || description || '',
      description: description || desc || '',
      index: index !== undefined ? Number(index) : 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, data: solution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update solution
 */
const updateSolution = async (req, res) => {
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

    const solution = await Solution.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!solution) {
      return res.status(404).json({ success: false, message: 'Solution not found' });
    }

    res.status(200).json({ success: true, data: solution });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete solution
 */
const deleteSolution = async (req, res) => {
  try {
    const solution = await Solution.findByIdAndDelete(req.params.id);
    if (!solution) {
      return res.status(404).json({ success: false, message: 'Solution not found' });
    }
    res.status(200).json({ success: true, message: 'Solution deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSolutions,
  getSolutionById,
  createSolution,
  updateSolution,
  deleteSolution,
};
