// Integration tests for Customer Management: CRUD endpoints, RBAC, field
// validation, and the fact that customer.tier is consumed downstream by
// discountEngine (price calculation / discount governance / approval routing).
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, disconnectTestDB } = require('./helpers/db');
const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { ROLES } = require('../config/roles');
const { getTierAutonomousDiscount } = require('../services/discountEngine');

const RUN_ID = Date.now();
const EMAIL_SUFFIX = `@customer-test-${RUN_ID}.local`;
const email = (local) => `${local}${EMAIL_SUFFIX}`;
const CUSTOMER_NAME_PREFIX = `Customer Mgmt Test ${RUN_ID}`;

let server;
let baseUrl;
let adminToken;
let repToken;
let repUserId;

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

async function getJSON(path, token) {
  const res = await fetch(`${baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function delJSON(path, token) {
  const res = await fetch(`${baseUrl}${path}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status };
}

test.before(async () => {
  await connectTestDB();
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;

  const admin = await postJSON('/auth/register', { name: 'Cust Test Admin', email: email('admin'), password: 'password123', role: ROLES.ADMIN });
  adminToken = admin.data.token;

  const rep = await postJSON('/auth/register', { name: 'Cust Test Rep', email: email('rep'), password: 'password123', role: ROLES.SALES_REP });
  repToken = rep.data.token;
  repUserId = rep.data.user.id;
});

test.after(async () => {
  await User.deleteMany({ email: { $regex: `${EMAIL_SUFFIX}$` } });
  await Customer.deleteMany({ name: { $regex: `^${CUSTOMER_NAME_PREFIX}` } });
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
});

test('POST /customers creates a customer with full profile fields', async () => {
  const { status, data } = await postJSON('/customers', {
    name: `${CUSTOMER_NAME_PREFIX} Acme`,
    email: 'buyer@acme-test.example',
    phone: '+91-9000000001',
    tier: 'Gold',
    billingAddress: { street: '1 Test Rd', city: 'Mumbai', state: 'MH', postalCode: '400001', country: 'India' },
    shippingAddress: { street: '2 Test Rd', city: 'Mumbai', state: 'MH', postalCode: '400002', country: 'India' },
    shippingSameAsBilling: false,
    assignedRep: repUserId,
    status: 'active'
  }, adminToken);

  assert.equal(status, 201);
  assert.equal(data.tier, 'Gold');
  assert.equal(data.status, 'active');
  assert.equal(data.billingAddress.city, 'Mumbai');
  assert.equal(data.shippingAddress.postalCode, '400002');
  assert.equal(data.assignedRep, repUserId);
});

test('POST /customers rejects an assignedRep that is not a sales rep/manager', async () => {
  const finance = await postJSON('/auth/register', { name: 'Cust Test Finance', email: email('finance'), password: 'password123', role: ROLES.FINANCE });
  const { status } = await postJSON('/customers', {
    name: `${CUSTOMER_NAME_PREFIX} BadRep`, assignedRep: finance.data.user.id
  }, adminToken);
  assert.equal(status, 400);
});

test('POST /customers rejects an invalid email format', async () => {
  const { status } = await postJSON('/customers', {
    name: `${CUSTOMER_NAME_PREFIX} BadEmail`, email: 'not-an-email'
  }, adminToken);
  assert.equal(status, 400);
});

test('GET /customers/:id and GET /customers return the customer with assignedRep populated', async () => {
  const created = await postJSON('/customers', {
    name: `${CUSTOMER_NAME_PREFIX} Populate`, assignedRep: repUserId
  }, adminToken);

  const one = await getJSON(`/customers/${created.data._id}`, adminToken);
  assert.equal(one.status, 200);
  assert.equal(one.data.assignedRep.email, email('rep'));

  const list = await getJSON('/customers', adminToken);
  assert.equal(list.status, 200);
  assert.ok(list.data.some((c) => c._id === created.data._id));
});

test('PUT /customers/:id updates fields and changing tier is audit-logged (no error)', async () => {
  const created = await postJSON('/customers', { name: `${CUSTOMER_NAME_PREFIX} Update`, tier: 'Bronze' }, adminToken);
  const updated = await putJSON(`/customers/${created.data._id}`, { tier: 'Gold', status: 'inactive' }, repToken);
  assert.equal(updated.status, 200);
  assert.equal(updated.data.tier, 'Gold');
  assert.equal(updated.data.status, 'inactive');
});

test('DELETE /customers/:id is ADMIN-only and removes a customer with no quotes', async () => {
  const created = await postJSON('/customers', { name: `${CUSTOMER_NAME_PREFIX} Delete` }, adminToken);

  const forbidden = await delJSON(`/customers/${created.data._id}`, repToken);
  assert.equal(forbidden.status, 403);

  const ok = await delJSON(`/customers/${created.data._id}`, adminToken);
  assert.equal(ok.status, 204);

  const gone = await getJSON(`/customers/${created.data._id}`, adminToken);
  assert.equal(gone.status, 404);
});

test('customer.tier is consumed by the discount engine (governs autonomous discount)', async () => {
  const created = await postJSON('/customers', { name: `${CUSTOMER_NAME_PREFIX} TierConsumer`, tier: 'Gold' }, adminToken);
  const fromDb = await Customer.findById(created.data._id);
  const autonomousDiscount = await getTierAutonomousDiscount(fromDb.tier);
  assert.ok(typeof autonomousDiscount === 'number');
});

test('RBAC: CUSTOMER role cannot reach internal customer CRUD routes', async () => {
  const customer = await Customer.create({ name: `${CUSTOMER_NAME_PREFIX} PortalLink` });
  const reg = await postJSON('/auth/register-customer', {
    name: 'Portal User', email: email('portal'), password: 'password123', customerId: customer._id.toString()
  });
  const { status } = await getJSON('/customers', reg.data.token);
  assert.equal(status, 403);
});
