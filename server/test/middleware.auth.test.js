// Pure unit tests for the auth/RBAC middleware — no DB, no network.
// User.findById is mocked via node:test's built-in mock support.
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-unit-tests';

const { requireAuth, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const { ROLES } = require('../config/roles');

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
}

test('requireAuth rejects a request with no token', async () => {
  const req = { headers: {} };
  const res = mockRes();
  let nextCalled = false;
  await requireAuth(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('requireAuth rejects an invalid/garbage token', async () => {
  const req = { headers: { authorization: 'Bearer not-a-real-token' } };
  const res = mockRes();
  let nextCalled = false;
  await requireAuth(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('requireAuth attaches req.user and calls next() for a valid token', async (t) => {
  const fakeUser = { _id: 'u1', role: ROLES.SALES_REP, active: true };
  t.mock.method(User, 'findById', () => ({ select: () => Promise.resolve(fakeUser) }));

  const token = jwt.sign({ id: 'u1', role: ROLES.SALES_REP }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  let nextCalled = false;
  await requireAuth(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.user, fakeUser);
});

test('requireAuth rejects a valid token for a user that no longer exists', async (t) => {
  t.mock.method(User, 'findById', () => ({ select: () => Promise.resolve(null) }));
  const token = jwt.sign({ id: 'gone' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  await requireAuth(req, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('requireAuth rejects a valid token for a deactivated user', async (t) => {
  t.mock.method(User, 'findById', () => ({ select: () => Promise.resolve({ _id: 'u2', active: false }) }));
  const token = jwt.sign({ id: 'u2' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  await requireAuth(req, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('requireRole allows a listed role through', () => {
  const guard = requireRole(ROLES.ADMIN, ROLES.SALES_MANAGER);
  const req = { user: { role: ROLES.ADMIN } };
  const res = mockRes();
  let called = false;
  guard(req, res, () => { called = true; });
  assert.equal(called, true);
});

test('requireRole blocks a role that is not listed', () => {
  const guard = requireRole(ROLES.ADMIN, ROLES.SALES_MANAGER);
  const req = { user: { role: ROLES.SALES_REP } };
  const res = mockRes();
  let called = false;
  guard(req, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
});

test('requireRole rejects when there is no authenticated user on the request', () => {
  const guard = requireRole(ROLES.ADMIN);
  const req = {};
  const res = mockRes();
  let called = false;
  guard(req, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
});
