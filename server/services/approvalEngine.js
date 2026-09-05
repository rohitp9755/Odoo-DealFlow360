const ApprovalRule = require('../models/ApprovalRule');
const Approval = require('../models/Approval');
const Quote = require('../models/Quote');
const config = require('../config/businessConfig');
const { logAudit } = require('./auditService');
const { notify, notifyRoles } = require('./notificationService');
const { ROLES } = require('../config/roles');

// Approval.steps.role vocabulary ('manager'/'finance'/'escalation') mapped to the
// internal User roles that should be notified when a step becomes pending.
// 'escalation' has no dedicated User role in this system, so it routes to ADMIN.
const STEP_ROLE_TO_USER_ROLES = {
  manager: [ROLES.SALES_MANAGER],
  finance: [ROLES.FINANCE],
  escalation: [ROLES.ADMIN]
};

// Given a headline discount %, determine which approver roles are required.
// Reads admin-configured ApprovalRule ranges first; falls back to businessConfig thresholds.
async function getRequiredApprovers(headlineDiscount) {
  const rules = await ApprovalRule.find().sort({ minDiscount: 1 });
  if (rules.length > 0) {
    const match = rules.find(r => headlineDiscount >= r.minDiscount && headlineDiscount < r.maxDiscount);
    if (match) return match.approversRequired;
    const last = rules[rules.length - 1];
    if (headlineDiscount >= last.maxDiscount) return last.approversRequired;
    return [];
  }

  const t = config.APPROVAL_THRESHOLDS;
  if (headlineDiscount <= t.NONE_MAX) return [];
  if (headlineDiscount <= t.MANAGER_MAX) return ['manager'];
  if (headlineDiscount <= t.FINANCE_MAX) return ['manager', 'finance'];
  return ['manager', 'finance', 'escalation'];
}

// Decide if a quote (already computed via quoteCalculator) needs an approval record,
// and create one with a full explainable reason trail if so.
async function evaluateAndRouteApproval(quote, requestedBy, headlineDiscount) {
  const approversRequired = await getRequiredApprovers(headlineDiscount);

  if (approversRequired.length === 0) {
    return { requiresApproval: false, approval: null };
  }

  const reasons = [...quote.reasons];
  reasons.push(`Blended discount ${round2(headlineDiscount)}% requires: ${approversRequired.join(' + ')}`);

  const approval = await Approval.create({
    quote: quote._id,
    requestedBy: requestedBy._id,
    requestedDiscount: round2(headlineDiscount),
    riskScore: quote.riskScore,
    riskBand: quote.riskBand,
    marginLeakage: quote.marginLeakage,
    reasons,
    steps: approversRequired.map(role => ({ role, status: 'pending' })),
    status: 'pending'
  });

  await Quote.findByIdAndUpdate(quote._id, { stage: 'pending_approval' });

  await logAudit({
    user: requestedBy,
    action: 'APPROVAL_REQUESTED',
    entity: 'Approval',
    entityId: approval._id,
    newValue: { requestedDiscount: headlineDiscount, riskScore: quote.riskScore },
    reason: reasons.join('; ')
  });

  const notifyTargetRoles = [...new Set(approversRequired.flatMap((r) => STEP_ROLE_TO_USER_ROLES[r] || []))];
  if (notifyTargetRoles.length > 0) {
    await notifyRoles(notifyTargetRoles, {
      type: 'APPROVAL_REQUIRED',
      message: `Quote ${quote._id} needs ${approversRequired.join(' + ')} approval (blended discount ${round2(headlineDiscount)}%).`,
      entity: 'Approval',
      entityId: approval._id
    });
  }

  return { requiresApproval: true, approval };
}

// Process a manager/finance action on one step of an approval.
async function actOnApproval(approvalId, role, action, actingUser, comment) {
  const approval = await Approval.findById(approvalId);
  if (!approval) {
    const err = new Error('Approval not found');
    err.status = 404;
    throw err;
  }
  if (approval.status !== 'pending') {
    const err = new Error('Approval already resolved');
    err.status = 400;
    throw err;
  }

  const step = approval.steps.find(s => s.role === role && s.status === 'pending');
  if (!step) {
    const err = new Error(`No pending step for role ${role} on this approval`);
    err.status = 400;
    throw err;
  }

  step.status = action === 'approve' ? 'approved' : 'rejected';
  step.actedBy = actingUser._id;
  step.actedAt = new Date();
  step.comment = comment;

  let resolved = null;
  if (action === 'reject') {
    approval.status = 'rejected';
    approval.resolvedAt = new Date();
    await Quote.findByIdAndUpdate(approval.quote, { stage: 'rejected' });
    resolved = 'rejected';
  } else if (approval.steps.every(s => s.status === 'approved')) {
    approval.status = 'approved';
    approval.resolvedAt = new Date();
    await Quote.findByIdAndUpdate(approval.quote, { stage: 'approved' });
    resolved = 'approved';
  }

  await approval.save();

  await logAudit({
    user: actingUser,
    action: action === 'approve' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
    entity: 'Approval',
    entityId: approval._id,
    oldValue: { status: 'pending' },
    newValue: { status: step.status },
    reason: comment
  });

  if (resolved) {
    await notify({
      recipients: [approval.requestedBy],
      type: resolved === 'approved' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED',
      message: resolved === 'approved'
        ? `Quote ${approval.quote} has been fully approved.`
        : `Quote ${approval.quote} was rejected by ${role}.${comment ? ` Reason: ${comment}` : ''}`,
      entity: 'Quote',
      entityId: approval.quote
    });
  }

  return approval;
}

async function returnForRevision(approvalId, actingUser, comment) {
  const approval = await Approval.findById(approvalId);
  if (!approval) {
    const err = new Error('Approval not found');
    err.status = 404;
    throw err;
  }
  approval.status = 'returned';
  approval.resolvedAt = new Date();
  await approval.save();
  await Quote.findByIdAndUpdate(approval.quote, { stage: 'draft' });

  await logAudit({
    user: actingUser,
    action: 'APPROVAL_RETURNED',
    entity: 'Approval',
    entityId: approval._id,
    reason: comment
  });

  await notify({
    recipients: [approval.requestedBy],
    type: 'APPROVAL_RETURNED',
    message: `Quote ${approval.quote} was returned for revision.${comment ? ` Reason: ${comment}` : ''}`,
    entity: 'Quote',
    entityId: approval.quote
  });

  return approval;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { getRequiredApprovers, evaluateAndRouteApproval, actOnApproval, returnForRevision };
