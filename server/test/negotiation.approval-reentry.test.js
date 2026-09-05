// Regression test for the negotiation -> approval re-entry flow (Phase 20/23):
// accepting a negotiated discount must re-run the deterministic approval
// engine on the RECALCULATED quote, not blindly jump the quote to 'sent'.
//
// negotiationEngine.decideOutcome() calls a discount "autonomous" purely
// against the customer's TIER limit. The real approval routing
// (services/approvalEngine.getRequiredApprovers) is driven by a separate,
// stricter global threshold table that has no notion of tier at all. A Gold
// customer's tier limit (15%) is well above the global no-approval ceiling
// (5%), so an "autonomous" 12% acceptance still requires manager+finance
// approval — the bug this test guards against is a negotiation acceptance
// silently skipping that governance step.
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, disconnectTestDB } = require('./helpers/db');
const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Quote = require('../models/Quote');
const Negotiation = require('../models/Negotiation');
const NegotiationMessage = require('../models/NegotiationMessage');
const Approval = require('../models/Approval');
const { ROLES } = require('../config/roles');

const RUN_ID = Date.now();
const EMAIL_SUFFIX = `@reentry-test-${RUN_ID}.local`;
const email = (local) => `${local}${EMAIL_SUFFIX}`;
const NAME_PREFIX = `Reentry Test ${RUN_ID}`;

let server;
let baseUrl;
let repToken;
let repUserId;
let customerToken;
let customerDoc;
let productDoc;
let quoteDoc;

async function postJSON(path, body, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

test.before(async () => {
  await connectTestDB();
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}/api`;

  const rep = await postJSON('/auth/register', { name: 'Reentry Test Rep', email: email('rep'), password: 'password123', role: ROLES.SALES_REP });
  repToken = rep.data.token;
  repUserId = rep.data.user.id;

  // Gold tier: autonomous (negotiation-level) limit is 15%, well above the
  // global no-approval threshold (5%) — this gap is exactly what the fix covers.
  customerDoc = await Customer.create({ name: `${NAME_PREFIX} Customer`, tier: 'Gold' });
  productDoc = await Product.create({ name: `${NAME_PREFIX} Product`, category: 'Hardware', price: 10000, cost: 6000 });

  quoteDoc = await Quote.create({
    customer: customerDoc._id,
    rep: repUserId,
    lines: [{ product: productDoc._id, quantity: 2, unitPrice: 10000, unitCost: 6000, subtotal: 20000, total: 20000, margin: 8000, marginPercent: 40 }],
    subtotal: 20000, total: 20000, totalCost: 12000, margin: 8000, marginPercent: 40, stage: 'sent'
  });

  const regCustomer = await postJSON('/auth/register-customer', { name: 'Reentry Buyer', email: email('buyer'), password: 'password123', customerId: customerDoc._id.toString() });
  customerToken = regCustomer.data.token;
});

test.after(async () => {
  await User.deleteMany({ email: { $regex: `${EMAIL_SUFFIX}$` } });
  await Approval.deleteMany({ quote: quoteDoc._id });
  await Negotiation.deleteMany({ quote: quoteDoc._id });
  await Quote.deleteMany({ rep: repUserId });
  await Customer.deleteMany({ name: { $regex: `^${NAME_PREFIX}` } });
  await Product.deleteMany({ name: { $regex: `^${NAME_PREFIX}` } });
  await new Promise((resolve) => server.close(resolve));
  await disconnectTestDB();
});

test('accepting a negotiated discount that is within the tier limit but above the global approval-free threshold re-enters approval instead of jumping straight to sent', async () => {
  const message = await postJSON(`/negotiations/${quoteDoc._id}/message`, { message: 'Can you do 12% off?' }, customerToken);
  assert.equal(message.status, 200);
  assert.equal(message.data.offer.requiresApproval, false, 'a 12% ask is within the Gold tier autonomous limit (15%), so the agent should not demand approval up front');
  assert.equal(message.data.offer.recommendedDiscount, 12);

  const negotiation = await Negotiation.findOne({ quote: quoteDoc._id });
  const offerId = negotiation.offers[negotiation.offers.length - 1]._id;

  const accept = await postJSON(`/negotiations/${quoteDoc._id}/counter-offer`, { offerId, action: 'accept' }, customerToken);
  assert.equal(accept.status, 200);

  assert.equal(accept.data.requiresApproval, true, '12% exceeds the global no-approval ceiling (5%), so accepting it must require approval');
  assert.equal(accept.data.quote.stage, 'pending_approval');
  assert.ok(accept.data.approval, 'an Approval record must be created');

  const approval = await Approval.findById(accept.data.approval._id || accept.data.approval);
  assert.ok(approval, 'the approval must actually be persisted');
  assert.equal(approval.status, 'pending');
  assert.deepEqual(approval.steps.map((s) => s.role).sort(), ['finance', 'manager']);

  const persistedQuote = await Quote.findById(quoteDoc._id);
  assert.equal(persistedQuote.stage, 'pending_approval', 'the quote must not have been left in (or moved to) "sent" while approval is outstanding');
  assert.equal(persistedQuote.lines[0].lineDiscount, 12, 'the recalculated discount must still be persisted onto the quote');
});
