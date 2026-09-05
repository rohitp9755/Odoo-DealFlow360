const mongoose = require('mongoose');

// A customer-tier-specific selling price for a product, in a given currency.
// Resolution: an active entry here overrides Product.price (the implicit
// INR base price) for customers in that tier.
const PriceListSchema = new mongoose.Schema({
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold'], required: true },
  currency: { type: String, enum: ['INR', 'USD', 'EUR', 'GBP'], default: 'INR', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  price: { type: Number, required: true, min: 0 },
  // Whether this price is currently in effect. An inactive entry is kept
  // (not deleted) but ignored by price resolution.
  active: { type: Boolean, default: true }
}, { timestamps: true });

// One price per (tier, product, currency) — updates modify it in place
// rather than creating an ambiguous second entry.
PriceListSchema.index({ tier: 1, product: 1, currency: 1 }, { unique: true });

module.exports = mongoose.model('PriceList', PriceListSchema);
