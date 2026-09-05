const Customer = require('../models/Customer');
const User = require('../models/User');
const Quote = require('../models/Quote');
const { ROLES } = require('../config/roles');
const { logAudit } = require('../services/auditService');

// assignedRep must reference an active internal user who can own a book of business.
async function assertValidRep(repId) {
  if (repId === undefined) return;
  if (!repId) return;
  const rep = await User.findById(repId);
  if (!rep || !rep.active || ![ROLES.SALES_REP, ROLES.SALES_MANAGER].includes(rep.role)) {
    const err = new Error('assignedRep must reference an active sales rep or sales manager');
    err.status = 400;
    throw err;
  }
}

function normalizeBody(body) {
  const normalized = { ...body };
  if (normalized.assignedRep === '') normalized.assignedRep = null;
  return normalized;
}

// Populates the "assigned sales representative" picker on the customer form.
async function listSalesReps(req, res, next) {
  try {
    const reps = await User.find({ role: { $in: [ROLES.SALES_REP, ROLES.SALES_MANAGER] }, active: true })
      .select('name email role')
      .sort({ name: 1 });
    res.json(reps);
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.tier) filter.tier = req.query.tier;
    if (req.query.assignedRep) filter.assignedRep = req.query.assignedRep;
    const customers = await Customer.find(filter).populate('assignedRep', 'name email role').sort({ name: 1 });
    res.json(customers);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const c = await Customer.findById(req.params.id).populate('assignedRep', 'name email role');
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    res.json(c);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const body = normalizeBody(req.body);
    await assertValidRep(body.assignedRep);

    const customer = await Customer.create(body);
    await logAudit({
      user: req.user, action: 'CUSTOMER_CREATED', entity: 'Customer',
      entityId: customer._id, newValue: customer.toObject()
    });
    res.status(201).json(customer);
  } catch (err) {
    if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const body = normalizeBody(req.body);
    await assertValidRep(body.assignedRep);

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const oldValue = customer.toObject();

    Object.assign(customer, body);
    await customer.save();

    if (oldValue.tier !== customer.tier) {
      await logAudit({
        user: req.user, action: 'CUSTOMER_TIER_CHANGED', entity: 'Customer', entityId: customer._id,
        oldValue: { tier: oldValue.tier }, newValue: { tier: customer.tier },
        reason: 'Tier change affects price calculation, discount governance and approval routing.'
      });
    }
    await logAudit({
      user: req.user, action: 'CUSTOMER_UPDATED', entity: 'Customer',
      entityId: customer._id, oldValue, newValue: customer.toObject()
    });
    res.json(customer);
  } catch (err) {
    if (err.name === 'ValidationError') err.status = 400;
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const quoteCount = await Quote.countDocuments({ customer: customer._id });
    if (quoteCount > 0) {
      return res.status(400).json({ message: 'Cannot delete a customer with existing quotes. Set status to inactive instead.' });
    }

    await customer.deleteOne();
    await logAudit({
      user: req.user, action: 'CUSTOMER_DELETED', entity: 'Customer',
      entityId: customer._id, oldValue: customer.toObject()
    });
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove, listSalesReps };
