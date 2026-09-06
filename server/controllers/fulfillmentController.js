const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const Warehouse = require('../models/Warehouse');
const Fulfillment = require('../models/Fulfillment');
const { allocateQuote } = require('../services/warehouseEngine');
const { consumeAllocations, restoreAllocations } = require('../services/inventoryService');
const { logAudit } = require('../services/auditService');
const { ROLES } = require('../config/roles');
const eventBus = require('../events/eventBus');

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function getForQuote(req, res, next) {
  try {
    const fulfillment = await Fulfillment.findOne({ quote: req.params.quoteId }).populate('allocations.warehouse allocations.product backorders.product originalAllocations.warehouse originalAllocations.product');
    if (!fulfillment) return res.json(null);
    res.json(fulfillment);
  } catch (err) { next(err); }
}

// Recomputes and commits a warehouse allocation for a quote. Transactional and
// safe to call more than once: any stock previously consumed by an earlier
// allocation/override for this quote is restored before the new plan is
// computed and consumed, so re-allocating never double-books inventory, and
// concurrent allocate/override calls for different quotes competing for the
// same stock are serialized by the underlying conditional decrement.
async function allocate(req, res, next) {
  const session = await mongoose.startSession();
  try {
    let fulfillment;
    await session.withTransaction(async () => {
      const quote = await Quote.findById(req.params.quoteId).session(session);
      if (!quote) {
        const err = new Error('Quote not found');
        err.status = 404;
        throw err;
      }

      const existing = await Fulfillment.findOne({ quote: quote._id }).session(session);
      if (existing?.allocations?.length) {
        await restoreAllocations(existing.allocations, session);
      }

      const result = await allocateQuote(quote, session);
      await consumeAllocations(result.allocations, session);

      fulfillment = await Fulfillment.findOneAndUpdate(
        { quote: quote._id },
        {
          allocations: result.allocations,
          backorders: result.backorders,
          totalShippingCost: result.totalShippingCost,
          shipmentCount: result.shipmentCount,
          overridden: false,
          originalAllocations: [],
          overriddenBy: null,
          overriddenAt: null,
          overrideReason: null
        },
        { upsert: true, new: true, session }
      );
    });

    await logAudit({
      user: req.user, action: 'WAREHOUSE_ALLOCATED', entity: 'Fulfillment', entityId: fulfillment._id,
      newValue: { allocations: fulfillment.allocations, backorders: fulfillment.backorders }
    });
    
    // Note: quote is defined inside the transaction, but we need it here.
    // However, it's out of scope. Let's just fetch it again to be safe.
    const quoteForEvent = await Quote.findById(req.params.quoteId);
    if (quoteForEvent) {
      eventBus.broadcast('fulfillment.created', fulfillment, {
        roles: [ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN],
        users: [quoteForEvent.rep]
      });
      if (fulfillment.backorders && fulfillment.backorders.length > 0) {
        eventBus.broadcast('backorder.created', fulfillment, {
          roles: [ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN],
          users: [quoteForEvent.rep]
        });
      }
    }

    res.json(fulfillment);
  } catch (err) { next(err); } finally {
    await session.endSession();
  }
}

// Manual override that actually persists and moves real inventory — not just a
// UI reshuffle. Validates every warehouse exists and that no line requests
// more than is currently available, restores whatever the fulfillment
// previously held, then atomically consumes the operator-specified plan.
// Preserves the last system recommendation the first time an override is
// applied, and records who/when/why for audit purposes.
async function override(req, res, next) {
  const session = await mongoose.startSession();
  try {
    const { allocations, reason } = req.body;
    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ message: 'allocations must be a non-empty array' });
    }
    for (const a of allocations) {
      if (!a.warehouse || !a.product || !(Number(a.quantity) > 0)) {
        return res.status(400).json({ message: 'Each allocation requires warehouse, product, and a positive quantity' });
      }
    }

    const quote = await Quote.findById(req.params.quoteId);
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const warehouseIds = [...new Set(allocations.map(a => String(a.warehouse)))];
    const warehouses = await Warehouse.find({ _id: { $in: warehouseIds } });
    if (warehouses.length !== warehouseIds.length) {
      return res.status(400).json({ message: 'One or more warehouses do not exist' });
    }
    const shippingCostByWarehouse = new Map(warehouses.map(w => [String(w._id), w.shippingCostPerUnit]));

    let fulfillment;
    await session.withTransaction(async () => {
      const existing = await Fulfillment.findOne({ quote: quote._id }).session(session);
      if (existing?.allocations?.length) {
        await restoreAllocations(existing.allocations, session);
      }

      const enrichedAllocations = allocations.map(a => ({
        warehouse: a.warehouse,
        product: a.product,
        quantity: Number(a.quantity),
        shippingCost: round2(Number(a.quantity) * (shippingCostByWarehouse.get(String(a.warehouse)) ?? 0))
      }));

      // Atomic + validated: throws 409 (aborting the transaction, restoring
      // nothing lost) if any line exceeds currently available stock.
      await consumeAllocations(enrichedAllocations, session);

      const backorders = computeRemainingBackorders(quote, enrichedAllocations);
      const preservedOriginal = existing?.originalAllocations?.length
        ? existing.originalAllocations
        : (existing?.allocations || []);

      fulfillment = await Fulfillment.findOneAndUpdate(
        { quote: quote._id },
        {
          allocations: enrichedAllocations,
          backorders,
          totalShippingCost: round2(enrichedAllocations.reduce((s, a) => s + a.shippingCost, 0)),
          shipmentCount: new Set(enrichedAllocations.map(a => String(a.warehouse))).size,
          overridden: true,
          originalAllocations: preservedOriginal,
          overriddenBy: req.user._id,
          overriddenAt: new Date(),
          overrideReason: reason || null
        },
        { upsert: true, new: true, session }
      );
    });

    await logAudit({
      user: req.user, action: 'WAREHOUSE_OVERRIDE', entity: 'Fulfillment', entityId: fulfillment._id,
      oldValue: { automaticAllocations: fulfillment.originalAllocations },
      newValue: { allocations: fulfillment.allocations },
      reason
    });
    
    eventBus.broadcast('fulfillment.updated', fulfillment, {
      roles: [ROLES.SALES_MANAGER, ROLES.FINANCE, ROLES.ADMIN],
      users: [quote.rep]
    });

    res.json(fulfillment);
  } catch (err) { next(err); } finally {
    await session.endSession();
  }
}

// Whatever the operator didn't manually allocate for a line is still owed —
// recorded as a backorder rather than silently dropped.
function computeRemainingBackorders(quote, allocations) {
  const allocatedByProduct = new Map();
  for (const a of allocations) {
    const key = String(a.product);
    allocatedByProduct.set(key, (allocatedByProduct.get(key) || 0) + a.quantity);
  }

  const backorders = [];
  for (const line of quote.lines) {
    const key = String(line.product);
    const allocated = allocatedByProduct.get(key) || 0;
    const remaining = line.quantity - allocated;
    if (remaining > 0) {
      backorders.push({ product: line.product, quantity: remaining, status: 'open' });
    }
  }
  return backorders;
}

module.exports = { getForQuote, allocate, override };
