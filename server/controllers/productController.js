const Product = require('../models/Product');

// Fields safe to expose to a customer-role caller (no cost).
const CUSTOMER_SAFE_FIELDS = '-cost';

async function list(req, res, next) {
  try {
    const isCustomer = req.user?.role === 'customer';
    const query = Product.find({ active: true });
    if (isCustomer) query.select(CUSTOMER_SAFE_FIELDS);
    res.json(await query.sort({ category: 1, name: 1 }));
  } catch (err) { next(err); }
}
async function getOne(req, res, next) {
  try {
    const isCustomer = req.user?.role === 'customer';
    const query = Product.findById(req.params.id);
    if (isCustomer) query.select(CUSTOMER_SAFE_FIELDS);
    const p = await query;
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) { next(err); }
}
async function create(req, res, next) {
  try { res.status(201).json(await Product.create(req.body)); } catch (err) { next(err); }
}
async function update(req, res, next) {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update };
