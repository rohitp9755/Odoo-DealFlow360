// AI Negotiation Agent — orchestration layer.
//
// SAFETY ARCHITECTURE (see prompt spec sections 22-25):
//   customer message -> extract requested discount -> backend computes the
//   ONLY numbers that matter (recommendedDiscount, requiresApproval) using
//   the deterministic discount/approval engines -> optionally ask the LLM
//   only to phrase a friendly customerMessage -> backend re-validates that
//   message mentions no forbidden figures -> everything is persisted.
//
// The LLM NEVER decides requiresApproval or recommendedDiscount itself.
// If the AI API is down, a deterministic template message is used instead
// and the app keeps working end-to-end.

const { getTierAutonomousDiscount } = require('./discountEngine');
const { getRequiredApprovers } = require('./approvalEngine');
const { callStructuredLLM } = require('./aiService');
const config = require('../config/businessConfig');

// Very small, deliberately simple parser: looks for a number followed by %
// (or the word "percent"/"discount") in the customer's message.
function extractRequestedDiscount(message) {
  const pctMatch = message.match(/(\d{1,2}(?:\.\d+)?)\s*%/);
  if (pctMatch) return parseFloat(pctMatch[1]);
  const wordMatch = message.match(/(\d{1,2}(?:\.\d+)?)\s*(percent|percentage)/i);
  if (wordMatch) return parseFloat(wordMatch[1]);
  return null;
}

async function buildContext(quote, customer) {
  const autonomousDiscount = await getTierAutonomousDiscount(customer.tier);
  return {
    customerTier: customer.tier,
    autonomousDiscount,
    approvalThresholds: config.APPROVAL_THRESHOLDS,
    currentDiscount: quote.discountAmount > 0 && quote.subtotal > 0
      ? round2((quote.discountAmount / quote.subtotal) * 100)
      : 0,
    dealValue: quote.total,
    riskBand: quote.riskBand
  };
}

// The ONLY function that decides business outcome. Deterministic & auditable.
async function decideOutcome(requestedDiscount, context) {
  const { autonomousDiscount } = context;

  if (requestedDiscount <= autonomousDiscount) {
    return {
      intent: 'ACCEPT',
      requestedDiscount,
      recommendedDiscount: requestedDiscount,
      requiresApproval: false,
      reason: `Requested discount is within the autonomous limit for a ${context.customerTier} customer (${autonomousDiscount}%).`
    };
  }

  const approversRequired = await getRequiredApprovers(requestedDiscount);
  return {
    intent: 'COUNTER_OFFER',
    requestedDiscount,
    recommendedDiscount: autonomousDiscount,
    requiresApproval: approversRequired.length > 0,
    approversRequired,
    reason: `Requested discount (${requestedDiscount}%) exceeds the autonomous limit (${autonomousDiscount}%) and requires: ${approversRequired.join(' + ') || 'none'}.`
  };
}

// Optionally ask the LLM to phrase a natural customer-facing message for a
// decision we already made deterministically. The LLM gets ONLY the numbers
// it's allowed to talk about — never cost, margin, or approval thresholds.
async function phraseCustomerMessage(decision, customerMessage) {
  const systemPrompt = `You are a friendly B2B sales negotiation assistant.
You will be given a customer's message and a decision that has ALREADY been made by the business system.
Respond with ONLY a JSON object: {"customerMessage": "..."}.
Rules:
- Never mention margin, cost, internal approval thresholds, or risk scores.
- Only reference the exact numbers given to you: requestedDiscount, recommendedDiscount, requiresApproval.
- Keep it to 1-3 short sentences, warm and professional.
- If requiresApproval is true, offer to submit the request for approval.`;

  const userPrompt = JSON.stringify({
    customerMessage,
    intent: decision.intent,
    requestedDiscount: decision.requestedDiscount,
    recommendedDiscount: decision.recommendedDiscount,
    requiresApproval: decision.requiresApproval
  });

  const result = await callStructuredLLM({ systemPrompt, userPrompt });

  if (result.ok && typeof result.data?.customerMessage === 'string') {
    const msg = result.data.customerMessage;
    // Basic guardrail: reject if it leaks numbers we never sent it.
    const allowedNumbers = new Set([
      String(decision.requestedDiscount),
      String(decision.recommendedDiscount)
    ]);
    const mentionedNumbers = msg.match(/\d+(\.\d+)?/g) || [];
    // Flag any number that isn't one of the two numbers we explicitly allowed.
    // Small numbers (e.g. "1-3 business days") are harmless; anything that could
    // plausibly be a stray discount/margin figure is not.
    const leaksUnknownNumber = mentionedNumbers.some(n => !allowedNumbers.has(n) && Number(n) > 1);
    if (!leaksUnknownNumber) {
      return { message: msg, aiGenerated: true };
    }
  }

  return { message: templateMessage(decision), aiGenerated: false };
}

function templateMessage(decision) {
  if (decision.intent === 'ACCEPT') {
    return `Absolutely — I can offer you ${decision.requestedDiscount}% right away.`;
  }
  if (decision.requiresApproval) {
    return `I can offer ${decision.recommendedDiscount}% immediately. A discount of ${decision.requestedDiscount}% requires additional approval — would you like me to submit that request?`;
  }
  return `I can offer ${decision.recommendedDiscount}% immediately.`;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

module.exports = { extractRequestedDiscount, buildContext, decideOutcome, phraseCustomerMessage, templateMessage };
