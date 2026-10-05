const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // e.g. 'STEM_LAB', 'ROBOTICS', 'EPATHSHALA'
    },
    label: {
      type: String,
      required: true,
      trim: true, // e.g. 'STEM Lab', 'Robotics Lab'
    },
    name: {
      type: String,
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    icon: {
      type: String,
      default: '🔬',
    },
    index: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        if (!ret.name) ret.name = ret.label;
        if (!ret.description) ret.description = ret.desc;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        if (!ret.name) ret.name = ret.label;
        if (!ret.description) ret.description = ret.desc;
        return ret;
      },
    },
  }
);

// Synchronize name & label, desc & description before save
solutionSchema.pre('save', function (next) {
  if (this.label && !this.name) this.name = this.label;
  if (this.name && !this.label) this.label = this.name;
  if (this.desc && !this.description) this.description = this.desc;
  if (this.description && !this.desc) this.desc = this.description;
  next();
});

module.exports = mongoose.models.Solution || mongoose.model('Solution', solutionSchema);
