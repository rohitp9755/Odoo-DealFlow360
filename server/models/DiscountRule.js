const mongoose = require('mongoose');

const DiscountRuleSchema = new mongoose.Schema({
  category: { type: String, enum: ['Hardware', 'Software', 'Services'], required: true, unique: true },
  ceilingDiscount: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('DiscountRule', DiscountRuleSchema);
