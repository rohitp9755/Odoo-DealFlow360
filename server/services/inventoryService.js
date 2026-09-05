// Atomic inventory consumption/restoration for warehouse fulfillment.
//
// WarehouseStock.quantity represents on-hand AVAILABLE stock (this schema has
// no separate reservation ledger). Consuming it here with a conditional
// decrement, inside the caller's transaction, is what prevents two concurrent
// allocation/override requests from oversubscribing the same units — the
// conditional filter (quantity >= requested) means MongoDB only applies the
// decrement if enough stock is still present at write time, and a concurrent
// transaction touching the same document will hit a write conflict and abort
// rather than silently double-allocate.

const WarehouseStock = require('../models/WarehouseStock');

// Decrements stock for each {warehouse, product, quantity} allocation, atomically
// and only if enough is available. Throws (409) if any single line can't be
// satisfied — the caller's transaction rolls back everything already consumed.
async function consumeAllocations(allocations, session) {
  for (const a of allocations || []) {
    const qty = Number(a.quantity);
    if (!(qty > 0)) continue;
    const updated = await WarehouseStock.findOneAndUpdate(
      { warehouse: a.warehouse, product: a.product, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { session, new: true }
    );
    if (!updated) {
      const err = new Error(`Insufficient stock for product ${a.product} at warehouse ${a.warehouse}`);
      err.status = 409;
      throw err;
    }
  }
}

// Restores previously-consumed allocations, e.g. before recomputing an
// automatic plan or replacing it with a manual override.
async function restoreAllocations(allocations, session) {
  for (const a of allocations || []) {
    const qty = Number(a.quantity);
    if (!(qty > 0)) continue;
    await WarehouseStock.findOneAndUpdate(
      { warehouse: a.warehouse, product: a.product },
      { $inc: { quantity: qty } },
      { session, upsert: true }
    );
  }
}

module.exports = { consumeAllocations, restoreAllocations };
