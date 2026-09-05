const mongoose = require('mongoose');

const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: String,
  shippingCostPerUnit: { type: Number, default: 50 },
  replenishmentThreshold: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', WarehouseSchema);
