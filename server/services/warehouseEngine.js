// Warehouse allocation: for each line, greedily allocate from the warehouse(s)
// with the lowest shipping cost per unit first, splitting only when a single
// warehouse cannot fully cover the requested quantity. Anything left over
// becomes a backorder. Deterministic and explainable, not random.

const Warehouse = require('../models/Warehouse');
const WarehouseStock = require('../models/WarehouseStock');
const Fulfillment = require('../models/Fulfillment');
const { consumeAllocations } = require('./inventoryService');

async function allocateQuote(quote, session) {
  const allocations = [];
  const backorders = [];
  let totalShippingCost = 0;

  for (const line of quote.lines) {
    let remaining = line.quantity;

    const stocks = await WarehouseStock.find({ product: line.product, quantity: { $gt: 0 } })
      .session(session || null)
      .populate('warehouse');
    // Cheapest shipping first
    stocks.sort((a, b) => (a.warehouse?.shippingCostPerUnit ?? Infinity) - (b.warehouse?.shippingCostPerUnit ?? Infinity));

    for (const stock of stocks) {
      if (remaining <= 0) break;
      if (!stock.warehouse) continue;
      const take = Math.min(remaining, stock.quantity);
      if (take <= 0) continue;

      const shippingCost = take * stock.warehouse.shippingCostPerUnit;
      allocations.push({
        warehouse: stock.warehouse._id,
        product: line.product,
        quantity: take,
        shippingCost: round2(shippingCost)
      });
      totalShippingCost += shippingCost;
      remaining -= take;
    }

    if (remaining > 0) {
      backorders.push({ product: line.product, quantity: remaining, status: 'open' });
    }
  }

  return {
    allocations,
    backorders,
    totalShippingCost: round2(totalShippingCost),
    shipmentCount: new Set(allocations.map(a => String(a.warehouse))).size
  };
}

// Backorder consolidation: when a warehouse's stock for a product increases
// (restock/manual set), check whether existing open backorders for that
// product can now be (fully or partially) fulfilled, oldest fulfillment
// first. Consumes stock atomically via consumeAllocations so a concurrent
// allocation/override can never be double-fulfilled from the same units.
// Must be called inside the caller's transaction (session).
async function consolidateBackorders(productId, session) {
  const results = [];

  const fulfillments = await Fulfillment.find({
    'backorders.product': productId,
    'backorders.status': 'open'
  }).sort({ createdAt: 1 }).session(session || null);

  for (const fulfillment of fulfillments) {
    let touched = false;

    for (const backorder of fulfillment.backorders) {
      if (String(backorder.product) !== String(productId) || backorder.status !== 'open' || backorder.quantity <= 0) continue;

      const stocks = await WarehouseStock.find({ product: productId, quantity: { $gt: 0 } })
        .session(session || null)
        .populate('warehouse');
      stocks.sort((a, b) => (a.warehouse?.shippingCostPerUnit ?? Infinity) - (b.warehouse?.shippingCostPerUnit ?? Infinity));

      let remaining = backorder.quantity;
      const newAllocations = [];
      for (const stock of stocks) {
        if (remaining <= 0) break;
        if (!stock.warehouse) continue;
        const take = Math.min(remaining, stock.quantity);
        if (take <= 0) continue;
        newAllocations.push({
          warehouse: stock.warehouse._id,
          product: productId,
          quantity: take,
          shippingCost: round2(take * stock.warehouse.shippingCostPerUnit)
        });
        remaining -= take;
      }

      if (newAllocations.length === 0) continue;

      // Consumes atomically; throws (and this whole consolidation aborts with
      // the caller's transaction) if another concurrent writer beat us to it.
      await consumeAllocations(newAllocations, session);

      fulfillment.allocations.push(...newAllocations);
      fulfillment.totalShippingCost = round2(
        fulfillment.totalShippingCost + newAllocations.reduce((s, a) => s + a.shippingCost, 0)
      );
      fulfillment.shipmentCount = new Set(fulfillment.allocations.map(a => String(a.warehouse))).size;

      const fulfilledQty = backorder.quantity - remaining;
      backorder.quantity = remaining;
      if (remaining <= 0) backorder.status = 'consolidated';
      touched = true;

      results.push({ fulfillment: fulfillment._id, product: productId, fulfilledQty, remainingBackorder: remaining });
    }

    if (touched) await fulfillment.save({ session });
  }

  return results;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { allocateQuote, consolidateBackorders };
