const mongoose = require('mongoose');

const ApprovalStepSchema = new mongoose.Schema({
  role: { type: String, enum: ['manager', 'finance', 'escalation'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  actedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actedAt: Date,
  comment: String
}, { _id: true });

const ApprovalSchema = new mongoose.Schema({
  quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  requestedDiscount: { type: Number, required: true }, // blended / headline discount that triggered this
  riskScore: { type: Number, required: true },
  riskBand: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'], required: true },
  marginLeakage: { type: Number, required: true },

  reasons: [String], // human-readable explanation lines

  steps: [ApprovalStepSchema],
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'returned'], default: 'pending' },

  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Approval', ApprovalSchema);
