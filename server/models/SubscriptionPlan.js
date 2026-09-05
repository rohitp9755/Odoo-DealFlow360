const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cycle: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
  prorationAllowed: { type: Boolean, default: true },
  cancellationRefundPolicy: { type: String, enum: ['full', 'prorated', 'none'], default: 'prorated' }
}, { timestamps: true });

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
