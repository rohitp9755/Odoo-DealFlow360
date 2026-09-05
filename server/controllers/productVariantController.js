const ProductVariant = require('../models/ProductVariant');
const ProductVariantValue = require('../models/ProductVariantValue');
const Product = require('../models/Product');

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    res.json(await ProductVariant.find(filter).sort({ name: 1 }));
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const v = await ProductVariant.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Variant not found' });
    res.json(v);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const product = await Product.findById(req.body.product);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(201).json(await ProductVariant.create(req.body));
  } catch (err) {
    if (err.code === 11000) err.status = 409;
    else if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const v = await ProductVariant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!v) return res.status(404).json({ message: 'Variant not found' });
    res.json(v);
  } catch (err) {
    if (err.code === 11000) err.status = 409;
    else if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const v = await ProductVariant.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Variant not found' });
    await ProductVariantValue.deleteMany({ variant: v._id });
    await v.deleteOne();
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
