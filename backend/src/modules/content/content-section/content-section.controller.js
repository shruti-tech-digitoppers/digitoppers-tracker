const ContentSection = require('./content-section.model');
const Language = require('../language/language.model');
const Grade = require('../grade/grade.model');
const L0Category = require('../category/l0category.model');

/**
 * 1. Get all ContentSections with rich filtering
 * query params: isCurriculum, type, board, medium, grade, stream, categoryName, isActive
 */
exports.getAllContentSections = async (req, res) => {
  try {
    const { isCurriculum, type, board, language, medium, grade, stream, categoryName, isActive } = req.query;
    const filter = {};

    if (isCurriculum !== undefined) {
      filter.isCurriculum = isCurriculum === 'true' || isCurriculum === true;
    } else if (type) {
      const normalized = type.toLowerCase();
      if (normalized === 'curriculum') {
        filter.isCurriculum = true;
      } else if (['cocurricular', 'noncurriculum', 'co-curricular', 'non-curriculum'].includes(normalized)) {
        filter.isCurriculum = false;
      }
    }

    if (board) filter.board = new RegExp(`^${board}$`, 'i');

    const targetLang = language || medium;
    if (targetLang) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(targetLang) && String(targetLang).length === 24) {
        filter.language = targetLang;
      } else {
        const langDoc = await Language.findOne({
          $or: [
            { code: targetLang.toLowerCase() },
            { name: new RegExp(`^${targetLang}$`, 'i') },
            { id: targetLang.toLowerCase() },
          ],
        });
        if (langDoc) filter.language = langDoc._id;
      }
    }

    if (grade) filter.grade = grade;
    if (stream) filter.stream = stream;
    if (categoryName) filter.categoryName = new RegExp(`^${categoryName}$`, 'i');
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const records = await ContentSection.find(filter)
      .populate('language', 'name code id')
      .populate('gradeRef', 'name grade stream category')
      .populate('category', 'name id section layout')
      .populate('department', 'name code description')
      .sort({ isCurriculum: -1, board: 1, grade: 1, categoryName: 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content sections',
      error: error.message,
    });
  }
};

/**
 * 2. Convenience: Get Curriculum Sections Only (isCurriculum = true)
 * Filtered by Board × Medium × Grade + Subjects
 */
exports.getCurriculumSections = async (req, res) => {
  req.query.isCurriculum = 'true';
  return exports.getAllContentSections(req, res);
};

/**
 * 3. Convenience: Get Co-Curricular Sections Only (isCurriculum = false)
 * Filtered by Category × Medium
 */
exports.getCoCurricularSections = async (req, res) => {
  req.query.isCurriculum = 'false';
  return exports.getAllContentSections(req, res);
};

/**
 * 4. Get single ContentSection by reqKey, blgKey, or ObjectId
 */
