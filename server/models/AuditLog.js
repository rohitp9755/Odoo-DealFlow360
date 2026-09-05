const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: String,
  action: { type: String, required: true }, // e.g. 'DISCOUNT_CHANGED', 'APPROVAL_APPROVED'
  entity: { type: String, required: true }, // e.g. 'Quote', 'Approval'
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  reason: String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
