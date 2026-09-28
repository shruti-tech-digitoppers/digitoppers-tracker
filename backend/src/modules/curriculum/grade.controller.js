const Grade = require('./grade.model');
const GradeStream = require('./grade-stream.model');

const DEFAULT_STREAMS = [
  { name: 'Science', id: 'science', index: 1, icon: 'atom' },
  { name: 'Commerce', id: 'commerce', index: 2, icon: 'briefcase' },
  { name: 'Arts and Humanities', id: 'arts', index: 3, icon: 'palette' }
];

const DEFAULT_GRADES = [
  { name: 'Nursery', id: 'nursery', index: 1, color: '#f59e0b', icon: 'baby' },
  { name: 'LKG', id: 'lkg', index: 2, color: '#ec4899', icon: 'shapes' },
  { name: 'UKG', id: 'ukg', index: 3, color: '#8b5cf6', icon: 'smile' },
  { name: '1', id: 'c1', index: 4, color: '#3b82f6', icon: 'book' },
  { name: '2', id: 'c2', index: 5, color: '#06b6d4', icon: 'book' },
  { name: '3', id: 'c3', index: 6, color: '#10b981', icon: 'book' },
  { name: '4', id: 'c4', index: 7, color: '#84cc16', icon: 'book' },
  { name: '5', id: 'c5', index: 8, color: '#eab308', icon: 'book' },
  { name: '6', id: 'c6', index: 9, color: '#f97316', icon: 'book-open' },
  { name: '7', id: 'c7', index: 10, color: '#ef4444', icon: 'book-open' },
  { name: '8', id: 'c8', index: 11, color: '#d946ef', icon: 'book-open' },
  { name: '9', id: 'c9', index: 12, color: '#6366f1', icon: 'graduation-cap' },
  { name: '10', id: 'c10', index: 13, color: '#0ea5e9', icon: 'graduation-cap' },
  { name: '11', id: 'c11', index: 14, color: '#14b8a6', icon: 'award', hasStreams: true },
  { name: '12', id: 'c12', index: 15, color: '#3a7d84', icon: 'award', hasStreams: true }
];

async function ensureDefaultGradesSeeded() {
  try {
    const streamCount = await GradeStream.countDocuments();
    let streamMap = {};
    if (streamCount === 0) {
      for (const s of DEFAULT_STREAMS) {
        const created = await GradeStream.create(s);
        streamMap[s.id] = created._id;
      }
    } else {
      const existing = await GradeStream.find();
      existing.forEach(s => { streamMap[s.id] = s._id; });
    }

    const gradeCount = await Grade.countDocuments();
    if (gradeCount === 0) {
      for (const g of DEFAULT_GRADES) {
        const streamIds = g.hasStreams ? Object.values(streamMap) : [];
        await Grade.create({
          name: g.name,
          id: g.id,
          color: g.color,
          icon: g.icon,
          index: g.index,
          isActive: true,
          streams: streamIds
        });
      }
    }
  } catch (err) {
    console.error('Error auto-seeding grades:', err);
  }
}

// Controller methods
const getGrades = async (req, res) => {
  try {
    await ensureDefaultGradesSeeded();
    const grades = await Grade.find({ isActive: true }).populate('streams').sort({ index: 1 });
    res.status(200).json({
      success: true,
      data: grades
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStreams = async (req, res) => {
  try {
    await ensureDefaultGradesSeeded();
    const streams = await GradeStream.find().sort({ index: 1 });
    res.status(200).json({
      success: true,
      data: streams
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getGrades,
  getStreams,
  ensureDefaultGradesSeeded
};
