// Deal Health Score (0-100) + anomaly alerts. Deterministic, factor-based.

const config = require('../config/businessConfig');
const Approval = require('../models/Approval');
const Fulfillment = require('../models/Fulfillment');
const Negotiation = require('../models/Negotiation');

async function computeDealHealth(quote, customer) {
  const weights = config.DEAL_HEALTH_WEIGHTS;
  const alerts = [];

  // Discount risk: derived directly from the deterministic risk score (0-100, higher = worse)
  const discountRisk = quote.riskScore;

  // Margin risk: how far below target margin, scaled 0-100
  const marginRisk = quote.marginPercent < config.MIN_MARGIN_PERCENT
    ? Math.min(100, (config.MIN_MARGIN_PERCENT - quote.marginPercent) * 4)
    : 0;

  // Negotiation duration risk
  const negotiation = await Negotiation.findOne({ quote: quote._id });
  let negotiationDuration = 0;
  if (negotiation && negotiation.status === 'open') {
    const hoursOpen = (Date.now() - negotiation.createdAt.getTime()) / 3600000;
    negotiationDuration = Math.min(100, hoursOpen * 2);
    if (hoursOpen > 24) alerts.push({ type: 'stalled_deal', message: `Negotiation has been open for ${Math.round(hoursOpen)} hours with no resolution.` });
  }

  // Approval delay risk
  const approval = await Approval.findOne({ quote: quote._id }).sort({ createdAt: -1 });
  let approvalDelay = 0;
  if (approval && approval.status === 'pending') {
    const hoursWaiting = (Date.now() - approval.createdAt.getTime()) / 3600000;
    approvalDelay = Math.min(100, hoursWaiting * 3);
    if (hoursWaiting > 18) alerts.push({ type: 'approval_delay', message: `Deal has been waiting for approval for ${Math.round(hoursWaiting)} hours.` });
  }

  // Inventory risk: presence of backorders
  const fulfillment = await Fulfillment.findOne({ quote: quote._id });
  let inventoryRisk = 0;
  if (fulfillment && fulfillment.backorders?.length > 0) {
    inventoryRisk = Math.min(100, fulfillment.backorders.length * 25);
    alerts.push({ type: 'inventory_risk', message: `${fulfillment.backorders.length} line(s) are on backorder.` });
  }

  // Quote age risk
  const ageDays = (Date.now() - quote.createdAt.getTime()) / 86400000;
  const quoteAge = Math.min(100, ageDays * 5);

  // Unusual discount vs rep historical average (anomaly detection)
  if (customer?.repHistoricalAvgDiscount > 0) {
    const currentDiscountPct = quote.subtotal > 0 ? (quote.discountAmount / quote.subtotal) * 100 : 0;
    const deviation = ((currentDiscountPct - customer.repHistoricalAvgDiscount) / customer.repHistoricalAvgDiscount) * 100;
    if (deviation > 30) {
      alerts.push({
        type: 'unusual_discount',
        message: `This deal's discount is ${Math.round(deviation)}% above this rep's historical average.`
      });
    }
  }

  const weightedRisk =
    discountRisk * weights.discountRisk +
    marginRisk * weights.marginRisk +
    negotiationDuration * weights.negotiationDuration +
    approvalDelay * weights.approvalDelay +
    inventoryRisk * weights.inventoryRisk +
    quoteAge * weights.quoteAge;

  const score = Math.max(0, Math.min(100, Math.round(100 - weightedRisk)));

  let status = 'Healthy';
  if (score < 40) status = 'Critical';
  else if (score < 60) status = 'At Risk';
  else if (score < 80) status = 'Watch';

  return {
    score,
    status,
    factors: { discountRisk, marginRisk, negotiationDuration, approvalDelay, inventoryRisk, quoteAge },
    alerts
  };
}

module.exports = { computeDealHealth };
