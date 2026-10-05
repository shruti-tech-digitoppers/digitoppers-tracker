const express = require('express');
const router = express.Router();
const {
  getHardware,
  getHardwareById,
  createHardware,
  updateHardware,
  deleteHardware,
} = require('./hardware.controller');

router.get('/', getHardware);
router.get('/:id', getHardwareById);
router.post('/', createHardware);
router.put('/:id', updateHardware);
router.delete('/:id', deleteHardware);

module.exports = router;
