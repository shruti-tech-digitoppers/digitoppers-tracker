const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true, trim: true },
  projectId: { type: String, required: true, trim: true, uppercase: true, index: true },
  email: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },
  address: { type: String, trim: true },
  numberOfSchools: { type: Number, default: 0 },
  numberOfLicenses: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.title = ret.projectName;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.title = ret.projectName;
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

module.exports = mongoose.model('Project', projectSchema);

