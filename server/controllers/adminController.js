const mongoose = require('mongoose');
const DiscountTier = require('../models/DiscountTier');
const DiscountRule = require('../models/DiscountRule');
const ApprovalRule = require('../models/ApprovalRule');
const Warehouse = require('../models/Warehouse');
const WarehouseStock = require('../models/WarehouseStock');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const UpsellRule = require('../models/UpsellRule');
const { consolidateBackorders } = require('../services/warehouseEngine');
const { logAudit } = require('../services/auditService');

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
// If this raises the quantity, any open backorders for the same product
// (across all quotes' fulfillments) are re-checked and consolidated against
// the newly available stock, oldest first — done transactionally so a
// concurrent allocation can't consume the same restocked units twice.
async function setStock(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { warehouse, product, quantity } = req.body;
    if (!warehouse || !product) return res.status(400).json({ message: 'warehouse and product are required' });
    if (!(Number(quantity) >= 0)) return res.status(400).json({ message: 'quantity must be a non-negative number' });

    let row, consolidated = [];
    await session.withTransaction(async () => {
      const existing = await WarehouseStock.findOne({ warehouse, product }).session(session);
      const oldQuantity = existing?.quantity ?? 0;

      row = await WarehouseStock.findOneAndUpdate(
        { warehouse, product },
        { quantity },
        { upsert: true, new: true, session, runValidators: true }
      );

      if (Number(quantity) > oldQuantity) {
        consolidated = await consolidateBackorders(product, session);
      }
    });

    if (consolidated.length > 0) {
      await logAudit({
        user: req.user, action: 'BACKORDER_CONSOLIDATED', entity: 'WarehouseStock', entityId: row._id,
        newValue: { consolidated }
      });
    }

    res.json({ ...row.toObject(), backordersConsolidated: consolidated });
  } catch (err) { next(err); } finally {
    await session.endSession();
  }
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
