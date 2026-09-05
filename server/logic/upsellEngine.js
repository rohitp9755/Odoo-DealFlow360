export function getUpsellSuggestions(quotationLines, upsellRules, products) {
  const currentProductIds = new Set(quotationLines.map((l) => l.productId));
  const suggestionMap = new Map();

  for (const line of quotationLines) {
    const rules = upsellRules[line.productId] || [];
    for (const rule of rules) {
      if (currentProductIds.has(rule.productId)) continue;
      if (suggestionMap.has(rule.productId)) continue;
      const product = products.find((p) => p.id === rule.productId);
      const marginImpact = product.price - product.cost;
      suggestionMap.set(rule.productId, {
        productId: product.id,
        productName: product.name,
        reason: rule.reason,
        confidence: rule.confidence,
        marginImpact: Math.round(marginImpact),
        price: product.price
      });
    }
  }

  return Array.from(suggestionMap.values()).sort((a, b) => b.confidence - a.confidence);
}
