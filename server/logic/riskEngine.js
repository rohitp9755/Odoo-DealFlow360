import { tierDiscountLimits, categoryDiscountLimits, approvalThresholds } from "../data/seed.js";

export function allowedDiscountFor(customerTier, category) {
  const tierMax = tierDiscountLimits[customerTier] ?? 0;
  const categoryMax = categoryDiscountLimits[category] ?? 0;
  return Math.min(tierMax, categoryMax);
}

export function evaluateQuotation(quotation, customer, products) {
  const lineEvaluations = quotation.lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    const allowed = allowedDiscountFor(customer.tier, product.category);
    const overage = Math.max(0, line.discount - allowed);
    const lineSubtotal = product.price * line.qty;
    const lineDiscountValue = lineSubtotal * (line.discount / 100);
    const lineTotal = lineSubtotal - lineDiscountValue;
    const lineCost = product.cost * line.qty;
    const margin = lineTotal - lineCost;
    const marginPct = lineTotal > 0 ? (margin / lineTotal) * 100 : 0;

    return {
      lineId: line.id,
      productId: product.id,
      productName: product.name,
      category: product.category,
      qty: line.qty,
      unitPrice: product.price,
      discount: line.discount,
      allowedDiscount: allowed,
      overage,
      status: overage > 0 ? "OVER_LIMIT" : "SAFE",
      subtotal: round(lineSubtotal),
      discountValue: round(lineDiscountValue),
      total: round(lineTotal),
      margin: round(margin),
      marginPct: round(marginPct),
      reason: overage > 0
        ? `${product.category} discount exceeds allowed threshold by ${overage}%`
        : null
    };
  });

  const totalOverage = lineEvaluations.reduce((sum, l) => sum + l.overage, 0);
  const riskScore = Math.min(100, Math.round(totalOverage * 8));

  let approvalLevel = "none";
  if (riskScore > 0 && riskScore <= approvalThresholds.managerOnly) {
    approvalLevel = "manager";
  } else if (riskScore > approvalThresholds.managerOnly) {
    approvalLevel = "manager_finance";
  }

  const subtotal = round(lineEvaluations.reduce((s, l) => s + l.subtotal, 0));
  const discountValue = round(lineEvaluations.reduce((s, l) => s + l.discountValue, 0));
  const total = round(lineEvaluations.reduce((s, l) => s + l.total, 0));
  const margin = round(lineEvaluations.reduce((s, l) => s + l.margin, 0));
  const marginPct = total > 0 ? round((margin / total) * 100) : 0;

  const reasons = lineEvaluations.filter((l) => l.reason).map((l) => l.reason);

  return {
    lines: lineEvaluations,
    riskScore,
    riskLevel: riskScore === 0 ? "LOW" : riskScore <= approvalThresholds.managerOnly ? "MODERATE" : "HIGH",
    approvalLevel,
    reasons,
    subtotal,
    discountValue,
    total,
    margin,
    marginPct
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}
