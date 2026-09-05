const mongoose = require('mongoose');

const UpsellRuleSchema = new mongoose.Schema({
  baseProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  recommendedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  weight: { type: Number, default: 1 },
  promoted: { type: Boolean, default: false },
  minMargin: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('UpsellRule', UpsellRuleSchema);