exports.getContentSectionByKeyOrId = async (req, res) => {
  try {
    const { keyOrId } = req.params;
    let doc = null;

    if (keyOrId.match(/^[0-9a-fA-F]{24}$/)) {
      doc = await ContentSection.findById(keyOrId)
        .populate('language', 'name code')
        .populate('gradeRef', 'name grade stream')
        .populate('category', 'name id')
        .populate('department', 'name code description');
    }

    if (!doc) {
      doc = await ContentSection.findOne({
        $or: [{ reqKey: keyOrId.toLowerCase() }, { blgKey: keyOrId.toLowerCase() }],
      })
        .populate('language', 'name code')
        .populate('gradeRef', 'name grade stream')
        .populate('category', 'name id')
        .populate('department', 'name code description');
    }

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: `Content section '${keyOrId}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve content section',
      error: error.message,
    });
  }
};

/**
 * 5. Create or Upsert a ContentSection
 */
exports.upsertContentSection = async (req, res) => {
  try {
    const {
      isCurriculum: rawIsCurriculum,
      type,
      board,
      language,
      medium,
      languageId,
      grade,
      gradeId,
      stream,
      categoryName,
      categoryId,
      sheetUrl,
      driveLink,
      totalChapters,
      status,
      coCurricularData,
      reqKey,
      curriculumVersion,
      remarks,
    } = req.body;

    const isCurriculum = rawIsCurriculum !== undefined
      ? Boolean(rawIsCurriculum)
      : (type ? type.toLowerCase() === 'curriculum' : Boolean(board && grade));

    // Resolve Language
    let langDoc = null;
    if (languageId) {
      langDoc = await Language.findById(languageId);
    }
    const candidateLang = language || medium;
    if (!langDoc && candidateLang) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(candidateLang) && String(candidateLang).length === 24) {
        langDoc = await Language.findById(candidateLang);
      }
      if (!langDoc) {
        langDoc = await Language.findOne({
          $or: [
            { code: String(candidateLang).toLowerCase() },
            { name: new RegExp(`^${candidateLang}$`, 'i') },
            { id: String(candidateLang).toLowerCase() },
          ],
        });
      }
    }

    if (!langDoc) {
      return res.status(400).json({
        success: false,
        message: 'Valid language is required',
      });
    }

    let computedKey = reqKey;

    if (isCurriculum) {
      // ── ACADEMIC CURRICULUM: Board × Language × Grade ──
      if (!board || !grade) {
        return res.status(400).json({
          success: false,
          message: 'Curriculum section requires both board and grade',
        });
      }

      if (!computedKey) {
        computedKey = `curriculum_${board.toLowerCase().replace(/\s+/g, '_')}_${langDoc.code.toLowerCase()}_${grade
          .toLowerCase()
          .replace(/\s+/g, '_')}${stream ? `_${stream.toLowerCase()}` : ''}`;
      }

      let resolvedGradeRef = gradeId || null;
      if (!resolvedGradeRef && grade) {
        const grDoc = await Grade.findOne({
          $or: [{ name: grade }, { grade: grade }, { id: grade.toLowerCase().replace(/\s+/g, '_') }],
        });
        if (grDoc) resolvedGradeRef = grDoc._id;
      }

      const updateData = {
        isCurriculum: true,
        type: 'curriculum',
        reqKey: computedKey.toLowerCase(),
        blgKey: computedKey.toLowerCase(),
        section: 'academic',
        categoryName: categoryName || 'Syllabus Content',
        language: langDoc._id,
        board: board,
        gradeRef: resolvedGradeRef,
        grade: grade,
        stream: stream || null,
        sheetUrl: sheetUrl || '',
        driveLink: driveLink || '',
        totalChapters: Number(totalChapters) || 0,
        status: status || 'PENDING',
        curriculumVersion: curriculumVersion || '2026-NEP',
        isActive: true,
        remarks: remarks || '',
      };

      const doc = await ContentSection.findOneAndUpdate(
        { reqKey: computedKey.toLowerCase() },
        { $set: updateData },
        { new: true, upsert: true, runValidators: true }
      ).populate('language gradeRef category');

      return res.status(200).json({
        success: true,
        message: 'Curriculum content section saved successfully',
        data: doc,
      });
    } else {
      // ── CO-CURRICULAR: Category × Language (No Board, No Grade) ──
      const targetCategoryName = categoryName || 'Co-Curricular';

      let resolvedCategoryRef = categoryId || null;
      if (!resolvedCategoryRef && targetCategoryName) {
        const catDoc = await L0Category.findOne({
          $or: [{ name: new RegExp(`^${targetCategoryName}$`, 'i') }, { id: targetCategoryName.toLowerCase().replace(/\s+/g, '_') }],
        });
        if (catDoc) resolvedCategoryRef = catDoc._id;
      }

      if (!computedKey) {
        computedKey = `cocurricular_${langDoc.code.toLowerCase()}_${targetCategoryName
          .toLowerCase()
          .replace(/\s+/g, '_')}`;
      }

      const coData = coCurricularData || {};
      const resolvedSheetUrl = coData.sheetUrl || sheetUrl || '';
      const resolvedDriveLink = coData.driveLink || driveLink || '';

      const updateData = {
        isCurriculum: false,
        type: 'cocurricular',
        reqKey: computedKey.toLowerCase(),
        blgKey: null,
        section: 'non-academic',
        category: resolvedCategoryRef,
        categoryName: targetCategoryName,
        language: langDoc._id,
        board: null,
        grade: null,
        gradeRef: null,
        stream: null,
        sheetUrl: resolvedSheetUrl,
        driveLink: resolvedDriveLink,
        status: status || 'READY',
        coCurricularData: {
          sheetUrl: resolvedSheetUrl,
          driveLink: resolvedDriveLink,
          totalItemsCount: Number(coData.totalItemsCount) || 0,
          itemsList: Array.isArray(coData.itemsList) ? coData.itemsList : [],
          remarks: coData.remarks || remarks || '',
        },
        curriculumVersion: curriculumVersion || '2026-Standard',
        isActive: true,
        remarks: remarks || '',
      };

      const doc = await ContentSection.findOneAndUpdate(
        { reqKey: computedKey.toLowerCase() },
        { $set: updateData },
        { new: true, upsert: true, runValidators: true }
      ).populate('language category');

      return res.status(200).json({
        success: true,
        message: 'Co-curricular content section saved successfully',
        data: doc,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save content section',
      error: error.message,
    });
  }
};

/**
 * 6. Delete a ContentSection
 */
exports.deleteContentSection = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await ContentSection.findByIdAndDelete(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Content section not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Content section deleted successfully',
      data: doc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete content section',
      error: error.message,
    });
  }
};
