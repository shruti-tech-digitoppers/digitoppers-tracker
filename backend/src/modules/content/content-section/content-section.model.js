const mongoose = require('mongoose');

// Ensure referenced models are registered
require('../language/language.model');
require('../grade/grade.model');
require('../category/l0category.model');
require('../../departments/department.model');

// ── Subschema: Co-Curricular Digital Package ────────────────────────────────
const coCurricularDataSchema = new mongoose.Schema(
  {
    sheetUrl: {
      type: String,
      default: '',
      trim: true
    },
    driveLink: {
      type: String,
      default: '',
      trim: true
    },
    totalItemsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    itemsList: [
      {
        type: String,
        trim: true
      }
    ],
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  { _id: false }
);

// ── Main ContentSection Schema ──────────────────────────────────────────────
const contentSectionSchema = new mongoose.Schema(
  {
    /**
     * isCurriculum:
     * - true  -> Academic Curriculum (Board × Language × Grade)
     * - false -> Co-Curricular (Category/Name × Language - No Board, No Grade)
     */
    isCurriculum: {
      type: Boolean,
      required: [true, 'isCurriculum flag is required (true for Curriculum, false for Co-Curricular)'],
      default: true,
      index: true
    },

    // Department ownership
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true
    },
    departmentCode: {
      type: String,
      enum: ['OPS', 'TECH', 'CONTENT', 'FIN', 'SALES', 'INSTALLATION', 'TRAINING', null],
      default: 'CONTENT',
      index: true
    },

    // Backward-compatibility field ('curriculum' vs 'cocurricular')
    type: {
      type: String,
      enum: ['curriculum', 'cocurricular', 'noncurriculum'],
      default: 'curriculum',
      index: true
    },

    // Guaranteed Unique Lookup Key (e.g. "curriculum_cbse_en_class_1" or "cocurricular_en_toon_masti")
    reqKey: {
      type: String,
      required: [true, 'reqKey lookup key is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },

    // Legacy lookup key alias
    blgKey: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },

    // Section classification ('academic' vs 'non-academic' / 'co-curricular')
    section: {
      type: String,
      enum: ['academic', 'non-academic', 'co-curricular'],
      default: function () {
        return this.isCurriculum ? 'academic' : 'non-academic';
      }
    },

    // Category reference (e.g. Syllabus Content, Toon Masti, Simulations, etc.)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'L0Category',
      default: null
    },
    categoryName: {
      type: String,
      trim: true,
      default: function () {
        return this.isCurriculum ? 'Syllabus Content' : 'Co-Curricular';
      }
    },

    // ── 1. LANGUAGE (Required in BOTH Curriculum and Co-Curricular — replaces "medium") ──
    language: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
      required: [true, 'Language reference is required'],
      index: true
    },

    // ── 2. CURRICULUM SECTION: Board + Grade (+ Stream) ───────────────────────
    board: {
      type: String,
      trim: true,
      default: null
    },
    gradeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      default: null
    },
    grade: {
      type: String,
      trim: true,
      default: null
    },
    stream: {
      type: String,
      trim: true,
      default: null
    },

    // ── Sheet & Drive Links for Content Tracking ──────────────────────────────
    sheetUrl: {
      type: String,
      default: '',
      trim: true
    },
    driveLink: {
      type: String,
      default: '',
      trim: true
    },
    totalChapters: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'READY', 'VERIFIED'],
      default: 'PENDING'
    },

    // ── 3. CO-CURRICULAR SECTION: Language-Only Package (When isCurriculum === false) ──
    coCurricularData: {
      type: coCurricularDataSchema,
      default: () => ({})
    },

    curriculumVersion: {
      type: String,
      default: '2026-NEP',
      trim: true
    },
    isStandard: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: nonCurriculumData alias
contentSectionSchema.virtual('nonCurriculumData').get(function () {
  return this.coCurricularData;
});

// Virtual getter: medium (returns language.name for backward compatibility)
contentSectionSchema.virtual('medium').get(function () {
  if (this.language && typeof this.language === 'object' && this.language.name) {
    return this.language.name;
  }
  return '';
});

// Pre-save hook: auto-sync isCurriculum with type & section
contentSectionSchema.pre('save', function (next) {
  if (this.isCurriculum !== undefined) {
    this.type = this.isCurriculum ? 'curriculum' : 'cocurricular';
    if (!this.section) {
      this.section = this.isCurriculum ? 'academic' : 'non-academic';
    }
  } else if (this.type) {
    this.isCurriculum = (this.type === 'curriculum');
    this.section = this.isCurriculum ? 'academic' : 'non-academic';
  }

  // If co-curricular and sheetUrl is inside coCurricularData, mirror to top-level sheetUrl
  if (!this.isCurriculum && this.coCurricularData) {
    if (!this.sheetUrl && this.coCurricularData.sheetUrl) {
      this.sheetUrl = this.coCurricularData.sheetUrl;
    }
    if (!this.driveLink && this.coCurricularData.driveLink) {
      this.driveLink = this.coCurricularData.driveLink;
    }
  }

  if (typeof next === 'function') next();
});

// Compound Indexes using language
contentSectionSchema.index({ isCurriculum: 1, board: 1, language: 1, grade: 1 });
contentSectionSchema.index({ isCurriculum: 1, language: 1, categoryName: 1 });
contentSectionSchema.index({ type: 1, board: 1, language: 1, grade: 1 });

const ContentSection =
  mongoose.models.ContentSection ||
  mongoose.model('ContentSection', contentSectionSchema, 'contentsections');

module.exports = ContentSection;
