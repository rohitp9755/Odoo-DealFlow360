const Customer = require('../models/Customer');
const Product = require('../models/Product');
const { getAllowedLineDiscount } = require('./discountEngine');
const { calculateRisk } = require('./riskEngine');

// Core recalculation function — the single source of truth for quote numbers...
// Input: customerId, orderDiscount, and raw lines [{ product, quantity, lineDiscount }]
// Output: fully computed lines + quote-level totals + risk. NEVER trusts client-sent totals.
async function computeQuote({ customerId, orderDiscount = 0, lines }) {
  const customer = await Customer.findById(customerId);
  if (!customer) {
    const err = new Error('Customer not found');
    err.status = 404;
    throw err;
  }

  const productIds = lines.map(l => l.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map(p => [String(p._id), p]));

  let subtotal = 0, discountAmount = 0, total = 0, totalCost = 0;
  let oneTimeTotal = 0, recurringTotal = 0, recurringCycle = null;

  const computedLines = [];

  for (const rawLine of lines) {
    const product = productMap.get(String(rawLine.product));
    if (!product) {
      const err = new Error(`Product not found: ${rawLine.product}`);
      err.status = 400;
      throw err;
    }
    const quantity = Math.max(1, Number(rawLine.quantity) || 1);
    const requestedDiscount = Math.max(0, Number(rawLine.lineDiscount) || 0);

    const { categoryCeiling, allowed } = await getAllowedLineDiscount(customer.tier, product.category);
    const violation = Math.max(0, requestedDiscount - allowed);

    const lineSubtotal = product.price * quantity;
    const lineDiscountAmount = lineSubtotal * (requestedDiscount / 100);
    const lineTotal = lineSubtotal - lineDiscountAmount;
    const lineCost = product.cost * quantity;
    const lineMargin = lineTotal - lineCost;
    const lineMarginPercent = lineTotal > 0 ? (lineMargin / lineTotal) * 100 : 0;

    subtotal += lineSubtotal;
    discountAmount += lineDiscountAmount;
    total += lineTotal;
    totalCost += lineCost;

    if (product.isRecurring) {
      recurringTotal += lineTotal;
      recurringCycle = product.billingCycle;
    } else {
      oneTimeTotal += lineTotal;
    }

    computedLines.push({
      product: product._id,
      quantity,
      unitPrice: product.price,
      unitCost: product.cost,
      lineDiscount: requestedDiscount,
      allowedDiscount: allowed,
      categoryCeiling,
      violation,
      subtotal: round2(lineSubtotal),
      discountAmount: round2(lineDiscountAmount),
      total: round2(lineTotal),
      margin: round2(lineMargin),
      marginPercent: round2(lineMarginPercent)
    });
  }

  // Apply order-level discount on top (rare, but supported)
  const orderDiscountAmount = total * (Math.max(0, Number(orderDiscount) || 0) / 100);
  const finalTotal = total - orderDiscountAmount;
  const finalMargin = finalTotal - totalCost;
  const finalMarginPercent = finalTotal > 0 ? (finalMargin / finalTotal) * 100 : 0;

  const risk = calculateRisk({
    lines: computedLines,
    tier: customer.tier,
    dealValue: finalTotal,
    marginPercent: finalMarginPercent
  });

  return {
    customer,
    lines: computedLines,
    subtotal: round2(subtotal),
    discountAmount: round2(discountAmount + orderDiscountAmount),
    total: round2(finalTotal),
    totalCost: round2(totalCost),
    margin: round2(finalMargin),
    marginPercent: round2(finalMarginPercent),
    oneTimeTotal: round2(oneTimeTotal),
    recurringTotal: round2(recurringTotal),
    recurringCycle,
    riskScore: risk.riskScore,
    riskBand: risk.riskBand,
    marginLeakage: risk.marginLeakage,
    reasons: risk.reasons
  };
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { computeQuote, round2 };
