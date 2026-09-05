// Centralized default business configuration.
// Admin-configurable values (DiscountTier, DiscountRule, ApprovalRule docs in Mongo)
// override these at runtime; these are only fallback/seed defaults.

module.exports = {
  DEFAULT_TIER_DISCOUNT: {
    Bronze: 5,
    Silver: 10,
    Gold: 15
  },
  DEFAULT_CATEGORY_CEILING: {
    Hardware: 10,
    Software: 15,
    Services: 8
  },
  APPROVAL_THRESHOLDS: {
    NONE_MAX: 5,      // 0-5% no approval
    MANAGER_MAX: 10,  // 5-10% manager
    FINANCE_MAX: 15   // 10-15% manager+finance, >15% + escalation
  },
  RISK_WEIGHTS: {
    lineViolation: 3.5,     // per % point of violation, summed across lines
    marginImpact: 1.2,      // per 1% margin erosion
    tierRisk: {
      Bronze: 12,
      Silver: 6,
      Gold: 0
    },
    dealSizeRisk: 0.0004    // per unit currency of deal value, capped
  },
  RISK_BANDS: {
    LOW_MAX: 30,
    MEDIUM_MAX: 60,
    HIGH_MAX: 85
    // anything above HIGH_MAX = VERY_HIGH
  },
  MIN_MARGIN_PERCENT: 15,
  DEAL_HEALTH_WEIGHTS: {
    discountRisk: 0.25,
    marginRisk: 0.2,
    negotiationDuration: 0.15,
    approvalDelay: 0.15,
    inventoryRisk: 0.15,
    quoteAge: 0.1
  }
};
