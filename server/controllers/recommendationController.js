const Quote = require('../models/Quote');
const Recommendation = require('../models/Recommendation');
const { generateRecommendations } = require('../services/recommendationEngine');
const { computeQuote } = require('../services/quoteCalculator');
const { logAudit } = require('../services/auditService');

async function generate(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.quoteId);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const ranked = await generateRecommendations(quote);

    await Recommendation.deleteMany({ quote: quote._id, status: 'suggested' });
    const saved = await Recommendation.insertMany(ranked.map(r => ({
      quote: quote._id,
      product: r.product._id,
      score: r.score,
      reasons: r.reasons,
      expectedRevenue: r.expectedRevenue,
      expectedMargin: r.expectedMargin,
      status: 'suggested'
    })));

    res.json(saved.map((s, i) => ({ ...s.toObject(), product: ranked[i].product, inStock: ranked[i].inStock })));
  } catch (err) { next(err); }
}

async function listForQuote(req, res, next) {
  try {
    const recs = await Recommendation.find({ quote: req.params.quoteId, status: 'suggested' }).populate('product').sort({ score: -1 });
    res.json(recs);
  } catch (err) { next(err); }
}

// Adding a recommended product re-runs the full backend quote calculation —
// the "AI" never writes totals directly.
async function addToQuote(req, res, next) {
  try {
    const rec = await Recommendation.findById(req.params.id).populate('product');
    if (!rec) return res.status(404).json({ message: 'Recommendation not found' });

    const quote = await Quote.findById(rec.quote);
    const rawLines = quote.lines.map(l => ({ product: l.product, quantity: l.quantity, lineDiscount: l.lineDiscount }));
    rawLines.push({ product: rec.product._id, quantity: 1, lineDiscount: 0 });

    const computed = await computeQuote({ customerId: quote.customer, orderDiscount: quote.orderDiscount, lines: rawLines });

    quote.lines = computed.lines;
    quote.subtotal = computed.subtotal;
    quote.discountAmount = computed.discountAmount;
    quote.total = computed.total;
    quote.totalCost = computed.totalCost;
    quote.margin = computed.margin;
    quote.marginPercent = computed.marginPercent;
    quote.riskScore = computed.riskScore;
    quote.riskBand = computed.riskBand;
    quote.marginLeakage = computed.marginLeakage;
    quote.oneTimeTotal = computed.oneTimeTotal;
    quote.recurringTotal = computed.recurringTotal;
    quote.recurringCycle = computed.recurringCycle;
    await quote.save();

    rec.status = 'added';
    await rec.save();

    await logAudit({ user: req.user, action: 'RECOMMENDATION_ADDED', entity: 'Quote', entityId: quote._id, newValue: { product: rec.product._id } });

    res.json(quote);
  } catch (err) { next(err); }
}

async function dismiss(req, res, next) {
  try {
    const rec = await Recommendation.findByIdAndUpdate(req.params.id, { status: 'dismissed' }, { new: true });
    res.json(rec);
  } catch (err) { next(err); }
}

module.exports = { generate, listForQuote, addToQuote, dismiss };
