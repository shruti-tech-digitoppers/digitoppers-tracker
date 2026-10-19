const License = require('./license.model');
const SchoolHardwareLicense = require('./school-hardware-license.model');
const licenseController = require('./license.controller');
const licenseRoutes = require('./license.routes');

module.exports = {
  License,
  SchoolHardwareLicense,
  licenseController,
  licenseRoutes,
};
