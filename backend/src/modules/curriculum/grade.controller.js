const Grade = require('./grade.model');
const GradeStream = require('./grade-stream.model');

/**
 * Get all active curriculum grades populated with streams from DB
 */
const getGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ isActive: true }).populate('streams').sort({ index: 1 });
    res.status(200).json({
      success: true,
      data: grades,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all grade streams from DB
 */
const getStreams = async (req, res) => {
  try {
    const streams = await GradeStream.find().sort({ index: 1 });
    res.status(200).json({
      success: true,
      data: streams,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getGrades,
  getStreams,
};
