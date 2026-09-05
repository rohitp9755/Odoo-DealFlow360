const Customer = require('../models/Customer');

async function list(req, res, next) {
  try { res.json(await Customer.find().sort({ name: 1 })); } catch (err) { next(err); }
}
async function getOne(req, res, next) {
  try {
    const c = await Customer.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    res.json(c);
  } catch (err) { next(err); }
}
async function create(req, res, next) {
  try { res.status(201).json(await Customer.create(req.body)); } catch (err) { next(err); }
}
async function update(req, res, next) {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    res.json(c);
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update };
