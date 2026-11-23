const mongoose = require('mongoose');

/**
 * Normalized Lean FormSchema Model (form_schemas collection)
 *
 * Strictly contains only the requested keys:
 * - _id: MongoDB ObjectId (automatic)
 * - formSchemaId: String (required, unique, e.g. "1_PROJECT_REVIEWER")
 * - name: String (required, form schema name)
 * - fields: Object (key and values object format with field definitions)
 * - isActive: Boolean (default: true)
 * - timelineNodeId: MongoDB ObjectId reference to TimelineNodeStatic (_id)
 * - createdAt & updatedAt: Timestamps (automatic)
 */
const formSchemaDef = new mongoose.Schema({
  formSchemaId: {
    type: String,
    required: [true, 'Form Schema ID (formSchemaId) is required'],
    unique: true,
    trim: true,
    index: true
  },
  timelineNodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimelineNodeStatic',
    required: [true, 'TimelineNode ObjectId reference (timelineNodeId) is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Form Schema Name is required'],
    trim: true
  },
  fields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'form_schemas',
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-populate name from title if title passed, and convert fields array to key-value object map
formSchemaDef.pre('validate', function(next) {
  if (!this.name && this.title) {
    this.name = this.title;
  }
  if (!this.timelineNodeId && this.node) {
    this.timelineNodeId = this.node;
  }

  if (Array.isArray(this.fields)) {
    const fieldsMap = {};
    for (const item of this.fields) {
      if (!item) continue;
      const key = item.key || item.name;
      if (!key) continue;
      fieldsMap[key] = {
        label: item.label || key,
        type: item.type || 'text',
        required: Boolean(item.required),
        options: Array.isArray(item.options) ? item.options : [],
        hint: item.hint || '',
        placeholder: item.placeholder || '',
        defaultValue: item.defaultValue !== undefined ? item.defaultValue : null,
        metadata: item.metadata || {}
      };
    }
    this.fields = fieldsMap;
  }

  next();
});

// Virtual compatibility getters
formSchemaDef.virtual('title').get(function() {
  return this.name;
});

/**
 * Instance Method: Return fields as an array for UI forms
 */
formSchemaDef.methods.toFieldsArray = function() {
  if (!this.fields || typeof this.fields !== 'object') return [];
  if (Array.isArray(this.fields)) return this.fields;

  return Object.entries(this.fields).map(([key, def]) => ({
    key,
    name: key,
    label: def?.label || key,
    type: def?.type || 'text',
    required: Boolean(def?.required),
    options: def?.options || [],
    hint: def?.hint || '',
    placeholder: def?.placeholder || '',
    defaultValue: def?.defaultValue !== undefined ? def?.defaultValue : null,
    metadata: def?.metadata || {}
  }));
};

module.exports = mongoose.models.FormSchema || mongoose.model('FormSchema', formSchemaDef, 'form_schemas');
