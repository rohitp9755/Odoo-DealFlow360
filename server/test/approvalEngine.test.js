// Unit/service tests for approval routing and the approval state machine
// (services/approvalEngine.js): automatic routing by headline discount,
// multi-step (manager + finance) sign-off, rejection, return-for-revision,
// and protection against acting on a step that isn't actually pending.
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, disconnectTestDB } = require('./helpers/db');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Quote = require('../models/Quote');
const Approval = require('../models/Approval');
const { ROLES } = require('../config/roles');
const { getRequiredApprovers, evaluateAndRouteApproval, actOnApproval, returnForRevision } = require('../services/approvalEngine');

const RUN_ID = Date.now();
const NAME_PREFIX = `ApprovalEngine Test ${RUN_ID}`;

let repUser, managerUser, financeUser, customerDoc, productDoc;

test.before(async () => {
  await connectTestDB();
  repUser = await User.create({ name: `${NAME_PREFIX} Rep`, email: `rep-${RUN_ID}@approval-engine-test.local`, password: 'password123', role: ROLES.SALES_REP });
  managerUser = await User.create({ name: `${NAME_PREFIX} Manager`, email: `mgr-${RUN_ID}@approval-engine-test.local`, password: 'password123', role: ROLES.SALES_MANAGER });
  financeUser = await User.create({ name: `${NAME_PREFIX} Finance`, email: `fin-${RUN_ID}@approval-engine-test.local`, password: 'password123', role: ROLES.FINANCE });
  customerDoc = await Customer.create({ name: `${NAME_PREFIX} Customer`, tier: 'Gold' });
  productDoc = await Product.create({ name: `${NAME_PREFIX} Product`, category: 'Hardware', price: 10000, cost: 6000 });
});

test.after(async () => {
  await Approval.deleteMany({ requestedBy: repUser._id });
  await Quote.deleteMany({ rep: repUser._id });
  await User.deleteMany({ _id: { $in: [repUser._id, managerUser._id, financeUser._id] } });
  await Customer.deleteMany({ _id: customerDoc._id });
  await Product.deleteMany({ _id: productDoc._id });
  await disconnectTestDB();
});

async function makeQuote() {
  return Quote.create({
    customer: customerDoc._id, rep: repUser._id,
    lines: [{ product: productDoc._id, quantity: 1, unitPrice: 10000, unitCost: 6000, subtotal: 10000, total: 10000, margin: 4000, marginPercent: 40 }],
    subtotal: 10000, total: 10000, totalCost: 6000, margin: 4000, marginPercent: 40, stage: 'draft'
  });
}

test('a discount at/below the no-approval threshold requires no approvers', async () => {
  const approvers = await getRequiredApprovers(2);
  assert.deepEqual(approvers, []);
});

test('a discount in the manager-only band requires just a manager', async () => {
  const approvers = await getRequiredApprovers(8);
  assert.deepEqual(approvers, ['manager']);
});

test('a discount above the manager band requires manager + finance', async () => {
  const approvers = await getRequiredApprovers(12);
  assert.deepEqual(approvers.sort(), ['finance', 'manager']);
});

test('evaluateAndRouteApproval creates a pending Approval with the right steps and moves the quote to pending_approval', async () => {
  const quote = await makeQuote();
  const { requiresApproval, approval } = await evaluateAndRouteApproval(
    { _id: quote._id, riskScore: 40, riskBand: 'MEDIUM', marginLeakage: 500, reasons: ['test reason'] },
    repUser,
    12
  );
  assert.equal(requiresApproval, true);
  assert.equal(approval.status, 'pending');
  assert.deepEqual(approval.steps.map((s) => s.role).sort(), ['finance', 'manager']);

  const persistedQuote = await Quote.findById(quote._id);
  assert.equal(persistedQuote.stage, 'pending_approval');
});

test('a headline discount within the no-approval threshold produces no Approval record at all', async () => {
  const quote = await makeQuote();
  const { requiresApproval, approval } = await evaluateAndRouteApproval(
    { _id: quote._id, riskScore: 0, riskBand: 'LOW', marginLeakage: 0, reasons: [] },
    repUser,
    2
  );
  assert.equal(requiresApproval, false);
  assert.equal(approval, null);
});

test('an approval only resolves once ALL required steps approve — manager alone is not enough when finance is also required', async () => {
  const quote = await makeQuote();
  const { approval } = await evaluateAndRouteApproval(
    { _id: quote._id, riskScore: 50, riskBand: 'HIGH', marginLeakage: 1000, reasons: ['test'] }, repUser, 12
  );

  const afterManager = await actOnApproval(approval._id, 'manager', 'approve', managerUser, 'looks fine');
  assert.equal(afterManager.status, 'pending', 'still pending — finance has not acted yet');

  const afterFinance = await actOnApproval(approval._id, 'finance', 'approve', financeUser, 'approved');
  assert.equal(afterFinance.status, 'approved');

  const quoteAfter = await Quote.findById(quote._id);
  assert.equal(quoteAfter.stage, 'approved');
});

test('a rejection at any step immediately rejects the whole approval and the quote', async () => {
  const quote = await makeQuote();
  const { approval } = await evaluateAndRouteApproval(
    { _id: quote._id, riskScore: 50, riskBand: 'HIGH', marginLeakage: 1000, reasons: ['test'] }, repUser, 12
  );

  const afterReject = await actOnApproval(approval._id, 'manager', 'reject', managerUser, 'discount too aggressive');
  assert.equal(afterReject.status, 'rejected');

  const quoteAfter = await Quote.findById(quote._id);
  assert.equal(quoteAfter.stage, 'rejected');
});

test('acting on a step that is not actually pending for that role is rejected', async () => {
  const quote = await makeQuote();
  const { approval } = await evaluateAndRouteApproval(
    { _id: quote._id, riskScore: 20, riskBand: 'MEDIUM', marginLeakage: 100, reasons: ['test'] }, repUser, 8 // manager-only band
  );

  await assert.rejects(
    () => actOnApproval(approval._id, 'finance', 'approve', financeUser, 'trying to approve a step that does not exist'),
    (err) => { assert.equal(err.status, 400); return true; }
  );
});

test('an already-resolved approval cannot be acted on again', async () => {
  const quote = await makeQuote();
  const { approval } = await evaluateAndRouteApproval(
    { _id: quote._id, riskScore: 20, riskBand: 'MEDIUM', marginLeakage: 100, reasons: ['test'] }, repUser, 8
  );
  await actOnApproval(approval._id, 'manager', 'approve', managerUser, 'ok');

  await assert.rejects(
    () => actOnApproval(approval._id, 'manager', 'approve', managerUser, 'trying again'),
    (err) => { assert.equal(err.status, 400); return true; }
  );
});

test('returning an approval for revision sends the quote back to draft', async () => {
  const quote = await makeQuote();
  const { approval } = await evaluateAndRouteApproval(
    { _id: quote._id, riskScore: 20, riskBand: 'MEDIUM', marginLeakage: 100, reasons: ['test'] }, repUser, 8
  );

  const returned = await returnForRevision(approval._id, managerUser, 'please re-check the numbers');
  assert.equal(returned.status, 'returned');

  const quoteAfter = await Quote.findById(quote._id);
  assert.equal(quoteAfter.stage, 'draft');
});
