const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true },
  projectId: { type: String, required: true, trim: true, uppercase: true, index: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  numberOfSchools: { type: Number, default: 0 },
  numberOfLicenses: { type: Number, default: 0 },
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.title = ret.projectName;
      ret.status = ret.status || (ret.isActive ? 'ACTIVE' : 'ARCHIVED');
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.title = ret.projectName;
      ret.status = ret.status || (ret.isActive ? 'ACTIVE' : 'ARCHIVED');
      return ret;
    }
  }
});

// Virtual alias for title to support legacy readers
projectSchema.virtual('title').get(function () {
  return this.projectName;
}).set(function (v) {
  this.projectName = v;
});

projectSchema.virtual('status').get(function () {
  return this.isActive ? 'ACTIVE' : 'ARCHIVED';
});

module.exports = mongoose.model('Project', projectSchema);
