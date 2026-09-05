const PriceList = require('../models/PriceList');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

function filterFromQuery(req) {
  const filter = {};
  if (req.query.tier) filter.tier = req.query.tier;
  if (req.query.product) filter.product = req.query.product;
  if (req.query.currency) filter.currency = req.query.currency;
  if (req.query.status === 'active') filter.active = true;
  else if (req.query.status === 'inactive') filter.active = false;
  return filter;
}

function normalizeConflictError(err) {
  if (err.code === 11000) {
    err.status = 409;
    err.message = 'A price already exists for this tier, product, and currency — update it instead';
  } else if (err.name === 'ValidationError') {
    err.status = 400;
  }
  return err;
}

async function list(req, res, next) {
  try {
    const rows = await PriceList.find(filterFromQuery(req)).populate('product', 'name category price').sort({ tier: 1, currency: 1 });
    res.json(rows);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const row = await PriceList.findById(req.params.id).populate('product', 'name category price');
    if (!row) return res.status(404).json({ message: 'Price list entry not found' });
    res.json(row);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const product = await Product.findById(req.body.product);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(201).json(await PriceList.create(req.body));
  } catch (err) { next(normalizeConflictError(err)); }
}

async function update(req, res, next) {
  try {
    const row = await PriceList.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ message: 'Price list entry not found' });
    res.json(row);
  } catch (err) { next(normalizeConflictError(err)); }
}

async function remove(req, res, next) {
  try {
    const row = await PriceList.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ message: 'Price list entry not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Given a customer and product, resolve the applicable selling price:
// an active tier-specific price list entry for the requested currency,
// falling back to the product's base price (assumed to be in INR).
async function applicablePrice(req, res, next) {
  try {
    const { customer: customerId, product: productId } = req.query;
    const currency = (req.query.currency || 'INR').toUpperCase();
    if (!customerId || !productId) {
      return res.status(400).json({ message: 'customer and product are required' });
    }

    const [customer, product] = await Promise.all([
      Customer.findById(customerId).catch(() => null),
      Product.findById(productId).catch(() => null)
    ]);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const override = await PriceList.findOne({ tier: customer.tier, product: productId, currency, active: true });
    if (override) {
      return res.json({
        price: override.price,
        currency,
        tier: customer.tier,
        source: 'price_list',
        priceListId: override._id
      });
    }

    if (currency !== 'INR') {
      return res.status(404).json({ message: `No active ${currency} price list entry for this tier and product` });
    }

    res.json({ price: product.price, currency: 'INR', tier: customer.tier, source: 'base_price' });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove, applicablePrice };
