const mongoose = require('mongoose');
const QuoteLineSchema = require('./QuoteLine');

const QuoteSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  rep: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lines: [QuoteLineSchema],

  orderDiscount: { type: Number, default: 0 }, // additional order-level discount percent, optional

  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  margin: { type: Number, default: 0 },
  marginPercent: { type: Number, default: 0 },

  riskScore: { type: Number, default: 0 },
  riskBand: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'], default: 'LOW' },
  marginLeakage: { type: Number, default: 0 },

  stage: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'sent', 'under_negotiation', 'confirmed', 'rejected'],
    default: 'draft'
  },

  oneTimeTotal: { type: Number, default: 0 },
  recurringTotal: { type: Number, default: 0 },
  recurringCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly', null], default: null },

  submittedAt: Date,
  confirmedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Quote', QuoteSchema);
