const Quote = require('../models/Quote');
const Customer = require('../models/Customer');
const DealHealth = require('../models/DealHealth');
const { computeDealHealth } = require('../services/dealHealthEngine');

async function getHealth(req, res, next) {
  try {
    const health = await DealHealth.findOne({ quote: req.params.id });
    if (!health) return res.json(null);
    res.json(health);
  } catch (err) { next(err); }
}

async function recalculate(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    const customer = await Customer.findById(quote.customer);

    const result = await computeDealHealth(quote, customer);
    const health = await DealHealth.findOneAndUpdate(
      { quote: quote._id },
      { score: result.score, status: result.status, factors: result.factors, $push: { alerts: { $each: result.alerts } } },
      { upsert: true, new: true }
    );
    res.json(health);
  } catch (err) { next(err); }
}

module.exports = { getHealth, recalculate };
