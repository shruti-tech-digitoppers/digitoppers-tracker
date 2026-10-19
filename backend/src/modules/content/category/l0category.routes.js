const express = require('express');
const router = express.Router();
const {
  getL0Categories,
  getL0CategoryById,
  createL0Category,
  updateL0Category,
  deleteL0Category,
} = require('./l0category.controller');

router.get('/', getL0Categories);
router.get('/:id', getL0CategoryById);
router.post('/', createL0Category);
router.put('/:id', updateL0Category);
router.delete('/:id', deleteL0Category);

module.exports = router;
