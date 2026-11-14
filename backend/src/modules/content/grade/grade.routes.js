const express = require('express');
const router = express.Router();
const { getGrades, getGradeById, getStreams } = require('./grade.controller');

router.get('/', getGrades);
router.get('/streams', getStreams);
router.get('/:id', getGradeById);

module.exports = router;
