const Quote = require('../models/Quote');
const Approval = require('../models/Approval');
const DealHealth = require('../models/DealHealth');

async function summary(req, res, next) {
  try {
    const [totalDeals, activeDeals, pendingApprovals, dealsAtRisk, negotiations, revenueAgg] = await Promise.all([
      Quote.countDocuments(),
      Quote.countDocuments({ stage: { $nin: ['confirmed', 'rejected'] } }),
      Approval.countDocuments({ status: 'pending' }),
      DealHealth.countDocuments({ status: { $in: ['At Risk', 'Critical'] } }),
      Quote.countDocuments({ stage: 'under_negotiation' }),
      Quote.aggregate([
        { $match: { stage: 'confirmed' } },
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
    const revenueTrend = await Quote.aggregate([
      { $match: { stage: 'confirmed' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$confirmedAt' } }, total: { $sum: '$total' } } },
      { $sort: { _id: 1 } }
    ]);

    const pipeline = await Quote.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$total' } } }
    ]);

    const discountDistribution = await Quote.aggregate([
      { $bucket: {
        groupBy: { $cond: [{ $gt: ['$subtotal', 0] }, { $multiply: [{ $divide: ['$discountAmount', '$subtotal'] }, 100] }, 0] },
        boundaries: [0, 5, 10, 15, 20, 100],
        default: '20+',
        output: { count: { $sum: 1 } }
      } }
    ]);

    const marginTrend = await Quote.aggregate([
      { $match: { stage: 'confirmed' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$confirmedAt' } }, avgMargin: { $avg: '$marginPercent' } } },
      { $sort: { _id: 1 } }
    ]);

    const dealHealthDist = await DealHealth.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({ revenueTrend, pipeline, discountDistribution, marginTrend, dealHealthDist });
  } catch (err) { next(err); }
}

module.exports = { summary, analytics };
