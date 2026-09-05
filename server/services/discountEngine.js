const DiscountTier = require('../models/DiscountTier');
const DiscountRule = require('../models/DiscountRule');
const config = require('../config/businessConfig');

// Returns the autonomous (no-approval) discount % for a customer tier.
// Reads from DB (admin-configurable) and falls back to businessConfig defaults.
async function getTierAutonomousDiscount(tier) {
  const row = await DiscountTier.findOne({ tier });
  if (row) return row.autonomousDiscount;
  return config.DEFAULT_TIER_DISCOUNT[tier] ?? 0;
}

// Returns the category discount ceiling %.
async function getCategoryCeiling(category) {
  const row = await DiscountRule.findOne({ category });
  if (row) return row.ceilingDiscount;
  return config.DEFAULT_CATEGORY_CEILING[category] ?? 0;
}

// The "allowed" discount for a line is the MORE RESTRICTIVE of:
//  - the customer tier's autonomous discount
//  - the product category's discount ceiling
// This is what a rep can apply without triggering approval for that line.
async function getAllowedLineDiscount(tier, category) {
  const [tierDiscount, categoryCeiling] = await Promise.all([
    getTierAutonomousDiscount(tier),
    getCategoryCeiling(category)
  ]);
  return {
    tierDiscount,
    categoryCeiling,
    allowed: Math.min(tierDiscount, categoryCeiling)
  };
}

module.exports = { getTierAutonomousDiscount, getCategoryCeiling, getAllowedLineDiscount };
