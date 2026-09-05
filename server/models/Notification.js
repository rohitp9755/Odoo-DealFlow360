const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'APPROVAL_REQUIRED', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'APPROVAL_RETURNED',
      'NEGOTIATION_REQUEST', 'QUOTE_CONFIRMED', 'DEAL_STALLED', 'DELIVERY_RISK', 'PAYMENT_RECEIVED'
    ],
    required: true
  },
  message: { type: String, required: true },
  entity: String,
  entityId: mongoose.Schema.Types.ObjectId,
  read: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
