const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const ProductVariant = require('../models/ProductVariant');
const ProductVariantValue = require('../models/ProductVariantValue');
const { ROLES } = require('../config/roles');

// Fields safe to expose to a customer-role caller (no cost).
const CUSTOMER_SAFE_FIELDS = '-cost';

// Customers only ever see active products; internal staff can opt into
// inactive/all via ?status=inactive|all (default remains active-only).
function statusFilter(req) {
  const isCustomer = req.user?.role === ROLES.CUSTOMER;
  if (!isCustomer) {
    if (req.query.status === 'inactive') return { active: false };
    if (req.query.status === 'all') return {};
  }
  return { active: true };
}

async function assertValidCategory(name) {
  const category = await ProductCategory.findOne({ name, active: true });
  if (!category) {
    const err = new Error(`Unknown or inactive category: ${name}`);
    err.status = 400;
    throw err;
  }
}

async function list(req, res, next) {
  try {
    const isCustomer = req.user?.role === ROLES.CUSTOMER;
    const query = Product.find(statusFilter(req));
    if (isCustomer) query.select(CUSTOMER_SAFE_FIELDS);
    res.json(await query.sort({ category: 1, name: 1 }));
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const isCustomer = req.user?.role === ROLES.CUSTOMER;
    const query = Product.findById(req.params.id);
    if (isCustomer) query.select(CUSTOMER_SAFE_FIELDS);
    const p = await query;
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    if (req.body.category) await assertValidCategory(req.body.category);
    res.status(201).json(await Product.create(req.body));
  } catch (err) {
    if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (req.body.category) await assertValidCategory(req.body.category);
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) {
    if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    const variantIds = (await ProductVariant.find({ product: p._id }).select('_id')).map((v) => v._id);
    await ProductVariantValue.deleteMany({ variant: { $in: variantIds } });
    await ProductVariant.deleteMany({ product: p._id });
    await p.deleteOne();
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
