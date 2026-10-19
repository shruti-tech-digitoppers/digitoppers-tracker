const express = require('express');
const router = express.Router({ mergeParams: true });
const controller = require('./training.controller');
const { protect } = require('../../core/auth');

// ── Read Routes ──
router.get('/summary', controller.getTrainingSummary);
router.get('/project/:projectId', controller.getTrainingByProject);
router.get('/:projectId', (req, res, next) => {
  if (req.params.projectId === 'summary') return controller.getTrainingSummary(req, res, next);
  return controller.getTrainingByProject(req, res, next);
});
router.get('/', (req, res, next) => {
  if (req.params.projectId) {
    return controller.getTrainingByProject(req, res, next);
  }
  return controller.getAllTrainings(req, res, next);
});

// ── Protected Mutation Routes ──
router.use(protect);

// Routes for nested mount (/api/v1/projects/:projectId/training)
router.post('/plan', controller.saveTrainingPlanning);
router.post('/execution', controller.saveTrainingExecution);
router.patch('/school/:schoolId', controller.updateSchoolTraining);
router.put('/', controller.updateOverallTraining);

// Routes for root mount (/api/v1/training)
router.post('/project/:projectId/plan', controller.saveTrainingPlanning);
router.post('/project/:projectId/execution', controller.saveTrainingExecution);
router.patch('/project/:projectId/school/:schoolId', controller.updateSchoolTraining);
router.put('/project/:projectId', controller.updateOverallTraining);
router.post('/project/:projectId', controller.updateOverallTraining);

module.exports = router;
