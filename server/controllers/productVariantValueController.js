const ProductVariantValue = require('../models/ProductVariantValue');
const ProductVariant = require('../models/ProductVariant');

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.variant) filter.variant = req.query.variant;
    res.json(await ProductVariantValue.find(filter).sort({ value: 1 }));
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const v = await ProductVariantValue.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Variant value not found' });
    res.json(v);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const variant = await ProductVariant.findById(req.body.variant);
    if (!variant) return res.status(404).json({ message: 'Variant not found' });
    res.status(201).json(await ProductVariantValue.create(req.body));
  } catch (err) {
    if (err.code === 11000) err.status = 409;
    else if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const v = await ProductVariantValue.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!v) return res.status(404).json({ message: 'Variant value not found' });
    res.json(v);
  } catch (err) {
    if (err.code === 11000) err.status = 409;
    else if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const v = await ProductVariantValue.findById(req.params.id);
    if (!v) return res.status(404).json({ message: 'Variant value not found' });
    await v.deleteOne();
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
