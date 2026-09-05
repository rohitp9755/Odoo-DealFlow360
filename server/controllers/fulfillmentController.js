const Quote = require('../models/Quote');
const Fulfillment = require('../models/Fulfillment');
const { allocateQuote } = require('../services/warehouseEngine');
const { logAudit } = require('../services/auditService');

async function getForQuote(req, res, next) {
  try {
    const fulfillment = await Fulfillment.findOne({ quote: req.params.quoteId }).populate('allocations.warehouse allocations.product backorders.product');
    if (!fulfillment) return res.json(null);
    res.json(fulfillment);
  } catch (err) { next(err); }
}

async function allocate(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.quoteId);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const result = await allocateQuote(quote);
    const fulfillment = await Fulfillment.findOneAndUpdate(
      { quote: quote._id },
      { ...result, overridden: false },
      { upsert: true, new: true }
    );

    await logAudit({ user: req.user, action: 'WAREHOUSE_ALLOCATED', entity: 'Fulfillment', entityId: fulfillment._id, newValue: result });
    res.json(fulfillment);
  } catch (err) { next(err); }
}

// Manual override actually persists — per spec this must call the backend, not just the UI.
async function override(req, res, next) {
  try {
    const { allocations } = req.body; // [{ warehouse, product, quantity, shippingCost }]
    const fulfillment = await Fulfillment.findOneAndUpdate(
      { quote: req.params.quoteId },
      {
        allocations,
        overridden: true,
        totalShippingCost: allocations.reduce((s, a) => s + (a.shippingCost || 0), 0),
        shipmentCount: new Set(allocations.map(a => String(a.warehouse))).size
      },
      { upsert: true, new: true }
    );

    await logAudit({ user: req.user, action: 'WAREHOUSE_OVERRIDE', entity: 'Fulfillment', entityId: fulfillment._id, newValue: { allocations } });
    res.json(fulfillment);
  } catch (err) { next(err); }
}

module.exports = { getForQuote, allocate, override };
