// Unit tests for the blended discount risk engine (services/riskEngine.js).
// Pure function, no DB — every score must be traceable to an explicit reason,
// never a hardcoded/random number.
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateRisk } = require('../services/riskEngine');

function line({ subtotal, lineDiscount, allowedDiscount }) {
  const violation = Math.max(0, lineDiscount - allowedDiscount);
  return { subtotal, lineDiscount, allowedDiscount, violation };
}

test('no line exceeds its allowed discount -> LOW risk, no violation reasons', () => {
  const result = calculateRisk({
    lines: [line({ subtotal: 10000, lineDiscount: 5, allowedDiscount: 10 })],
    tier: 'Gold',
    dealValue: 9500,
    marginPercent: 40
  });
  assert.equal(result.riskBand, 'LOW');
  assert.equal(result.reasons.some((r) => r.includes('exceeds allowed')), false);
});

test('a single line exceeding its allowed discount is flagged with an explainable reason and non-zero margin leakage', () => {
  // Laptop: 12% discount, 15% allowed -> fine. Setup Service: 18% discount, 10% allowed -> violation.
  const result = calculateRisk({
    lines: [
      line({ subtotal: 100000, lineDiscount: 12, allowedDiscount: 15 }),
      line({ subtotal: 20000, lineDiscount: 18, allowedDiscount: 10 })
    ],
    tier: 'Gold',
    dealValue: 106400,
    marginPercent: 35
  });
  assert.ok(result.riskScore > 0);
  assert.ok(result.reasons.some((r) => r.includes('18%') && r.includes('exceeds allowed 10%')), 'the violating line must produce an explainable reason');
  assert.ok(result.marginLeakage > 0);
});

test('several small violations across many lines accumulate into a materially higher risk score than one line alone', () => {
  const oneViolation = calculateRisk({
    lines: [line({ subtotal: 10000, lineDiscount: 12, allowedDiscount: 10 })],
    tier: 'Silver', dealValue: 8800, marginPercent: 35
  });
  const manySmallViolations = calculateRisk({
    lines: [
      line({ subtotal: 10000, lineDiscount: 12, allowedDiscount: 10 }),
      line({ subtotal: 10000, lineDiscount: 13, allowedDiscount: 10 }),
      line({ subtotal: 10000, lineDiscount: 11, allowedDiscount: 10 }),
      line({ subtotal: 10000, lineDiscount: 14, allowedDiscount: 10 })
    ],
    tier: 'Silver', dealValue: 34800, marginPercent: 35
  });
  assert.ok(manySmallViolations.riskScore > oneViolation.riskScore);
});

test('margin below the configured minimum contributes its own risk reason, even with zero discount violations', () => {
  const result = calculateRisk({
    lines: [line({ subtotal: 10000, lineDiscount: 0, allowedDiscount: 15 })],
    tier: 'Gold',
    dealValue: 10000,
    marginPercent: 5 // below MIN_MARGIN_PERCENT (15)
  });
  assert.ok(result.riskScore > 0);
  assert.ok(result.reasons.some((r) => r.includes('margin') || r.includes('Margin')));
});

test('a high-risk quote (large violation, thin margin, low-tier customer) lands in a HIGH or VERY_HIGH band', () => {
  const result = calculateRisk({
    lines: [line({ subtotal: 500000, lineDiscount: 40, allowedDiscount: 5 })],
    tier: 'Bronze',
    dealValue: 300000,
    marginPercent: 2
  });
  assert.ok(['HIGH', 'VERY_HIGH'].includes(result.riskBand), `expected HIGH/VERY_HIGH, got ${result.riskBand}`);
});

test('risk score is always clamped to [0, 100] regardless of input extremity', () => {
  const result = calculateRisk({
    lines: [line({ subtotal: 10000000, lineDiscount: 99, allowedDiscount: 0 })],
    tier: 'Bronze',
    dealValue: 10000000,
    marginPercent: -50
  });
  assert.ok(result.riskScore >= 0 && result.riskScore <= 100);
});

test('the headline (weighted) discount reflects the value-weighted average across lines, not a simple average', () => {
  const result = calculateRisk({
    lines: [
      line({ subtotal: 90000, lineDiscount: 20, allowedDiscount: 20 }),
      line({ subtotal: 10000, lineDiscount: 0, allowedDiscount: 20 })
    ],
    tier: 'Gold', dealValue: 90000, marginPercent: 40
  });
  // weighted: (90000*20 + 10000*0) / 100000 = 18, not the simple average of 10
  assert.equal(result.headlineDiscount, 18);
});
