// Integration tests for warehouse allocation, backorders, manual override, and
// backorder consolidation on restock. Covers the inventory-safety fix: stock is
// actually consumed (not just planned) atomically, re-allocation restores what
// it previously consumed before recomputing, and overrides are validated
// against real available quantity rather than trusted blindly.
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, disconnectTestDB } = require('./helpers/db');
const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Quote = require('../models/Quote');
const Warehouse = require('../models/Warehouse');
const WarehouseStock = require('../models/WarehouseStock');
const Fulfillment = require('../models/Fulfillment');
const { ROLES } = require('../config/roles');

const RUN_ID = Date.now();
const EMAIL_SUFFIX = `@fulfillment-test-${RUN_ID}.local`;
const email = (local) => `${local}${EMAIL_SUFFIX}`;
const NAME_PREFIX = `Fulfillment Test ${RUN_ID}`;

let server;
let baseUrl;
let repToken;
let adminToken;
let repUserId;
let customerDoc;
let productDoc;
let warehouseA;
let warehouseB;

async function postJSON(path, body, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function putJSON(path, body, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function makeQuote(quantity) {
  return Quote.create({
    customer: customerDoc._id,
    rep: repUserId,
    lines: [{ product: productDoc._id, quantity, unitPrice: 1000, unitCost: 600, subtotal: quantity * 1000, total: quantity * 1000, margin: quantity * 400, marginPercent: 40 }],
    subtotal: quantity * 1000, total: quantity * 1000, totalCost: quantity * 600, margin: quantity * 400, marginPercent: 40, stage: 'approved'
  });
}

test.before(async () => {
  await connectTestDB();
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;

  const rep = await postJSON('/auth/register', { name: 'Fulfillment Test Rep', email: email('rep'), password: 'password123', role: ROLES.SALES_REP });
  repToken = rep.data.token;
  repUserId = rep.data.user.id;
  const admin = await postJSON('/auth/register', { name: 'Fulfillment Test Admin', email: email('admin'), password: 'password123', role: ROLES.ADMIN });
  adminToken = admin.data.token;

  customerDoc = await Customer.create({ name: `${NAME_PREFIX} Customer`, tier: 'Gold' });
  productDoc = await Product.create({ name: `${NAME_PREFIX} Product`, category: 'Hardware', price: 1000, cost: 600 });

  [warehouseA, warehouseB] = await Warehouse.insertMany([
    { name: `${NAME_PREFIX} Warehouse A`, shippingCostPerUnit: 10 },
    { name: `${NAME_PREFIX} Warehouse B`, shippingCostPerUnit: 50 }
  ]);
});

test.after(async () => {
  await User.deleteMany({ email: { $regex: `${EMAIL_SUFFIX}$` } });
  await Fulfillment.deleteMany({});
  await Quote.deleteMany({ rep: repUserId });
  await WarehouseStock.deleteMany({ warehouse: { $in: [warehouseA._id, warehouseB._id] } });
  await Warehouse.deleteMany({ name: { $regex: `^${NAME_PREFIX}` } });
  await Customer.deleteMany({ name: { $regex: `^${NAME_PREFIX}` } });
  await Product.deleteMany({ name: { $regex: `^${NAME_PREFIX}` } });
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
});

test('allocation splits across warehouses (cheapest shipping first) and actually decrements stock', async () => {
  await WarehouseStock.deleteMany({ product: productDoc._id });
  await WarehouseStock.insertMany([
    { warehouse: warehouseA._id, product: productDoc._id, quantity: 3 },
    { warehouse: warehouseB._id, product: productDoc._id, quantity: 5 }
  ]);

  const quote = await makeQuote(5);
  const { status, data } = await postJSON(`/fulfillment/${quote._id}/allocate`, {}, repToken);
  assert.equal(status, 200);

  const fromA = data.allocations.find((a) => a.warehouse === String(warehouseA._id));
  const fromB = data.allocations.find((a) => a.warehouse === String(warehouseB._id));
  assert.equal(fromA.quantity, 3, 'cheaper warehouse A should be exhausted first');
  assert.equal(fromB.quantity, 2, 'remaining 2 units should come from warehouse B');
  assert.equal(data.backorders.length, 0);

  const stockA = await WarehouseStock.findOne({ warehouse: warehouseA._id, product: productDoc._id });
  const stockB = await WarehouseStock.findOne({ warehouse: warehouseB._id, product: productDoc._id });
  assert.equal(stockA.quantity, 0, 'warehouse A stock must actually be decremented, not just planned');
  assert.equal(stockB.quantity, 3, 'warehouse B stock must actually be decremented, not just planned');
});

test('insufficient total stock creates a backorder for the shortfall', async () => {
  await WarehouseStock.deleteMany({ product: productDoc._id });
  await WarehouseStock.insertMany([{ warehouse: warehouseA._id, product: productDoc._id, quantity: 2 }]);

  const quote = await makeQuote(5);
  const { status, data } = await postJSON(`/fulfillment/${quote._id}/allocate`, {}, repToken);
  assert.equal(status, 200);
  assert.equal(data.allocations[0].quantity, 2);
  assert.equal(data.backorders.length, 1);
  assert.equal(data.backorders[0].quantity, 3);
  assert.equal(data.backorders[0].status, 'open');
});

test('re-allocating a quote restores previously consumed stock before recomputing (no double-consumption)', async () => {
  await WarehouseStock.deleteMany({ product: productDoc._id });
  await WarehouseStock.insertMany([{ warehouse: warehouseA._id, product: productDoc._id, quantity: 4 }]);

  const quote = await makeQuote(4);
  await postJSON(`/fulfillment/${quote._id}/allocate`, {}, repToken);
  let stock = await WarehouseStock.findOne({ warehouse: warehouseA._id, product: productDoc._id });
  assert.equal(stock.quantity, 0);

  // Allocating again for the SAME quote/quantity must restore the 4 units it
  // already holds before consuming again, landing back at 0 — not -4.
  const second = await postJSON(`/fulfillment/${quote._id}/allocate`, {}, repToken);
  assert.equal(second.status, 200);
  stock = await WarehouseStock.findOne({ warehouse: warehouseA._id, product: productDoc._id });
  assert.equal(stock.quantity, 0);
});

test('manual override is rejected when it requests more than is actually available', async () => {
  await WarehouseStock.deleteMany({ product: productDoc._id });
  await WarehouseStock.insertMany([{ warehouse: warehouseA._id, product: productDoc._id, quantity: 2 }]);

  const quote = await makeQuote(2);
  const { status, data } = await postJSON(`/fulfillment/${quote._id}/override`, {
    allocations: [{ warehouse: warehouseA._id, product: productDoc._id, quantity: 10 }],
    reason: 'test over-allocation'
  }, repToken);

  assert.equal(status, 409);
  const stock = await WarehouseStock.findOne({ warehouse: warehouseA._id, product: productDoc._id });
  assert.equal(stock.quantity, 2, 'a rejected override must not touch stock at all');
  assert.equal(data.message.includes('Insufficient stock'), true);
});

test('manual override persists, consumes stock, and preserves the original automatic recommendation', async () => {
  await WarehouseStock.deleteMany({ product: productDoc._id });
  await WarehouseStock.insertMany([
    { warehouse: warehouseA._id, product: productDoc._id, quantity: 3 },
    { warehouse: warehouseB._id, product: productDoc._id, quantity: 3 }
  ]);

  const quote = await makeQuote(3);
  const auto = await postJSON(`/fulfillment/${quote._id}/allocate`, {}, repToken);
  assert.equal(auto.data.allocations.length, 1, 'with 3 in cheaper warehouse A, the automatic plan should not need warehouse B at all');

  const override = await postJSON(`/fulfillment/${quote._id}/override`, {
    allocations: [{ warehouse: warehouseB._id, product: productDoc._id, quantity: 3 }],
    reason: 'operator prefers warehouse B for this shipment'
  }, repToken);
  assert.equal(override.status, 200);
  assert.equal(override.data.overridden, true);
  assert.ok(override.data.overriddenBy, 'the acting user must be recorded on the override');
  assert.equal(override.data.overrideReason, 'operator prefers warehouse B for this shipment');
  assert.equal(override.data.originalAllocations.length, 1);
  assert.equal(override.data.originalAllocations[0].warehouse, String(warehouseA._id));

  const stockA = await WarehouseStock.findOne({ warehouse: warehouseA._id, product: productDoc._id });
  const stockB = await WarehouseStock.findOne({ warehouse: warehouseB._id, product: productDoc._id });
  assert.equal(stockA.quantity, 3, 'the automatic allocation from warehouse A must be restored when overridden');
  assert.equal(stockB.quantity, 0, 'the override must actually consume warehouse B stock');
});

test('restocking a product via admin consolidates open backorders oldest-first', async () => {
  await WarehouseStock.deleteMany({ product: productDoc._id });
  await Fulfillment.deleteMany({});
  await WarehouseStock.insertMany([{ warehouse: warehouseA._id, product: productDoc._id, quantity: 1 }]);

  const quote = await makeQuote(4);
  const allocate = await postJSON(`/fulfillment/${quote._id}/allocate`, {}, repToken);
  assert.equal(allocate.data.backorders[0].quantity, 3);

  const restock = await putJSON('/admin/warehouse-stock', { warehouse: warehouseA._id, product: productDoc._id, quantity: 5 }, adminToken);
  assert.equal(restock.status, 200);
  assert.equal(restock.data.backordersConsolidated.length, 1);
  assert.equal(restock.data.backordersConsolidated[0].fulfilledQty, 3);

  const fulfillment = await Fulfillment.findOne({ quote: quote._id });
  assert.equal(fulfillment.backorders[0].status, 'consolidated');
  assert.equal(fulfillment.backorders[0].quantity, 0);
  assert.equal(fulfillment.allocations.length, 2, 'a second allocation entry should be added for the consolidated units');

  const stock = await WarehouseStock.findOne({ warehouse: warehouseA._id, product: productDoc._id });
  assert.equal(stock.quantity, 2, '5 restocked - 3 consumed by consolidation = 2 remaining');
});
