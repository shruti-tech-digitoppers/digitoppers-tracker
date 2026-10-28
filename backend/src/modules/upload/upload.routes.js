const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../../core/auth');
const { AppError } = require('../../core/errors');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Format current date-time as human-readable string: YYYY-MM-DD_HH-mm-ss
 */
function getHumanReadableTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// Storage configuration - Format: originalName_YYYY-MM-DD_HH-mm-ss.ext
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const rawBase = path.basename(file.originalname, ext);
    const sanitizedBase = rawBase
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'document';

    const timestamp = getHumanReadableTimestamp();
    const candidateName = `${sanitizedBase}_${timestamp}${ext}`;

    // If file with same name exists, append small random salt to prevent collision
    if (fs.existsSync(path.join(uploadDir, candidateName))) {
      const salt = Math.random().toString(36).substring(2, 6);
      cb(null, `${sanitizedBase}_${timestamp}_${salt}${ext}`);
    } else {
      cb(null, candidateName);
    }
  }
});

// File filter (PDF, Docs, Images, APK, EXE, Binaries)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp', '.xlsx', '.xls', '.csv',
    '.apk', '.exe', '.msi', '.zip', '.dmg', '.bin'
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) || !ext) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file format. Only PDF, images, docs, and application packages (.apk, .exe) are permitted.', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 250 * 1024 * 1024 // 250 MB for APK / EXE builds
  }
});

// Upload Single File Route
router.post('/', protect, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please select a file to upload.', 400));
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: fileUrl
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
