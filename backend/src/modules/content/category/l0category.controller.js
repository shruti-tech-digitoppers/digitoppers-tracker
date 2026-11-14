const coreApi = require('../../../services/core-api.service');

/**
 * Get all L0 categories strictly from Core Backend API
 * (No local collection in Project Tracker)
 * GET /api/v1/l0-categories
 */
exports.getL0Categories = async (req, res) => {
  try {
    const { section, layout, language, isActive } = req.query;

    let coreCategories = [];
    try {
      coreCategories = await coreApi.getL0Categories(req.query);
    } catch (e) {
      console.warn('[L0CategoryController] coreApi.getL0Categories warning:', e.message);
    }

    if (!Array.isArray(coreCategories) || coreCategories.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    let filtered = coreCategories.map((c, idx) => ({
      _id: String(c._id || c.id || `l0_${idx}`),
      id: c.id || String(c._id || `l0_${idx}`),
      name: c.name,
      language: c.language,
      icon: c.icon || '',
      section: c.section || 'academic',
      blg: c.blg || [],
      isActive: c.isActive !== false,
      layout: c.layout || 'subject',
      source: 'CORE_BACKEND'
    }));

    if (isActive !== undefined) {
      const boolVal = isActive === 'true';
      filtered = filtered.filter(c => c.isActive === boolVal);
    }
    if (section) filtered = filtered.filter(c => c.section === section);
    if (layout) filtered = filtered.filter(c => c.layout === layout);

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve L0 categories from Core Backend',
      error: error.message,
    });
  }
};

/**
 * Get single L0 category by string ID or Mongo _id strictly from Core Backend API
 * GET /api/v1/l0-categories/:id
 */
exports.getL0CategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const coreCat = await coreApi.getL0CategoryById(id);
    if (!coreCat) {
      return res.status(404).json({
        success: false,
        message: `L0 category '${id}' not found in Core Backend`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: String(coreCat._id || coreCat.id),
        id: coreCat.id || String(coreCat._id),
        name: coreCat.name,
        language: coreCat.language,
        icon: coreCat.icon || '',
        section: coreCat.section || 'academic',
        blg: coreCat.blg || [],
        isActive: coreCat.isActive !== false,
        layout: coreCat.layout || 'subject',
        source: 'CORE_BACKEND'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve L0 category',
      error: error.message,
    });
  }
};

/**
 * Create a new L0 category - Read-Only in Project Tracker
 */
exports.createL0Category = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Master L0 categories are managed directly by Core Backend. Project Tracker only has read-only access (GET APIs).'
  });
};

/**
 * Update an existing L0 category - Read-Only in Project Tracker
 */
exports.updateL0Category = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Master L0 categories are managed directly by Core Backend. Project Tracker only has read-only access (GET APIs).'
  });
};

/**
 * Delete an L0 category - Read-Only in Project Tracker
 */
exports.deleteL0Category = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Master L0 categories are managed directly by Core Backend. Project Tracker only has read-only access (GET APIs).'
  });
};
