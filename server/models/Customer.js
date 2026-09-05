const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: String, enum: ['Bronze', 'Silver', 'Gold'], default: 'Bronze' },
  email: String,
  phone: String,
  billingAddress: String,
  repHistoricalAvgDiscount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
