const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getHardwareSpecs,
  getHardwareSpecById,
  createHardwareSpec,
  updateHardwareSpec,
  deleteHardwareSpec,
} = require('./hardware-spec.controller');

// GET /api/v1/hardware-specs (or /api/v1/hardware/:hardwareId/specs)
router.get('/', (req, res, next) => {
  if (req.params.hardwareId) {
    req.query.hardwareId = req.params.hardwareId;
  }
  getHardwareSpecs(req, res, next);
});

router.get('/:id', getHardwareSpecById);
router.post('/', createHardwareSpec);
router.patch('/:id', updateHardwareSpec);
router.put('/:id', updateHardwareSpec);
router.delete('/:id', deleteHardwareSpec);

module.exports = router;
