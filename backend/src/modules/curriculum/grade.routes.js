const express = require('express');
const router = express.Router();
const { getGrades, getStreams } = require('./grade.controller');

router.get('/', getGrades);
router.get('/streams', getStreams);

module.exports = router;
