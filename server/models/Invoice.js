const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
  type: { type: String, enum: ['one-time', 'recurring'], required: true },
  cycle: { type: String, enum: ['monthly', 'quarterly', 'yearly', null], default: null },
  periodStart: Date,
  periodEnd: Date,
  amount: { type: Number, required: true },
  proratedAmount: { type: Number },
  status: { type: String, enum: ['draft', 'issued', 'paid', 'refunded', 'cancelled'], default: 'draft' },
  paidAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
