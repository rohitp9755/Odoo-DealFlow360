const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true }
}, { _id: false });

const CustomerSchema = new mongoose.Schema({
  // Company / customer name.
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address']
  },
  phone: { type: String, trim: true },
  // Drives price calculation (PriceList lookups), discount governance
  // (discountEngine autonomous limits) and approval routing (headline
  // discount thresholds) — see services/discountEngine.js and services/approvalEngine.js.
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold'], default: 'Bronze' },
  billingAddress: { type: AddressSchema, default: () => ({}) },
  shippingAddress: { type: AddressSchema, default: () => ({}) },
  shippingSameAsBilling: { type: Boolean, default: true },
  assignedRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  repHistoricalAvgDiscount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
