const mongoose = require('mongoose');

const NegotiationMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['customer', 'agent', 'system'], required: true },
  content: { type: String, required: true },
  intent: { type: String }, // ACCEPT / COUNTER_OFFER / APPROVAL_REQUIRED / INFO / CONFIRM
  requestedDiscount: Number,
  action: String,
  result: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('NegotiationMessage', NegotiationMessageSchema);
