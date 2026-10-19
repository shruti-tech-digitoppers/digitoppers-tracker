const L0Category = require('./l0category.model');
const Language = require('../language/language.model');

/**
 * Get all L0 categories (supports optional query filters: section, layout, language, isActive)
 */
exports.getL0Categories = async (req, res) => {
  try {
    const { section, layout, language, isActive } = req.query;
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (section) {
      filter.section = section;
    }
    if (layout) {
      filter.layout = layout;
    }
    if (language) {
      // Allow searching by Language ObjectId or code
      if (language.match(/^[0-9a-fA-F]{24}$/)) {
        filter.language = language;
      } else {
        const langDoc = await Language.findOne({ code: language.toLowerCase() });
        if (langDoc) {
          filter.language = langDoc._id;
        }
      }
    }

    const categories = await L0Category.find(filter)
      .populate('language', 'name code id')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve L0 categories',
      error: error.message,
    });
  }
};

/**
 * Get single L0 category by string ID or Mongo _id
 */
exports.getL0CategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    let category = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      category = await L0Category.findById(id).populate('language', 'name code id');
    }

    if (!category) {
      category = await L0Category.findOne({ id }).populate('language', 'name code id');
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `L0 category '${id}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: category,
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
 * Create a new L0 category
 */
exports.createL0Category = async (req, res) => {
  try {
    const { name, language, icon, section, blg, id, isActive, layout } = req.body;

    let languageId = language;
    if (typeof language === 'string' && !language.match(/^[0-9a-fA-F]{24}$/)) {
      const langDoc = await Language.findOne({ code: language.toLowerCase() });
      if (langDoc) {
        languageId = langDoc._id;
      }
    }

    const category = await L0Category.create({
      name,
      language: languageId,
      icon,
      section,
      blg,
      id,
      isActive,
      layout,
    });

    res.status(201).json({
      success: true,
      message: 'L0 category created successfully',
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create L0 category',
      error: error.message,
    });
  }
};

/**
 * Update an existing L0 category
 */
exports.updateL0Category = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.language && typeof updateData.language === 'string' && !updateData.language.match(/^[0-9a-fA-F]{24}$/)) {
      const langDoc = await Language.findOne({ code: updateData.language.toLowerCase() });
      if (langDoc) {
        updateData.language = langDoc._id;
      }
    }

    const query = id.match(/^[0-9a-fA-F]{24}$/ ? { _id: id } : { id });
    const category = await L0Category.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    }).populate('language', 'name code id');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `L0 category '${id}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'L0 category updated successfully',
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update L0 category',
      error: error.message,
    });
  }
};

/**
 * Delete an L0 category
 */
exports.deleteL0Category = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/ ? { _id: id } : { id });
    const category = await L0Category.findOneAndDelete(query);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `L0 category '${id}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'L0 category deleted successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete L0 category',
      error: error.message,
    });
  }
};

