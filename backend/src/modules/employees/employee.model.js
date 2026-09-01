const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { GLOBAL_ROLES } = require('../../core/constants');

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  globalRole: { type: String, enum: Object.values(GLOBAL_ROLES), default: GLOBAL_ROLES.EMPLOYEE, index: true },
  employeeCode: { type: String, required: true, unique: true, uppercase: true, index: true },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

employeeSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('Employee', employeeSchema);
