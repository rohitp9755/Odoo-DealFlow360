// Payment recording. Transactional (invoice.paidAmount/status and the Payment
// record must never diverge) and idempotent (retrying the same transactionRef
// against the same invoice must not double-credit it).

const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Quote = require('../models/Quote');
const { logAudit } = require('./auditService');
const { notify } = require('./notificationService');

const NON_PAYABLE_STATUSES = ['cancelled', 'refunded'];

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function recordPayment({ invoiceId, amount, method, transactionRef, recordedBy }) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    const err = new Error('Payment amount must be a positive number');
    err.status = 400;
    throw err;
  }

  const session = await mongoose.startSession();
  let resultPayment, resultInvoice, idempotentHit = false;

  try {
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(invoiceId).session(session);
      if (!invoice) {
        const err = new Error('Invoice not found');
        err.status = 404;
        throw err;
      }
      if (NON_PAYABLE_STATUSES.includes(invoice.status)) {
        const err = new Error(`Cannot record a payment against an invoice with status '${invoice.status}'`);
        err.status = 409;
        throw err;
      }

      if (transactionRef) {
        const existing = await Payment.findOne({ invoice: invoice._id, transactionRef }).session(session);
        if (existing) {
          resultPayment = existing;
          resultInvoice = invoice;
          idempotentHit = true;
          return;
        }
      }

      const alreadyPaid = invoice.paidAmount || 0;
      const remaining = round2(invoice.amount - alreadyPaid);
      if (round2(numericAmount) > remaining + 0.01) {
        const err = new Error(`Payment of ${round2(numericAmount)} exceeds the remaining balance of ${remaining} on this invoice`);
        err.status = 422;
        throw err;
      }

      const [payment] = await Payment.create([{
        invoice: invoice._id,
        amount: round2(numericAmount),
        method,
        transactionRef,
        recordedBy: recordedBy?._id,
        status: 'recorded'
      }], { session });

      invoice.paidAmount = round2(alreadyPaid + numericAmount);
      invoice.status = invoice.paidAmount >= invoice.amount ? 'paid' : 'partially_paid';
      if (invoice.status === 'paid') invoice.paidAt = new Date();
      await invoice.save({ session });

      resultPayment = payment;
      resultInvoice = invoice;
    });
  } finally {
    await session.endSession();
  }

  if (!idempotentHit) {
    await logAudit({
      user: recordedBy,
      action: 'PAYMENT_RECORDED',
      entity: 'Invoice',
      entityId: resultInvoice._id,
      newValue: { amount: round2(numericAmount), method, transactionRef, invoiceStatus: resultInvoice.status }
    });

    const quote = await Quote.findById(resultInvoice.quote).select('rep');
    if (quote?.rep) {
      await notify({
        recipients: [quote.rep],
        type: 'PAYMENT_RECEIVED',
        message: `Payment of ${round2(numericAmount)} recorded against invoice ${resultInvoice._id}. Invoice is now ${resultInvoice.status}.`,
        entity: 'Invoice',
        entityId: resultInvoice._id
      });
    }
  }

  return { payment: resultPayment, invoice: resultInvoice, idempotent: idempotentHit };
}

async function listForInvoice(invoiceId) {
  return Payment.find({ invoice: invoiceId }).sort({ createdAt: -1 });
}

module.exports = { recordPayment, listForInvoice };
