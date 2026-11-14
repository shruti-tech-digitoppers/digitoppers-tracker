const coreApi = require('../../../services/core-api.service');

/**
 * Get all active curriculum grades strictly from Core Backend API
 * (No local Grade collection in Project Tracker)
 * GET /api/v1/grades
 */
const getGrades = async (req, res) => {
  try {
    const { stream, category, grade } = req.query;

    let coreGrades = [];
    try {
      coreGrades = await coreApi.getGrades(req.query);
    } catch (e) {
      console.warn('[GradeController] coreApi.getGrades warning:', e.message);
    }

    if (!Array.isArray(coreGrades) || coreGrades.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    let filtered = coreGrades.map((g, idx) => ({
      _id: String(g._id || g.id || `grade_${idx}`),
      id: g.id || String(g._id || `grade_${idx}`),
      name: g.name,
      grade: g.grade || g.name,
      stream: g.stream || null,
      category: g.category || 'Primary',
      index: g.index !== undefined ? g.index : idx + 1,
      color: g.color || '',
      icon: g.icon || '🎓',
      isActive: g.isActive !== false,
      source: 'CORE_BACKEND'
    }));

    if (stream) filtered = filtered.filter(g => g.stream === stream);
    if (category) filtered = filtered.filter(g => g.category === category);
    if (grade) filtered = filtered.filter(g => g.grade === grade);

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get single grade by ID strictly from Core Backend API
 * GET /api/v1/grades/:id
 */
const getGradeById = async (req, res) => {
  try {
    const { id } = req.params;

    const coreGrade = await coreApi.getGradeById(id);
    if (!coreGrade) {
      return res.status(404).json({ success: false, message: 'Grade not found in Core Backend' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: String(coreGrade._id || coreGrade.id),
        id: coreGrade.id || String(coreGrade._id),
        name: coreGrade.name,
        grade: coreGrade.grade || coreGrade.name,
        stream: coreGrade.stream || null,
        category: coreGrade.category || 'Primary',
        index: coreGrade.index || 0,
        color: coreGrade.color || '',
        icon: coreGrade.icon || '🎓',
        isActive: coreGrade.isActive !== false,
        source: 'CORE_BACKEND'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all available grade streams strictly from Core Backend API
 * GET /api/v1/grades/streams
 */
const getStreams = async (req, res) => {
  try {
    let coreStreams = [];
    try {
      coreStreams = await coreApi.getGradeStreams();
    } catch (e) {
      console.warn('[GradeController] coreApi.getGradeStreams warning:', e.message);
    }

    if (!Array.isArray(coreStreams) || coreStreams.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const formatted = coreStreams.map((cs, idx) => ({
      _id: String(cs._id || cs.id || `stream_${idx}`),
      id: cs.id || String(cs._id || `stream_${idx}`),
      name: cs.name,
      icon: cs.icon || '',
      index: cs.index !== undefined ? cs.index : (idx + 1),
      source: 'CORE_BACKEND'
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getGrades,
  getGradeById,
  getStreams,
};
