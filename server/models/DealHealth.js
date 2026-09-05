const mongoose = require('mongoose');

const DealHealthSchema = new mongoose.Schema({
  quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true, unique: true },
  score: { type: Number, required: true },
  status: { type: String, enum: ['Healthy', 'Watch', 'At Risk', 'Critical'], required: true },
  factors: {
    discountRisk: Number,
    marginRisk: Number,
    negotiationDuration: Number,
    approvalDelay: Number,
    inventoryRisk: Number,
    quoteAge: Number
  },
  alerts: [{
    type: { type: String, enum: ['stalled_deal', 'unusual_discount', 'delivery_slippage', 'approval_delay', 'inventory_risk'] },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('DealHealth', DealHealthSchema);
