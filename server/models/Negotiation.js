const mongoose = require('mongoose');

const NegotiationOfferSchema = new mongoose.Schema({
  requestedDiscount: { type: Number, required: true },
  recommendedDiscount: { type: Number, required: true },
  requiresApproval: { type: Boolean, required: true },
  approval: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval' },
  status: { type: String, enum: ['proposed', 'accepted', 'approved', 'rejected'], default: 'proposed' }
}, { timestamps: true });

const NegotiationSchema = new mongoose.Schema({
  quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NegotiationMessage' }],
  offers: [NegotiationOfferSchema],
  status: { type: String, enum: ['open', 'resolved'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Negotiation', NegotiationSchema);
