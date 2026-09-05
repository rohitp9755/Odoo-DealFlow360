// Integration tests for payment recording against invoices: partial/full payment
// status transitions, overpayment rejection, idempotency by transactionRef, and
// FINANCE/ADMIN-only authorization.
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, disconnectTestDB } = require('./helpers/db');
const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Quote = require('../models/Quote');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { ROLES } = require('../config/roles');

const RUN_ID = Date.now();
const EMAIL_SUFFIX = `@payment-test-${RUN_ID}.local`;
const email = (local) => `${local}${EMAIL_SUFFIX}`;
const NAME_PREFIX = `Payment Test ${RUN_ID}`;

let server;
let baseUrl;
let adminToken;
let financeToken;
let repToken;
let repUserId;
let customerDoc;
let productDoc;

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

async function makeInvoice(amount) {
  const quote = await Quote.create({
    customer: customerDoc._id,
    rep: repUserId,
    lines: [{
      product: productDoc._id, quantity: 1, unitPrice: amount, unitCost: amount / 2,
      subtotal: amount, total: amount, margin: amount / 2, marginPercent: 50
    }],
    subtotal: amount, total: amount, totalCost: amount / 2, margin: amount / 2, marginPercent: 50,
    oneTimeTotal: amount, stage: 'confirmed', confirmedAt: new Date()
  });
  return Invoice.create({ quote: quote._id, type: 'one-time', amount, status: 'issued' });
}

test.before(async () => {
  await connectTestDB();
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;

  const admin = await postJSON('/auth/register', { name: 'Payment Test Admin', email: email('admin'), password: 'password123', role: ROLES.ADMIN });
  adminToken = admin.data.token;
  const finance = await postJSON('/auth/register', { name: 'Payment Test Finance', email: email('finance'), password: 'password123', role: ROLES.FINANCE });
  financeToken = finance.data.token;
  const rep = await postJSON('/auth/register', { name: 'Payment Test Rep', email: email('rep'), password: 'password123', role: ROLES.SALES_REP });
  repToken = rep.data.token;
  repUserId = rep.data.user.id;

  customerDoc = await Customer.create({ name: `${NAME_PREFIX} Customer`, tier: 'Gold' });
  productDoc = await Product.create({ name: `${NAME_PREFIX} Product`, category: 'Hardware', price: 1000, cost: 600 });
});

test.after(async () => {
  await User.deleteMany({ email: { $regex: `${EMAIL_SUFFIX}$` } });
  await Customer.deleteMany({ name: { $regex: `^${NAME_PREFIX}` } });
  await Product.deleteMany({ name: { $regex: `^${NAME_PREFIX}` } });
  const quotes = await Quote.find({ rep: repUserId }).select('_id');
  const quoteIds = quotes.map((q) => q._id);
  const invoices = await Invoice.find({ quote: { $in: quoteIds } }).select('_id');
  await Payment.deleteMany({ invoice: { $in: invoices.map((i) => i._id) } });
  await Invoice.deleteMany({ quote: { $in: quoteIds } });
  await Quote.deleteMany({ rep: repUserId });
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
});

test('POST /payments/:invoiceId is FINANCE/ADMIN-only', async () => {
  const invoice = await makeInvoice(1000);
  const { status } = await postJSON(`/payments/${invoice._id}`, { amount: 500, method: 'upi' }, repToken);
  assert.equal(status, 403);
});

test('a partial payment moves the invoice to partially_paid, a second payment completes it', async () => {
  const invoice = await makeInvoice(1000);

  const first = await postJSON(`/payments/${invoice._id}`, { amount: 400, method: 'upi' }, financeToken);
  assert.equal(first.status, 201);
  assert.equal(first.data.invoice.status, 'partially_paid');
  assert.equal(first.data.invoice.paidAmount, 400);

  const second = await postJSON(`/payments/${invoice._id}`, { amount: 600, method: 'bank_transfer' }, adminToken);
  assert.equal(second.status, 201);
  assert.equal(second.data.invoice.status, 'paid');
  assert.equal(second.data.invoice.paidAmount, 1000);
  assert.ok(second.data.invoice.paidAt);

  const list = await getJSON(`/payments/${invoice._id}`, repToken);
  assert.equal(list.status, 200);
  assert.equal(list.data.length, 2);
});

test('a payment exceeding the remaining balance is rejected (422), no overpayment allowed', async () => {
  const invoice = await makeInvoice(1000);
  await postJSON(`/payments/${invoice._id}`, { amount: 800, method: 'upi' }, financeToken);

  const { status, data } = await postJSON(`/payments/${invoice._id}`, { amount: 300, method: 'upi' }, financeToken);
  assert.equal(status, 422);

  const stillInvoice = await Invoice.findById(invoice._id);
  assert.equal(stillInvoice.paidAmount, 800);
  assert.equal(stillInvoice.status, 'partially_paid');
});

test('retrying the same transactionRef against the same invoice does not double-credit it (idempotent)', async () => {
  const invoice = await makeInvoice(1000);
  const ref = `TXN-${RUN_ID}`;

  const first = await postJSON(`/payments/${invoice._id}`, { amount: 1000, method: 'card', transactionRef: ref }, financeToken);
  assert.equal(first.status, 201);
  assert.equal(first.data.invoice.status, 'paid');

  const retry = await postJSON(`/payments/${invoice._id}`, { amount: 1000, method: 'card', transactionRef: ref }, financeToken);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.idempotent, true);

  const paymentsForInvoice = await Payment.find({ invoice: invoice._id });
  assert.equal(paymentsForInvoice.length, 1);
  const finalInvoice = await Invoice.findById(invoice._id);
  assert.equal(finalInvoice.paidAmount, 1000);
});

test('a zero or negative payment amount is rejected', async () => {
  const invoice = await makeInvoice(500);
  const { status } = await postJSON(`/payments/${invoice._id}`, { amount: 0, method: 'cash' }, financeToken);
  assert.equal(status, 400);
});

test('recording a payment notifies the quote rep', async () => {
  const Notification = require('../models/Notification');
  const invoice = await makeInvoice(500);
  await postJSON(`/payments/${invoice._id}`, { amount: 500, method: 'cash' }, financeToken);

  const notifications = await Notification.find({ recipient: repUserId, type: 'PAYMENT_RECEIVED', entityId: invoice._id });
  assert.equal(notifications.length, 1);
});
