const Grade = require('./grade.model');

/**
 * Get all active curriculum grades from DB
 */
const getGrades = async (req, res) => {
  try {
    const { stream, category, grade } = req.query;
    const filter = { isActive: true };

    if (stream) filter.stream = stream;
    if (category) filter.category = category;
    if (grade) filter.grade = grade;

    const grades = await Grade.find(filter).sort({ index: 1 });
    res.status(200).json({
      success: true,
      count: grades.length,
      data: grades,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all available grade streams (derived directly from grades without needing a separate collection)
 */
const getStreams = async (req, res) => {
  try {
    const rawStreams = await Grade.distinct('stream', { stream: { $ne: null } });
    const formattedStreams = rawStreams.map((st, idx) => ({
      name: st,
      id: st.toLowerCase(),
      index: idx + 1,
    }));

    res.status(200).json({
      success: true,
      count: formattedStreams.length,
      data: formattedStreams,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getGrades,
  getStreams,
};
