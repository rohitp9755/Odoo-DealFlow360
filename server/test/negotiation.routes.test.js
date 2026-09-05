// Security regression tests for negotiation ownership: negotiationRoutes.js has no
// role restriction (both the internal quote workspace and the customer portal chat
// hit the same routes), so ownership must be enforced per-request in the controller
// rather than trusted from the quoteId in the URL.
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, disconnectTestDB } = require('./helpers/db');
const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Quote = require('../models/Quote');
const Negotiation = require('../models/Negotiation');
const { ROLES } = require('../config/roles');

const RUN_ID = Date.now();
const EMAIL_SUFFIX = `@negotiation-test-${RUN_ID}.local`;
const email = (local) => `${local}${EMAIL_SUFFIX}`;
const NAME_PREFIX = `Negotiation Test ${RUN_ID}`;

let server;
let baseUrl;
let repToken;
let repUserId;
let customerAToken;
let customerBToken;
let quoteForA;

async function postJSON(path, body, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function getJSON(path, token) {
  const res = await fetch(`${baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

test.before(async () => {
  await connectTestDB();
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;

  const rep = await postJSON('/auth/register', { name: 'Negotiation Test Rep', email: email('rep'), password: 'password123', role: ROLES.SALES_REP });
  repToken = rep.data.token;
  repUserId = rep.data.user.id;

  const customerA = await Customer.create({ name: `${NAME_PREFIX} A`, tier: 'Gold' });
  const customerB = await Customer.create({ name: `${NAME_PREFIX} B`, tier: 'Bronze' });
  const product = await Product.create({ name: `${NAME_PREFIX} Product`, category: 'Hardware', price: 1000, cost: 600 });

  quoteForA = await Quote.create({
    customer: customerA._id, rep: repUserId,
    lines: [{ product: product._id, quantity: 1, unitPrice: 1000, unitCost: 600, subtotal: 1000, total: 1000, margin: 400, marginPercent: 40 }],
    subtotal: 1000, total: 1000, totalCost: 600, margin: 400, marginPercent: 40, stage: 'sent'
  });

  const regA = await postJSON('/auth/register-customer', { name: 'Buyer A', email: email('buyera'), password: 'password123', customerId: customerA._id.toString() });
  customerAToken = regA.data.token;
  const regB = await postJSON('/auth/register-customer', { name: 'Buyer B', email: email('buyerb'), password: 'password123', customerId: customerB._id.toString() });
  customerBToken = regB.data.token;
});

test.after(async () => {
  await User.deleteMany({ email: { $regex: `${EMAIL_SUFFIX}$` } });
  await Negotiation.deleteMany({ quote: quoteForA._id });
  await Quote.deleteMany({ rep: repUserId });
  await Customer.deleteMany({ name: { $regex: `^${NAME_PREFIX}` } });
  await Product.deleteMany({ name: { $regex: `^${NAME_PREFIX}` } });
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
});

test("a customer cannot read another customer's negotiation by guessing the quoteId", async () => {
  const { status } = await getJSON(`/negotiations/${quoteForA._id}`, customerBToken);
  assert.equal(status, 403);
});

test("a customer cannot send a negotiation message on another customer's quote", async () => {
  const { status } = await postJSON(`/negotiations/${quoteForA._id}/message`, { message: 'Can I get 20% off?' }, customerBToken);
  assert.equal(status, 403);
});

test("a customer cannot submit a counter-offer on another customer's quote", async () => {
  const { status } = await postJSON(`/negotiations/${quoteForA._id}/counter-offer`, { action: 'accept' }, customerBToken);
  assert.equal(status, 403);
});

test('the owning customer can read and negotiate on their own quote', async () => {
  const read = await getJSON(`/negotiations/${quoteForA._id}`, customerAToken);
  assert.equal(read.status, 200);

  const message = await postJSON(`/negotiations/${quoteForA._id}/message`, { message: 'Can I get 20% off?' }, customerAToken);
  assert.equal(message.status, 200);
});

test('an internal role (sales rep) can read the negotiation regardless of which customer owns it', async () => {
  const { status } = await getJSON(`/negotiations/${quoteForA._id}`, repToken);
  assert.equal(status, 200);
});

test('an unknown quoteId 404s rather than leaking a generic empty negotiation', async () => {
  const fakeId = '507f1f77bcf86cd799439011';
  const { status } = await getJSON(`/negotiations/${fakeId}`, repToken);
  assert.equal(status, 404);
});
