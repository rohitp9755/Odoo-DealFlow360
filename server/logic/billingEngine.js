export function computeBilling(evaluatedLines, quotationLines, products) {
  const oneTime = [];
  const recurring = [];

  for (const evalLine of evaluatedLines) {
    const rawLine = quotationLines.find((l) => l.id === evalLine.lineId);
    const product = products.find((p) => p.id === rawLine.productId);
    if (product.type === "recurring") {
      recurring.push({ ...evalLine, billingFrequency: product.billingFrequency });
    } else {
      oneTime.push(evalLine);
    }
  }

  const oneTimeTotal = round(oneTime.reduce((s, l) => s + l.total, 0));
  const recurringTotal = round(recurring.reduce((s, l) => s + l.total, 0));

  const nextBillingDate = recurring.length > 0 ? addOneCycle(new Date(), recurring[0].billingFrequency) : null;

  return {
    oneTimeLines: oneTime,
    recurringLines: recurring,
    oneTimeTotal,
    recurringTotal,
    nextBillingDate,
    hasRecurring: recurring.length > 0
  };
}

function addOneCycle(date, frequency) {
  const d = new Date(date);
  if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (frequency === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

function round(n) {
  return Math.round(n * 100) / 100;
}
