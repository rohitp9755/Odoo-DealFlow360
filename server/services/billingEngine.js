// Hybrid billing: splits a confirmed quote into a one-time invoice and,
// if any recurring line items exist, a recurring billing schedule.

const Invoice = require('../models/Invoice');

async function generateInvoicesForQuote(quote) {
  const invoices = [];

  if (quote.oneTimeTotal > 0) {
    invoices.push(await Invoice.create({
      quote: quote._id,
      type: 'one-time',
      amount: quote.oneTimeTotal,
      status: 'issued'
    }));
  }

  if (quote.recurringTotal > 0 && quote.recurringCycle) {
    const { periodStart, periodEnd } = nextPeriod(quote.recurringCycle);
    invoices.push(await Invoice.create({
      quote: quote._id,
      type: 'recurring',
      cycle: quote.recurringCycle,
      periodStart,
      periodEnd,
      amount: quote.recurringTotal,
      status: 'issued'
    }));
  }

  return invoices;
}

function nextPeriod(cycle) {
  const start = new Date();
  const end = new Date(start);
  if (cycle === 'monthly') end.setMonth(end.getMonth() + 1);
  else if (cycle === 'quarterly') end.setMonth(end.getMonth() + 3);
  else if (cycle === 'yearly') end.setFullYear(end.getFullYear() + 1);
  return { periodStart: start, periodEnd: end };
}

// Practical proration: refund/credit for the unused portion of the current cycle.
function calculateProration(invoice, cancelDate = new Date()) {
  const total = invoice.periodEnd - invoice.periodStart;
  const used = cancelDate - invoice.periodStart;
  const remainingFraction = Math.max(0, Math.min(1, (total - used) / total));
  return round2(invoice.amount * remainingFraction);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { generateInvoicesForQuote, calculateProration };
