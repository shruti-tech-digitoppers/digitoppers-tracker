const coreApi = require('../../../services/core-api.service');

/**
 * Helper to determine category from grade name/number
 */
const getCategoryForGrade = (gradeName) => {
  const clean = String(gradeName || '').toUpperCase().trim();
  if (['NURSERY', 'LKG', 'UKG'].includes(clean)) return 'Pre-Primary';
  const num = parseInt(clean, 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 5) return 'Primary';
    if (num >= 6 && num <= 8) return 'Middle';
    if (num >= 9 && num <= 10) return 'Secondary';
    if (num >= 11 && num <= 12) return 'Senior Secondary';
  }
  return 'Primary';
};

/**
 * Shorten or normalize stream name (e.g. "Arts and Humanities" -> "Arts")
 */
const normalizeStreamName = (streamName) => {
  const s = String(streamName || '').trim();
  if (s.toLowerCase().includes('art') || s.toLowerCase().includes('humanities')) return 'Arts';
  if (s.toLowerCase().includes('commerce')) return 'Commerce';
  if (s.toLowerCase().includes('science')) return 'Science';
  return s;
};

/**
 * Get all active curriculum grades strictly from Core Backend API
 * (No local Grade collection in Project Tracker)
 * GET /api/v1/grades
 */
const getGrades = async (req, res) => {
  try {
    const { stream, category, grade, expandStreams } = req.query;

    let [coreGrades, coreStreams] = await Promise.all([
      coreApi.getGrades(req.query).catch((e) => {
        console.warn('[GradeController] coreApi.getGrades warning:', e.message);
        return [];
      }),
      coreApi.getGradeStreams().catch((e) => {
        console.warn('[GradeController] coreApi.getGradeStreams warning:', e.message);
        return [];
      })
    ]);

    if (!Array.isArray(coreGrades) || coreGrades.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const streamMap = new Map();
    if (Array.isArray(coreStreams)) {
      coreStreams.forEach((st) => {
        if (st._id) streamMap.set(String(st._id), st);
        if (st.id) streamMap.set(String(st.id), st);
        if (st.name) streamMap.set(String(st.name).toLowerCase(), st);
      });
    }

    // Should we expand streamed grades into individual curriculum selectable items (e.g. 11 Science, 11 Commerce)?
    // Default to true when requested or when getting curriculum grades
    const shouldExpand = expandStreams === 'true' || req.query.curriculum === 'true' || expandStreams === undefined;

    let resultList = [];

    coreGrades.forEach((g, idx) => {
      const gCategory = g.category || getCategoryForGrade(g.name);
      const gName = String(g.name || g.grade || '').trim();
      const rawStreams = Array.isArray(g.streams) ? g.streams : [];

      // Resolve populated or referenced streams
      const resolvedStreams = rawStreams.map((st) => {
        if (typeof st === 'object' && st !== null && st.name) return st;
        return streamMap.get(String(st)) || { name: String(st), id: String(st) };
      }).filter(Boolean);

      // If shouldExpand and grade has streams (or is class 11 / 12)
      if (shouldExpand && (resolvedStreams.length > 0 || (['11', '12'].includes(gName) && coreStreams.length > 0))) {
        const streamsToApply = resolvedStreams.length > 0 ? resolvedStreams : coreStreams;
        streamsToApply.forEach((st, stIdx) => {
          const streamLabel = normalizeStreamName(st.name);
          const classDisplayName = `${gName} ${streamLabel}`;
          resultList.push({
            _id: String(g._id || g.id || `grade_${idx}_${stIdx}`),
            id: `${g.id || gName}_${(st.id || streamLabel).toLowerCase()}`,
            name: classDisplayName,
            grade: gName,
            stream: streamLabel,
            streamId: st.id || '',
            category: gCategory,
            index: (g.index || idx + 1) * 10 + stIdx,
            color: g.color || st.color || '#8B5CF6',
            icon: st.icon || g.icon || '🎓',
            isActive: g.isActive !== false,
            source: 'CORE_BACKEND'
          });
        });
      } else {
        // Standard single grade (e.g. Class 1 to 10)
        resultList.push({
          _id: String(g._id || g.id || `grade_${idx}`),
          id: g.id || `c${gName}`,
          name: gName,
          grade: gName,
          stream: g.stream || null,
          category: gCategory,
          index: g.index !== undefined ? g.index : idx + 1,
          color: g.color || '',
          icon: g.icon || '🎓',
          streams: resolvedStreams,
          isActive: g.isActive !== false,
          source: 'CORE_BACKEND'
        });
      }
    });

    if (stream) resultList = resultList.filter(g => g.stream === stream);
    if (category) resultList = resultList.filter(g => g.category === category);
    if (grade) resultList = resultList.filter(g => g.grade === grade);

    // Sort by index
    resultList.sort((a, b) => (a.index || 0) - (b.index || 0));

    return res.status(200).json({
      success: true,
      count: resultList.length,
      data: resultList,
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
