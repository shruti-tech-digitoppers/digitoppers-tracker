// Central Content Module Export
const ContentSection = require('./content-section/content-section.model');
const Grade = require('./grade/grade.model');
const L0Category = require('./category/l0category.model');
const Language = require('./language/language.model');

const contentSectionRoutes = require('./content-section/content-section.routes');
const gradeRoutes = require('./grade/grade.routes');
const l0categoryRoutes = require('./category/l0category.routes');

module.exports = {
  // Canonical Models
  ContentSection,
  SectionWiseReq: ContentSection, // Backward-compat alias
  Grade,
  L0Category,
  Language,

  // Routers
  contentSectionRoutes,
  sectionWiseReqRoutes: contentSectionRoutes, // Backward-compat alias
  gradeRoutes,
  l0categoryRoutes,
};
