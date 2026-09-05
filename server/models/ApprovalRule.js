const mongoose = require('mongoose');

const ApprovalRuleSchema = new mongoose.Schema({
  minDiscount: { type: Number, required: true },
  maxDiscount: { type: Number, required: true },
  approversRequired: [{ type: String, enum: ['manager', 'finance', 'escalation'] }],
  label: String
}, { timestamps: true });

module.exports = mongoose.model('ApprovalRule', ApprovalRuleSchema);
