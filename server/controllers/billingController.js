const Quote = require('../models/Quote');
const Invoice = require('../models/Invoice');
const { generateInvoicesForQuote, calculateProration } = require('../services/billingEngine');
const { logAudit } = require('../services/auditService');

async function getForQuote(req, res, next) {
  try {
    const invoices = await Invoice.find({ quote: req.params.quoteId }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) { next(err); }
}

async function generate(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.quoteId);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    if (quote.stage !== 'confirmed') return res.status(400).json({ message: 'Quote must be confirmed before billing' });

    const invoices = await generateInvoicesForQuote(quote);
    await logAudit({ user: req.user, action: 'INVOICES_GENERATED', entity: 'Quote', entityId: quote._id, newValue: { count: invoices.length } });
    res.json(invoices);
  } catch (err) { next(err); }
}

async function cancelRecurring(req, res, next) {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice || invoice.type !== 'recurring') return res.status(400).json({ message: 'Recurring invoice not found' });

    const refund = calculateProration(invoice);
    invoice.status = 'cancelled';
    invoice.proratedAmount = refund;
    await invoice.save();

    await logAudit({ user: req.user, action: 'SUBSCRIPTION_CANCELLED', entity: 'Invoice', entityId: invoice._id, newValue: { refund } });
    res.json({ invoice, refund });
  } catch (err) { next(err); }
}

module.exports = { getForQuote, generate, cancelRecurring };
