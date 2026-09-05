const mongoose = require('mongoose');

const ProductCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ProductCategory', ProductCategorySchema);
