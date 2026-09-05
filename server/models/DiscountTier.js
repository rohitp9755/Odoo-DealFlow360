const mongoose = require('mongoose');

const DiscountTierSchema = new mongoose.Schema({
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold'], required: true, unique: true },
  autonomousDiscount: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('DiscountTier', DiscountTierSchema);
