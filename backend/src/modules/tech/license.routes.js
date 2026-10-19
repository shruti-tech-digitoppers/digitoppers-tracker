const express = require('express');
const router = express.Router();
const {
  getLicenses,
  getLicenseByKeyOrId,
  createLicense,
  bulkCreateLicenses,
  registerLicense,
  updateLicense,
  deleteLicense,
  getHardwareAllocations,
  upsertHardwareAllocation,
  bulkUpsertAllocations,
  syncProjectHardwareAllocations,
  updateAllocationById,
  deleteAllocationById,
} = require('./license.controller');

// ── School Hardware License Allocation (Relation Routes) ──
router.get('/allocations', getHardwareAllocations);
router.post('/allocations', upsertHardwareAllocation);
router.patch('/allocations/:id', updateAllocationById);
router.put('/allocations/:id', updateAllocationById);
router.delete('/allocations/:id', deleteAllocationById);
router.post('/allocations/bulk', bulkUpsertAllocations);
router.post('/allocations/sync-project/:projectId', syncProjectHardwareAllocations);

// ── Raw License Pool Routes ──
router.get('/', getLicenses);
router.get('/:keyOrId', getLicenseByKeyOrId);
router.post('/', createLicense);
router.post('/bulk', bulkCreateLicenses);
router.patch('/:id/register', registerLicense);
router.put('/:id', updateLicense);
router.delete('/:id', deleteLicense);

module.exports = router;
