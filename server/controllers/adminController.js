const DiscountTier = require('../models/DiscountTier');
const DiscountRule = require('../models/DiscountRule');
const ApprovalRule = require('../models/ApprovalRule');
const Warehouse = require('../models/Warehouse');
const WarehouseStock = require('../models/WarehouseStock');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UpsellRule = require('../models/UpsellRule');

// Generic upsert-by-key helpers keep the admin UI simple: one PUT per config type.

async function getDiscountTiers(req, res, next) {
  try { res.json(await DiscountTier.find()); } catch (err) { next(err); }
}
async function upsertDiscountTier(req, res, next) {
  try {
    const { tier, autonomousDiscount } = req.body;
    const row = await DiscountTier.findOneAndUpdate({ tier }, { autonomousDiscount }, { upsert: true, new: true, runValidators: true });
    res.json(row);
  } catch (err) { next(err); }
}

async function getDiscountRules(req, res, next) {
  try { res.json(await DiscountRule.find()); } catch (err) { next(err); }
}
async function upsertDiscountRule(req, res, next) {
  try {
    const { category, ceilingDiscount } = req.body;
    const row = await DiscountRule.findOneAndUpdate({ category }, { ceilingDiscount }, { upsert: true, new: true, runValidators: true });
    res.json(row);
  } catch (err) { next(err); }
}

async function getApprovalRules(req, res, next) {
  try { res.json(await ApprovalRule.find().sort({ minDiscount: 1 })); } catch (err) { next(err); }
}
async function createApprovalRule(req, res, next) {
  try { res.status(201).json(await ApprovalRule.create(req.body)); } catch (err) { next(err); }
}
async function updateApprovalRule(req, res, next) {
  try {
    const row = await ApprovalRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(row);
  } catch (err) { next(err); }
}

async function getWarehouses(req, res, next) {
  try { res.json(await Warehouse.find()); } catch (err) { next(err); }
}
async function createWarehouse(req, res, next) {
  try { res.status(201).json(await Warehouse.create(req.body)); } catch (err) { next(err); }
}
async function updateWarehouse(req, res, next) {
  try { res.json(await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (err) { next(err); }
}
async function setStock(req, res, next) {
  try {
    const { warehouse, product, quantity } = req.body;
    const row = await WarehouseStock.findOneAndUpdate({ warehouse, product }, { quantity }, { upsert: true, new: true });
    res.json(row);
  } catch (err) { next(err); }
}
async function getStock(req, res, next) {
  try { res.json(await WarehouseStock.find().populate('warehouse product')); } catch (err) { next(err); }
}

async function getSubscriptionPlans(req, res, next) {
  try { res.json(await SubscriptionPlan.find()); } catch (err) { next(err); }
}
async function createSubscriptionPlan(req, res, next) {
  try { res.status(201).json(await SubscriptionPlan.create(req.body)); } catch (err) { next(err); }
}

async function getUpsellRules(req, res, next) {
  try { res.json(await UpsellRule.find().populate('baseProduct recommendedProduct')); } catch (err) { next(err); }
}
async function createUpsellRule(req, res, next) {
  try { res.status(201).json(await UpsellRule.create(req.body)); } catch (err) { next(err); }
}

module.exports = {
  getDiscountTiers, upsertDiscountTier,
  getDiscountRules, upsertDiscountRule,
  getApprovalRules, createApprovalRule, updateApprovalRule,
  getWarehouses, createWarehouse, updateWarehouse, setStock, getStock,
  getSubscriptionPlans, createSubscriptionPlan,
  getUpsellRules, createUpsellRule
};
