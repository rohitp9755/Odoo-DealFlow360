// Integration tests for the auth feature: signup (internal + customer), login,
// current-user endpoint, and role-based authorization on real protected routes.
// Runs against the same MongoDB the app uses (server/.env) — all data created
// here is namespaced under a unique test email suffix and deleted afterward.
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, disconnectTestDB } = require('./helpers/db');
const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');
const { ROLES } = require('../config/roles');

const RUN_ID = Date.now();
const EMAIL_SUFFIX = `@auth-test-${RUN_ID}.local`;
const email = (local) => `${local}${EMAIL_SUFFIX}`;

let server;
let baseUrl;

async function postJSON(path, body, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function getJSON(path, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

test.before(async () => {
  await connectTestDB();
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;
});

test.after(async () => {
  await User.deleteMany({ email: { $regex: `${EMAIL_SUFFIX}$` } });
  await Customer.deleteMany({ name: { $regex: `^Auth Test Customer ${RUN_ID}` } });
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
});

test('POST /auth/register creates an internal user with a hashed password', async () => {
  const { status, data } = await postJSON('/auth/register', {
    name: 'Test Rep', email: email('rep'), password: 'password123', role: ROLES.SALES_REP
  });
  assert.equal(status, 201);
  assert.ok(data.token);
  assert.equal(data.user.role, ROLES.SALES_REP);
  assert.equal(data.user.password, undefined);

  const stored = await User.findOne({ email: email('rep') });
  assert.notEqual(stored.password, 'password123');
  assert.ok(await stored.comparePassword('password123'));
});

test('POST /auth/register rejects role=CUSTOMER (must use register-customer)', async () => {
  const { status } = await postJSON('/auth/register', {
    name: 'Bad', email: email('badrole'), password: 'password123', role: ROLES.CUSTOMER
  });
  assert.equal(status, 400);
});

test('POST /auth/register rejects an unknown role', async () => {
  const { status } = await postJSON('/auth/register', {
    name: 'Bad', email: email('unknownrole'), password: 'password123', role: 'SUPERUSER'
  });
  assert.equal(status, 400);
});

test('POST /auth/register rejects a short password', async () => {
  const { status } = await postJSON('/auth/register', {
    name: 'Weak', email: email('weak'), password: '123', role: ROLES.ADMIN
  });
  assert.equal(status, 400);
});

test('POST /auth/register rejects an invalid email', async () => {
  const { status } = await postJSON('/auth/register', {
    name: 'Bad Email', email: 'not-an-email', password: 'password123', role: ROLES.ADMIN
  });
  assert.equal(status, 400);
});

test('POST /auth/register rejects a duplicate email', async () => {
  const payload = { name: 'Dup', email: email('dup'), password: 'password123', role: ROLES.FINANCE };
  const first = await postJSON('/auth/register', payload);
  assert.equal(first.status, 201);
  const second = await postJSON('/auth/register', payload);
  assert.equal(second.status, 409);
});

test('POST /auth/register-customer links a new user to an existing Customer', async () => {
  const customer = await Customer.create({ name: `Auth Test Customer ${RUN_ID} A`, tier: 'Bronze' });
  const { status, data } = await postJSON('/auth/register-customer', {
    name: 'Test Customer', email: email('customer'), password: 'password123', customerId: customer._id.toString()
  });
  assert.equal(status, 201);
  assert.equal(data.user.role, ROLES.CUSTOMER);
  assert.equal(data.user.customer, customer._id.toString());
});

test('POST /auth/register-customer 404s for an unknown customerId', async () => {
  const { status } = await postJSON('/auth/register-customer', {
    name: 'X', email: email('nocust'), password: 'password123', customerId: '507f1f77bcf86cd799439011'
  });
  assert.equal(status, 404);
});

test('POST /auth/register-customer 400s without a customerId', async () => {
  const { status } = await postJSON('/auth/register-customer', {
    name: 'X', email: email('missingcust'), password: 'password123'
  });
  assert.equal(status, 400);
});

test('POST /auth/login succeeds with correct credentials, fails with wrong password', async () => {
  await postJSON('/auth/register', {
    name: 'Login Test', email: email('login'), password: 'password123', role: ROLES.SALES_MANAGER
  });

  const good = await postJSON('/auth/login', { email: email('login'), password: 'password123' });
  assert.equal(good.status, 200);
  assert.ok(good.data.token);

  const bad = await postJSON('/auth/login', { email: email('login'), password: 'wrong-password' });
  assert.equal(bad.status, 401);
});

test('POST /auth/login fails for an unknown email', async () => {
  const { status } = await postJSON('/auth/login', { email: email('nobody'), password: 'password123' });
  assert.equal(status, 401);
});

test('a deactivated user cannot log in', async () => {
  const { data } = await postJSON('/auth/register', {
    name: 'Inactive', email: email('inactive'), password: 'password123', role: ROLES.FINANCE
  });
  await User.findByIdAndUpdate(data.user.id, { active: false });

  const { status } = await postJSON('/auth/login', { email: email('inactive'), password: 'password123' });
  assert.equal(status, 401);
});

test('GET /auth/me requires a token and returns the current user without the password', async () => {
  const noAuth = await getJSON('/auth/me');
  assert.equal(noAuth.status, 401);

  const reg = await postJSON('/auth/register', {
    name: 'Me Test', email: email('me'), password: 'password123', role: ROLES.ADMIN
  });

  const me = await getJSON('/auth/me', reg.data.token);
  assert.equal(me.status, 200);
  assert.equal(me.data.user.email, email('me'));
  assert.equal(me.data.user.password, undefined);
});

test('RBAC: SALES_REP is forbidden from an ADMIN-only route, ADMIN is allowed', async () => {
  const rep = await postJSON('/auth/register', {
    name: 'RBAC Rep', email: email('rbac-rep'), password: 'password123', role: ROLES.SALES_REP
  });
  const admin = await postJSON('/auth/register', {
    name: 'RBAC Admin', email: email('rbac-admin'), password: 'password123', role: ROLES.ADMIN
  });

  const forbidden = await getJSON('/admin/warehouses', rep.data.token);
  assert.equal(forbidden.status, 403);

  const allowed = await getJSON('/admin/warehouses', admin.data.token);
  assert.equal(allowed.status, 200);
});

test('RBAC: CUSTOMER cannot access the internal /customers route', async () => {
  const customer = await Customer.create({ name: `Auth Test Customer ${RUN_ID} B`, tier: 'Bronze' });
  const reg = await postJSON('/auth/register-customer', {
    name: 'RBAC Customer', email: email('rbac-customer'), password: 'password123', customerId: customer._id.toString()
  });

  const { status } = await getJSON('/customers', reg.data.token);
  assert.equal(status, 403);
});

test('RBAC: an internal role cannot access the customer portal routes', async () => {
  const rep = await postJSON('/auth/register', {
    name: 'RBAC Rep Portal', email: email('rbac-rep-portal'), password: 'password123', role: ROLES.SALES_REP
  });
  const { status } = await getJSON('/portal/quotes', rep.data.token);
  assert.equal(status, 403);
});

test('a request with no token is rejected by a protected route', async () => {
  const { status } = await getJSON('/customers');
  assert.equal(status, 401);
});
