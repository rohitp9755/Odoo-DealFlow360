// Unit tests for discount governance (services/discountEngine.js): the
// allowed discount for a line must be the MORE RESTRICTIVE of the customer's
// tier autonomous limit and the product category's ceiling, reading
// admin-configured DB rows first and falling back to businessConfig defaults.
//
// DiscountTier.tier / DiscountRule.category are enum-constrained to the real
// business values (Bronze/Silver/Gold, Hardware/Software/Services), so these
// tests temporarily override a real row against the shared dev DB and restore
// whatever was there before, rather than inventing fake enum values.
const test = require('node:test');
const assert = require('node:assert/strict');

const { connectTestDB, disconnectTestDB } = require('./helpers/db');
const DiscountTier = require('../models/DiscountTier');
const DiscountRule = require('../models/DiscountRule');
const { getTierAutonomousDiscount, getCategoryCeiling, getAllowedLineDiscount } = require('../services/discountEngine');

let originalSilverTier, originalServicesRule;

test.before(async () => {
  await connectTestDB();
  originalSilverTier = await DiscountTier.findOne({ tier: 'Silver' }).lean();
  originalServicesRule = await DiscountRule.findOne({ category: 'Services' }).lean();
});

test.after(async () => {
  if (originalSilverTier) {
    await DiscountTier.findOneAndUpdate({ tier: 'Silver' }, { autonomousDiscount: originalSilverTier.autonomousDiscount });
  } else {
    await DiscountTier.deleteOne({ tier: 'Silver' });
  }
  if (originalServicesRule) {
    await DiscountRule.findOneAndUpdate({ category: 'Services' }, { ceilingDiscount: originalServicesRule.ceilingDiscount });
  } else {
    await DiscountRule.deleteOne({ category: 'Services' });
  }
  await disconnectTestDB();
});

test('a tier with no DB row at all uses the businessConfig fallback (0 for an unknown tier value)', async () => {
  const discount = await getTierAutonomousDiscount('NoSuchTierAtAll');
  assert.equal(discount, 0);
});

test('an admin-configured DiscountTier row overrides the businessConfig default', async () => {
  await DiscountTier.findOneAndUpdate({ tier: 'Silver' }, { autonomousDiscount: 42 }, { upsert: true });
  const discount = await getTierAutonomousDiscount('Silver');
  assert.equal(discount, 42);
});

test('an admin-configured DiscountRule (category ceiling) overrides the businessConfig default', async () => {
  await DiscountRule.findOneAndUpdate({ category: 'Services' }, { ceilingDiscount: 7 }, { upsert: true });
  const ceiling = await getCategoryCeiling('Services');
  assert.equal(ceiling, 7);
});

test('the allowed discount is the MORE RESTRICTIVE of tier and category (category stricter than tier)', async () => {
  await DiscountTier.findOneAndUpdate({ tier: 'Silver' }, { autonomousDiscount: 20 }, { upsert: true });
  await DiscountRule.findOneAndUpdate({ category: 'Services' }, { ceilingDiscount: 8 }, { upsert: true });

  const { allowed, tierDiscount, categoryCeiling } = await getAllowedLineDiscount('Silver', 'Services');
  assert.equal(tierDiscount, 20);
  assert.equal(categoryCeiling, 8);
  assert.equal(allowed, 8, 'the stricter of the two limits must win, regardless of which one it is');
});

test('the allowed discount is the MORE RESTRICTIVE of tier and category (tier stricter than category)', async () => {
  await DiscountTier.findOneAndUpdate({ tier: 'Silver' }, { autonomousDiscount: 3 }, { upsert: true });
  await DiscountRule.findOneAndUpdate({ category: 'Services' }, { ceilingDiscount: 25 }, { upsert: true });

  const { allowed } = await getAllowedLineDiscount('Silver', 'Services');
  assert.equal(allowed, 3);
});
