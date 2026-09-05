const Quote = require('../models/Quote');
const { logAudit } = require('../services/auditService');
const { notify } = require('../services/notificationService');
const { ROLES } = require('../config/roles');

// Strips every field a customer must never see: cost, margin, risk, internal
// approval math. Only price, discount, and totals the customer negotiated remain.
function sanitizeQuote(quoteDoc) {
  const q = quoteDoc.toObject ? quoteDoc.toObject() : quoteDoc;
  return {
    _id: q._id,
    customer: q.customer,
    stage: q.stage,
    subtotal: q.subtotal,
    discountAmount: q.discountAmount,
    total: q.total,
    oneTimeTotal: q.oneTimeTotal,
    recurringTotal: q.recurringTotal,
    recurringCycle: q.recurringCycle,
    createdAt: q.createdAt,
    confirmedAt: q.confirmedAt,
    lines: q.lines.map(l => ({
      product: l.product,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineDiscount: l.lineDiscount,
      subtotal: l.subtotal,
      discountAmount: l.discountAmount,
      total: l.total
    }))
  };
}

async function myQuotes(req, res, next) {
  try {
    if (!req.user.customer) return res.status(403).json({ message: 'No linked customer account' });
    const quotes = await Quote.find({ customer: req.user.customer }).populate('lines.product', 'name category').sort({ createdAt: -1 });
    res.json(quotes.map(sanitizeQuote));
  } catch (err) { next(err); }
}

async function getQuote(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.id).populate('lines.product', 'name category');
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    if (req.user.role === ROLES.CUSTOMER && String(quote.customer) !== String(req.user.customer)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(sanitizeQuote(quote));
  } catch (err) { next(err); }
}

async function confirmQuote(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    if (String(quote.customer) !== String(req.user.customer)) return res.status(403).json({ message: 'Forbidden' });
    if (!['sent', 'under_negotiation', 'approved'].includes(quote.stage)) {
      return res.status(400).json({ message: `Quote cannot be confirmed from stage '${quote.stage}'` });
    }

    quote.stage = 'confirmed';
    quote.confirmedAt = new Date();
    await quote.save();

    await logAudit({ user: req.user, action: 'QUOTE_CONFIRMED_BY_CUSTOMER', entity: 'Quote', entityId: quote._id });
    await notify({
      recipients: [quote.rep],
      type: 'QUOTE_CONFIRMED',
      message: `Customer confirmed quote ${quote._id}.`,
      entity: 'Quote',
      entityId: quote._id
    });
    res.json(sanitizeQuote(quote));
  } catch (err) { next(err); }
}

module.exports = { myQuotes, getQuote, confirmQuote, sanitizeQuote };
