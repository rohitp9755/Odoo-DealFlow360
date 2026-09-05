const Approval = require('../models/Approval');
const { actOnApproval, returnForRevision } = require('../services/approvalEngine');

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
    const approval = await actOnApproval(req.params.id, req.user.role, 'approve', req.user, req.body.comment);
    res.json(approval);
  } catch (err) { next(err); }
}

async function reject(req, res, next) {
  try {
    const approval = await actOnApproval(req.params.id, req.user.role, 'reject', req.user, req.body.comment);
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
