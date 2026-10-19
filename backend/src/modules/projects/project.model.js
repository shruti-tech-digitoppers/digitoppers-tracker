const mongoose = require('mongoose');

// Sub-schema: Client Purchase Order (Layer 1 Commercial Document)
const clientPurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true },
  poDate: { type: Date, required: true },
  poDocumentUrl: { type: String, default: '' },
  issuingOrganization: { type: String, default: '' },
  poAmount: { type: Number, default: 0 },
  remarks: { type: String, default: '' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  submittedAt: { type: Date, default: Date.now }
}, { _id: true });

// Sub-schema: Client Proforma Invoice (Layer 1 Commercial Document)
const clientProformaInvoiceSchema = new mongoose.Schema({
  piNumber: { type: String, required: true },
  piDate: { type: Date, required: true },
  piDocumentUrl: { type: String, default: '' },
  ewayBillNumber: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PARTIALLY_PAID', 'PENDING', 'UNPAID'],
    default: 'PENDING',
    index: true
  },
  paymentReferenceUTR: { type: String, default: '' },
  remarks: { type: String, default: '' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  submittedAt: { type: Date, default: Date.now }
}, { _id: true });

const projectSchema = new mongoose.Schema(
  {
    projectId: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    projectCode: { type: String, trim: true, uppercase: true, index: true },
    projectName: { type: String, required: true, trim: true },
    organization: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    district: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    numberOfSchools: { type: Number, default: 0 },
    numberOfLicenses: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true
    },
    startDate: { type: Date, default: null },
    targetCompletionDate: { type: Date, default: null },
    // ── LAYER 1: CLIENT LEVEL PO & PI (Owned by Finance Dept) ──
    clientPoAndPi: {
      purchaseOrders: [clientPurchaseOrderSchema],
      proformaInvoices: [clientProformaInvoiceSchema]
    },
    isActive: { type: Boolean, default: true }
  },
  {
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
  }
);

// Virtual alias for title to support legacy readers
projectSchema.virtual('title').get(function () {
  return this.projectName;
}).set(function (v) {
  this.projectName = v;
});

module.exports = mongoose.model('Project', projectSchema);
