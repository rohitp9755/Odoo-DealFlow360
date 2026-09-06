const Invoice = require('../models/Invoice');
const { recordPayment, listForInvoice } = require('../services/paymentService');
const { ROLES } = require('../config/roles');
const eventBus = require('../events/eventBus');

async function record(req, res, next) {
  try {
    const { amount, method, transactionRef } = req.body;
    if (!method) return res.status(400).json({ message: 'Payment method is required' });

    const result = await recordPayment({
      invoiceId: req.params.invoiceId,
      amount,
      method,
      transactionRef,
      recordedBy: req.user
    });

    if (!result.idempotent) {
      eventBus.broadcast('payment.received', result, {
        roles: [ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN]
      });
    }

    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(await listForInvoice(req.params.invoiceId));
  } catch (err) { next(err); }
}

module.exports = { record, list };
