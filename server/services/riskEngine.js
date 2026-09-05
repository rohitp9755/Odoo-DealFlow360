const config = require('../config/businessConfig');

// Deterministic, explainable risk scoring.
// Risk = weighted line violations + margin impact + tier risk + deal-size risk.
// This is NOT random and NOT an ML black box — every point is traceable to a reason string.
function calculateRisk({ lines, tier, dealValue, marginPercent }) {
  const weights = config.RISK_WEIGHTS;
  const reasons = [];

  let violationScore = 0;
  let marginLeakage = 0;
  let headlineDiscount = 0; // blended discount used for approval routing

  let weightedDiscountNumerator = 0;
  let totalLineValue = 0;

  for (const line of lines) {
    totalLineValue += line.subtotal;
    weightedDiscountNumerator += line.lineDiscount * line.subtotal;

    if (line.violation > 0) {
      violationScore += line.violation * weights.lineViolation;
      const leakage = (line.violation / 100) * line.subtotal;
      marginLeakage += leakage;
      reasons.push(
        `Line discount ${line.lineDiscount}% exceeds allowed ${line.allowedDiscount}% ` +
        `(violation ${round2(line.violation)}%, est. margin leakage ₹${round2(leakage)})`
      );
    }
  }

  headlineDiscount = totalLineValue > 0 ? weightedDiscountNumerator / totalLineValue : 0;

  const marginImpactScore = marginPercent < config.MIN_MARGIN_PERCENT
    ? (config.MIN_MARGIN_PERCENT - marginPercent) * weights.marginImpact
    : 0;
  if (marginImpactScore > 0) {
    reasons.push(
      `Projected margin ${round2(marginPercent)}% is below minimum target ${config.MIN_MARGIN_PERCENT}%`
    );
  }

  const tierRiskScore = weights.tierRisk[tier] ?? 0;
  const dealSizeRiskScore = Math.min(15, dealValue * weights.dealSizeRisk);

  const rawScore = violationScore + marginImpactScore + tierRiskScore + dealSizeRiskScore;
  const riskScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let riskBand = 'LOW';
  if (riskScore > config.RISK_BANDS.HIGH_MAX) riskBand = 'VERY_HIGH';
  else if (riskScore > config.RISK_BANDS.MEDIUM_MAX) riskBand = 'HIGH';
  else if (riskScore > config.RISK_BANDS.LOW_MAX) riskBand = 'MEDIUM';

  if (reasons.length === 0) {
    reasons.push('All line discounts are within allowed limits.');
  }

  return {
    riskScore,
    riskBand,
    headlineDiscount: round2(headlineDiscount),
    marginLeakage: round2(marginLeakage),
    reasons
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { calculateRisk };
