const express = require('express');
const router = express.Router();
const {
  getAllContentSections,
  getCurriculumSections,
  getCoCurricularSections,
  getContentSectionByKeyOrId,
  upsertContentSection,
  deleteContentSection,
} = require('./content-section.controller');

// Read endpoints
router.get('/', getAllContentSections);
router.get('/curriculum', getCurriculumSections);
router.get('/cocurricular', getCoCurricularSections);
router.get('/:keyOrId', getContentSectionByKeyOrId);

// Mutation endpoints
router.post('/', upsertContentSection);
router.put('/', upsertContentSection);
router.delete('/:id', deleteContentSection);

module.exports = router;
