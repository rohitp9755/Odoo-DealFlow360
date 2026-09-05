// Tests for hybrid billing (services/billingEngine.js): a confirmed quote
// with both one-time and recurring lines must produce a one-time invoice AND
// a separate recurring billing-schedule invoice — never merged into one.
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, disconnectTestDB } = require('./helpers/db');
const Customer = require('../models/Customer');
const Quote = require('../models/Quote');
const Invoice = require('../models/Invoice');
const { generateInvoicesForQuote, calculateProration } = require('../services/billingEngine');

const RUN_ID = Date.now();
const NAME_PREFIX = `BillingEngine Test ${RUN_ID}`;

let customerDoc;

test.before(async () => {
  await connectTestDB();
  customerDoc = await Customer.create({ name: `${NAME_PREFIX} Customer`, tier: 'Gold' });
});

test.after(async () => {
  const quotes = await Quote.find({ customer: customerDoc._id }).select('_id');
  await Invoice.deleteMany({ quote: { $in: quotes.map((q) => q._id) } });
  await Quote.deleteMany({ customer: customerDoc._id });
  await Customer.deleteMany({ _id: customerDoc._id });
  await disconnectTestDB();
});

test('a one-time-only quote produces exactly one one-time invoice', async () => {
  const quote = await Quote.create({
    customer: customerDoc._id, rep: customerDoc._id, lines: [],
    oneTimeTotal: 80000, recurringTotal: 0, recurringCycle: null, stage: 'confirmed'
  });
  const invoices = await generateInvoicesForQuote(quote);
  assert.equal(invoices.length, 1);
  assert.equal(invoices[0].type, 'one-time');
  assert.equal(invoices[0].amount, 80000);
});

test('a hybrid quote (one-time + recurring) produces TWO separate invoices, never merged', async () => {
  const quote = await Quote.create({
    customer: customerDoc._id, rep: customerDoc._id, lines: [],
    oneTimeTotal: 80000, recurringTotal: 2000, recurringCycle: 'monthly', stage: 'confirmed'
  });
  const invoices = await generateInvoicesForQuote(quote);
  assert.equal(invoices.length, 2);

  const oneTime = invoices.find((i) => i.type === 'one-time');
  const recurring = invoices.find((i) => i.type === 'recurring');
  assert.ok(oneTime && recurring, 'must produce one invoice of each type');
  assert.equal(oneTime.amount, 80000);
  assert.equal(recurring.amount, 2000);
  assert.equal(recurring.cycle, 'monthly');
  assert.ok(recurring.periodStart);
  assert.ok(recurring.periodEnd);
  assert.ok(recurring.periodEnd > recurring.periodStart);
});

test('a recurring-only quote produces exactly one recurring invoice with a correctly-spaced period for its cycle', async () => {
  const quote = await Quote.create({
    customer: customerDoc._id, rep: customerDoc._id, lines: [],
    oneTimeTotal: 0, recurringTotal: 5400, recurringCycle: 'quarterly', stage: 'confirmed'
  });
  const invoices = await generateInvoicesForQuote(quote);
  assert.equal(invoices.length, 1);
  const invoice = invoices[0];
  const monthsSpan = (invoice.periodEnd.getFullYear() - invoice.periodStart.getFullYear()) * 12
    + (invoice.periodEnd.getMonth() - invoice.periodStart.getMonth());
  assert.equal(monthsSpan, 3);
});

test('proration returns the full amount when cancelling exactly at period start', () => {
  const invoice = { amount: 3000, periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-02-01') };
  const refund = calculateProration(invoice, new Date('2026-01-01'));
  assert.equal(refund, 3000);
});

test('proration returns zero when cancelling exactly at period end', () => {
  const invoice = { amount: 3000, periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-02-01') };
  const refund = calculateProration(invoice, new Date('2026-02-01'));
  assert.equal(refund, 0);
});

test('proration returns a proportional refund for a mid-cycle cancellation', () => {
  // 30-day period, cancel exactly halfway through -> ~half the amount back.
  const invoice = { amount: 3000, periodStart: new Date('2026-01-01T00:00:00Z'), periodEnd: new Date('2026-01-31T00:00:00Z') };
  const refund = calculateProration(invoice, new Date('2026-01-16T00:00:00Z'));
  assert.ok(refund > 1400 && refund < 1600, `expected ~1500, got ${refund}`);
});
