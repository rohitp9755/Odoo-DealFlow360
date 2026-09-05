const Quote = require('../models/Quote');
const Approval = require('../models/Approval');
const DealHealth = require('../models/DealHealth');
const { ROLES } = require('../config/roles');

// SALES_REP sees only their own book of deals; SALES_MANAGER/FINANCE/ADMIN
// keep the company-wide view (per the authorization matrix — reps can view
// their own quotations/fulfillment, not company-wide figures).
async function scopeForUser(user) {
  if (user.role !== ROLES.SALES_REP) {
    return { quoteFilter: {}, repQuoteIds: null };
  }
  const repQuoteIds = await Quote.find({ rep: user._id }).distinct('_id');
  return { quoteFilter: { rep: user._id }, repQuoteIds };
}

async function summary(req, res, next) {
  try {
    const { quoteFilter, repQuoteIds } = await scopeForUser(req.user);
    const scopedByQuote = repQuoteIds ? { quote: { $in: repQuoteIds } } : {};

    const [totalDeals, activeDeals, pendingApprovals, dealsAtRisk, negotiations, revenueAgg] = await Promise.all([
      Quote.countDocuments(quoteFilter),
      Quote.countDocuments({ ...quoteFilter, stage: { $nin: ['confirmed', 'rejected'] } }),
      Approval.countDocuments({ status: 'pending', ...scopedByQuote }),
      DealHealth.countDocuments({ status: { $in: ['At Risk', 'Critical'] }, ...scopedByQuote }),
      Quote.countDocuments({ ...quoteFilter, stage: 'under_negotiation' }),
      Quote.aggregate([
        { $match: { ...quoteFilter, stage: 'confirmed' } },
        { $group: { _id: null, revenue: { $sum: '$total' }, margin: { $sum: '$margin' } } }
      ])
    ]);

    const revenue = revenueAgg[0]?.revenue || 0;
    const margin = revenueAgg[0]?.margin || 0;

    res.json({ totalDeals, activeDeals, revenue, margin, pendingApprovals, dealsAtRisk, negotiations });
  } catch (err) { next(err); }
}

async function analytics(req, res, next) {
  try {
    const { quoteFilter, repQuoteIds } = await scopeForUser(req.user);
    const scopedByQuote = repQuoteIds ? { quote: { $in: repQuoteIds } } : {};

    const revenueTrend = await Quote.aggregate([
      { $match: { ...quoteFilter, stage: 'confirmed' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$confirmedAt' } }, total: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]);

    const pipeline = await Quote.aggregate([
      { $match: quoteFilter },
      { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$total' } } }
    ]);

    const discountDistribution = await Quote.aggregate([
      { $match: quoteFilter },
      { $bucket: {
        groupBy: { $cond: [{ $gt: ['$subtotal', 0] }, { $multiply: [{ $divide: ['$discountAmount', '$subtotal'] }, 100] }, 0] },
        boundaries: [0, 5, 10, 15, 20, 100],
        default: '20+',
        output: { count: { $sum: 1 } }
      } }
    ]);

    const marginTrend = await Quote.aggregate([
      { $match: { ...quoteFilter, stage: 'confirmed' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$confirmedAt' } }, avgMargin: { $avg: '$marginPercent' } } },
      { $sort: { _id: 1 } }
    ]);

    const dealHealthDist = await DealHealth.aggregate([
      { $match: scopedByQuote },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({ revenueTrend, pipeline, discountDistribution, marginTrend, dealHealthDist });
  } catch (err) { next(err); }
}

module.exports = { summary, analytics };
