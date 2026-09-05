const mongoose = require('mongoose');

// An axis of variation for a specific product, e.g. "Color" or "Size".
// Actual values (e.g. "Red", "XL") live in ProductVariantValue.
const ProductVariantSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

ProductVariantSchema.index({ product: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ProductVariant', ProductVariantSchema);
