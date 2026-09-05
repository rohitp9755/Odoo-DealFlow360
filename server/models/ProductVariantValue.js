const mongoose = require('mongoose');

// A specific value under a ProductVariant, e.g. "Red" under the "Color" variant.
const ProductVariantValueSchema = new mongoose.Schema({
  variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  value: { type: String, required: true, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

ProductVariantValueSchema.index({ variant: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('ProductVariantValue', ProductVariantValueSchema);
