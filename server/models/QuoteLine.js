const mongoose = require('mongoose');

// Embedded sub-document schema (not a separate collection) for lines within a Quote.
const QuoteLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true }, // price at time of quoting
  unitCost: { type: Number, required: true },  // cost at time of quoting (internal only)
  lineDiscount: { type: Number, default: 0 },  // percent
  allowedDiscount: { type: Number, default: 0 }, // computed: min(tier autonomous, category ceiling)
  categoryCeiling: { type: Number, default: 0 },
  violation: { type: Number, default: 0 }, // requested - allowed, floor 0
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  margin: { type: Number, default: 0 },
  marginPercent: { type: Number, default: 0 }
}, { _id: true });

module.exports = QuoteLineSchema;
