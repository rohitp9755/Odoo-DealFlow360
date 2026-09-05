const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // References ProductCategory by name (kept denormalized so the existing
  // discount-ceiling lookups, which are keyed by category name, keep working).
  category: { type: String, required: true },
  subCategory: String,
  price: { type: Number, required: true },
  cost: { type: Number, required: true },
  unit: { type: String, default: 'unit' },
  tax: { type: Number, default: 18 },
  description: String,
  tags: [String],
  isRecurring: { type: Boolean, default: false },
  billingCycle: { type: String, enum: ['one-time', 'monthly', 'quarterly', 'yearly'], default: 'one-time' },
  promoted: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
