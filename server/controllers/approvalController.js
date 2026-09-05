const Approval = require('../models/Approval');
const { actOnApproval, returnForRevision } = require('../services/approvalEngine');
const { ROLES } = require('../config/roles');

// Approval.steps.role uses its own vocabulary ('manager' | 'finance' | 'escalation') —
// a separate concept from the User role enum, unrelated to this auth feature and left
// untouched. This just translates the caller's user role to that vocabulary at the boundary.
const USER_ROLE_TO_STEP_ROLE = {
  [ROLES.SALES_MANAGER]: 'manager',
  [ROLES.FINANCE]: 'finance'
};

async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const approvals = await Approval.find(filter)
      .populate({ path: 'quote', populate: [{ path: 'customer', select: 'name tier' }, { path: 'rep', select: 'name' }] })
      .populate('requestedBy', 'name role')
      .sort({ createdAt: -1 });
    res.json(approvals);
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const approval = await Approval.findById(req.params.id)
      .populate({ path: 'quote', populate: [{ path: 'customer' }, { path: 'lines.product' }] })
      .populate('requestedBy', 'name role');
    if (!approval) return res.status(404).json({ message: 'Approval not found' });
    res.json(approval);
  } catch (err) { next(err); }
}

async function approve(req, res, next) {
  try {
    const stepRole = USER_ROLE_TO_STEP_ROLE[req.user.role] || req.user.role;
    const approval = await actOnApproval(req.params.id, stepRole, 'approve', req.user, req.body.comment);
    res.json(approval);
  } catch (err) { next(err); }
}

async function reject(req, res, next) {
  try {
    const stepRole = USER_ROLE_TO_STEP_ROLE[req.user.role] || req.user.role;
    const approval = await actOnApproval(req.params.id, stepRole, 'reject', req.user, req.body.comment);
    res.json(approval);
  } catch (err) { next(err); }
}

async function returnStep(req, res, next) {
  try {
    const approval = await returnForRevision(req.params.id, req.user, req.body.comment);
    res.json(approval);
  } catch (err) { next(err); }
}

module.exports = { list, getOne, approve, reject, returnStep };
