const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');

function statusFilter(req) {
  if (req.query.status === 'inactive') return { active: false };
  if (req.query.status === 'all') return {};
  return { active: true };
}

async function list(req, res, next) {
  try { res.json(await ProductCategory.find(statusFilter(req)).sort({ name: 1 })); } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const c = await ProductCategory.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Category not found' });
    res.json(c);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const existing = await ProductCategory.findOne({ name: req.body.name });
    if (existing) return res.status(409).json({ message: 'Category name already exists' });
    res.status(201).json(await ProductCategory.create(req.body));
  } catch (err) {
    if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const c = await ProductCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ message: 'Category not found' });
    res.json(c);
  } catch (err) {
    if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const c = await ProductCategory.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Category not found' });
    const inUse = await Product.exists({ category: c.name });
    if (inUse) return res.status(409).json({ message: 'Cannot delete a category that is still assigned to products' });
    await c.deleteOne();
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
