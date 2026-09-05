const mongoose = require('mongoose');

const WarehouseStockSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 0 }
}, { timestamps: true });

WarehouseStockSchema.index({ warehouse: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('WarehouseStock', WarehouseStockSchema);
