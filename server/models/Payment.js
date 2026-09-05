const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: ['card', 'bank_transfer', 'upi', 'cash', 'cheque', 'other'], required: true },
  // Optional external reference (gateway transaction id, cheque number, etc.) used
  // to make payment recording idempotent against accidental client retries.
  transactionRef: { type: String, trim: true },
  status: { type: String, enum: ['recorded', 'failed', 'refunded'], default: 'recorded' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Only enforced when transactionRef is present, since cash payments may not have one.
PaymentSchema.index(
  { invoice: 1, transactionRef: 1 },
  { unique: true, partialFilterExpression: { transactionRef: { $type: 'string' } } }
);

module.exports = mongoose.model('Payment', PaymentSchema);
