const mongoose = require('mongoose');

const AllocationSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  shippingCost: { type: Number, required: true }
}, { _id: true });

const BackorderSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['open', 'consolidated'], default: 'open' }
}, { _id: true });

const FulfillmentSchema = new mongoose.Schema({
  quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true, unique: true },
  allocations: [AllocationSchema],
  backorders: [BackorderSchema],
  totalShippingCost: { type: Number, default: 0 },
  shipmentCount: { type: Number, default: 0 },
  overridden: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Fulfillment', FulfillmentSchema);
