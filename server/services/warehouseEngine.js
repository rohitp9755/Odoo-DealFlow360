// Warehouse allocation: for each line, greedily allocate from the warehouse(s)
// with the lowest shipping cost per unit first, splitting only when a single
// warehouse cannot fully cover the requested quantity. Anything left over
// becomes a backorder. Deterministic and explainable, not random.

const Warehouse = require('../models/Warehouse');
const WarehouseStock = require('../models/WarehouseStock');

async function allocateQuote(quote) {
  const allocations = [];
  const backorders = [];
  let totalShippingCost = 0;

  for (const line of quote.lines) {
    let remaining = line.quantity;

    const stocks = await WarehouseStock.find({ product: line.product, quantity: { $gt: 0 } }).populate('warehouse');
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

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { allocateQuote };
