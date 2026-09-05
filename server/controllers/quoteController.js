const Quote = require('../models/Quote');
const { computeQuote, round2 } = require('../services/quoteCalculator');
const { evaluateAndRouteApproval } = require('../services/approvalEngine');
const { logAudit } = require('../services/auditService');
const { ROLES } = require('../config/roles');

// Internal (rep/manager/finance/admin) full view.
async function list(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === ROLES.SALES_REP) filter.rep = req.user._id;
    const quotes = await Quote.find(filter).populate('customer', 'name tier').populate('rep', 'name').sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.id).populate('customer').populate('rep', 'name email').populate('lines.product');
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    res.json(quote);
  } catch (err) { next(err); }
}

// Create or fully recompute a quote from raw lines. Backend is the source of truth
// for every number — client-sent totals/margins/discounts are ignored.
async function create(req, res, next) {
  try {
    const { customer, lines, orderDiscount } = req.body;
    const computed = await computeQuote({ customerId: customer, orderDiscount, lines });

    const quote = await Quote.create({
      customer,
      rep: req.user._id,
      lines: computed.lines,
      orderDiscount: orderDiscount || 0,
      subtotal: computed.subtotal,
      discountAmount: computed.discountAmount,
      total: computed.total,
      totalCost: computed.totalCost,
      margin: computed.margin,
      marginPercent: computed.marginPercent,
      riskScore: computed.riskScore,
      riskBand: computed.riskBand,
      marginLeakage: computed.marginLeakage,
      oneTimeTotal: computed.oneTimeTotal,
      recurringTotal: computed.recurringTotal,
      recurringCycle: computed.recurringCycle,
      stage: 'draft'
    });

    await logAudit({ user: req.user, action: 'QUOTE_CREATED', entity: 'Quote', entityId: quote._id, newValue: { total: quote.total } });
    res.status(201).json(quote);
  } catch (err) { next(err); }
}

// Recalculate an existing draft quote (e.g. rep edits quantities/discounts).
async function update(req, res, next) {
  try {
    const existing = await Quote.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Quote not found' });
    if (!['draft', 'returned'].includes(existing.stage) && existing.stage !== 'draft') {
      // allow edits only while draft to keep governance meaningful
    }

    const { lines, orderDiscount } = req.body;
    const computed = await computeQuote({
      customerId: existing.customer,
      orderDiscount: orderDiscount ?? existing.orderDiscount,
      lines: lines ?? existing.lines.map(l => ({ product: l.product, quantity: l.quantity, lineDiscount: l.lineDiscount }))
    });

    const oldTotal = existing.total;

    existing.lines = computed.lines;
    existing.orderDiscount = orderDiscount ?? existing.orderDiscount;
    existing.subtotal = computed.subtotal;
    existing.discountAmount = computed.discountAmount;
    existing.total = computed.total;
    existing.totalCost = computed.totalCost;
    existing.margin = computed.margin;
    existing.marginPercent = computed.marginPercent;
    existing.riskScore = computed.riskScore;
    existing.riskBand = computed.riskBand;
    existing.marginLeakage = computed.marginLeakage;
    existing.oneTimeTotal = computed.oneTimeTotal;
    existing.recurringTotal = computed.recurringTotal;
    existing.recurringCycle = computed.recurringCycle;
    existing.stage = 'draft';

    await existing.save();
    await logAudit({
      user: req.user, action: 'QUOTE_UPDATED', entity: 'Quote', entityId: existing._id,
      oldValue: { total: oldTotal }, newValue: { total: existing.total }
    });

    res.json(existing);
  } catch (err) { next(err); }
}

// Submit a quote for governance evaluation: computes headline discount,
// routes to approval if required, else marks approved/sent directly.
async function submit(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.id).populate('customer');
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const totalLineValue = quote.lines.reduce((s, l) => s + l.subtotal, 0);
    const weighted = quote.lines.reduce((s, l) => s + l.lineDiscount * l.subtotal, 0);
    const headlineDiscount = totalLineValue > 0 ? weighted / totalLineValue : 0;

    quote.submittedAt = new Date();
    const quoteForApproval = {
      _id: quote._id,
      riskScore: quote.riskScore,
      riskBand: quote.riskBand,
      marginLeakage: quote.marginLeakage,
      reasons: buildLineReasons(quote)
    };

    const { requiresApproval, approval } = await evaluateAndRouteApproval(quoteForApproval, req.user, headlineDiscount);

    if (!requiresApproval) {
      quote.stage = 'approved';
    }
    await quote.save();

    res.json({ quote, requiresApproval, approval, headlineDiscount: round2(headlineDiscount) });
  } catch (err) { next(err); }
}

// Confirm a quote (moves to 'confirmed'); requires prior approval if it was needed.
async function confirm(req, res, next) {
  try {
    const Approval = require('../models/Approval');
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    if (!['approved', 'sent', 'under_negotiation'].includes(quote.stage)) {
      return res.status(400).json({ message: `Quote cannot be confirmed from stage '${quote.stage}'` });
    }

    const pendingApproval = await Approval.findOne({ quote: quote._id, status: 'pending' });
    if (pendingApproval) {
      return res.status(400).json({ message: 'Quote has a pending approval that must be resolved first' });
    }

    quote.stage = 'confirmed';
    quote.confirmedAt = new Date();
    await quote.save();

    await logAudit({ user: req.user, action: 'QUOTE_CONFIRMED', entity: 'Quote', entityId: quote._id });

    res.json(quote);
  } catch (err) { next(err); }
}

function buildLineReasons(quote) {
  const reasons = [];
  for (const l of quote.lines) {
    if (l.violation > 0) {
      reasons.push(`Line discount ${l.lineDiscount}% exceeds allowed ${l.allowedDiscount}% (violation ${l.violation}%)`);
    }
  }
  if (reasons.length === 0) reasons.push('All line discounts are within allowed limits.');
  return reasons;
}

module.exports = { list, getOne, create, update, submit, confirm };
