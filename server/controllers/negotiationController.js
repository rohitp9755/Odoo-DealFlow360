const Quote = require('../models/Quote');
const Customer = require('../models/Customer');
const Negotiation = require('../models/Negotiation');
const NegotiationMessage = require('../models/NegotiationMessage');
const { extractRequestedDiscount, buildContext, decideOutcome, phraseCustomerMessage, templateMessage } = require('../services/negotiationEngine');
const { evaluateAndRouteApproval } = require('../services/approvalEngine');
const { computeQuote } = require('../services/quoteCalculator');
const { logAudit } = require('../services/auditService');

async function getOrCreateNegotiation(quoteId, customerId) {
  let negotiation = await Negotiation.findOne({ quote: quoteId });
  if (!negotiation) {
    negotiation = await Negotiation.create({ quote: quoteId, customer: customerId, messages: [], offers: [] });
  }
  return negotiation;
}

async function getForQuote(req, res, next) {
  try {
    const negotiation = await Negotiation.findOne({ quote: req.params.quoteId }).populate('messages');
    if (!negotiation) return res.json({ messages: [], offers: [], status: 'open' });
    res.json(negotiation);
  } catch (err) { next(err); }
}

// The flagship "AI Negotiation Agent" endpoint.
// Flow: parse -> deterministic decision -> (optional) AI phrasing -> persist -> respond.
// The LLM is NEVER allowed to change numbers; see negotiationEngine.js for the guardrail.
async function sendMessage(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.quoteId).populate('customer');
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message is required' });

    const negotiation = await getOrCreateNegotiation(quote._id, quote.customer._id);

    const customerMsg = await NegotiationMessage.create({ role: 'customer', content: message });
    negotiation.messages.push(customerMsg._id);

    const requestedDiscount = extractRequestedDiscount(message);

    let agentContent;
    let agentIntent = 'INFO';
    let offer = null;

    if (requestedDiscount === null) {
      agentContent = "I can help with pricing questions — could you tell me what discount you're hoping for?";
    } else {
      const context = await buildContext(quote, quote.customer);
      const decision = await decideOutcome(requestedDiscount, context);
      agentIntent = decision.intent;

      const phrased = await phraseCustomerMessage(decision, message);
      agentContent = phrased.message;

      offer = {
        requestedDiscount: decision.requestedDiscount,
        recommendedDiscount: decision.recommendedDiscount,
        requiresApproval: decision.requiresApproval,
        status: 'proposed'
      };
      negotiation.offers.push(offer);
      quote.stage = 'under_negotiation';
      await quote.save();
    }

    const agentMsg = await NegotiationMessage.create({
      role: 'agent',
      content: agentContent,
      intent: agentIntent,
      requestedDiscount: requestedDiscount ?? undefined
    });
    negotiation.messages.push(agentMsg._id);
    await negotiation.save();

    const populated = await Negotiation.findById(negotiation._id).populate('messages');
    const lastOffer = populated.offers[populated.offers.length - 1];

    res.json({
      negotiation: populated,
      offer: lastOffer ? { id: lastOffer._id, ...lastOffer.toObject() } : null
    });
  } catch (err) { next(err); }
}

// Customer clicks [Accept X%] or [Request Y% Approval].
async function counterOffer(req, res, next) {
  try {
    const { offerId, action } = req.body; // action: 'accept' | 'request_approval'
    const quote = await Quote.findById(req.params.quoteId).populate('customer');
    if (!quote) return res.status(404).json({ message: 'Quote not found' });

    const negotiation = await Negotiation.findOne({ quote: quote._id });
    if (!negotiation) return res.status(404).json({ message: 'Negotiation not found' });

    const offer = negotiation.offers.id(offerId) || negotiation.offers[negotiation.offers.length - 1];
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    if (action === 'accept') {
      const discountToApply = offer.recommendedDiscount;
      const rawLines = quote.lines.map(l => ({ product: l.product, quantity: l.quantity, lineDiscount: discountToApply }));
      const computed = await computeQuote({ customerId: quote.customer._id, orderDiscount: 0, lines: rawLines });

      Object.assign(quote, {
        lines: computed.lines, subtotal: computed.subtotal, discountAmount: computed.discountAmount,
        total: computed.total, totalCost: computed.totalCost, margin: computed.margin,
        marginPercent: computed.marginPercent, riskScore: computed.riskScore, riskBand: computed.riskBand,
        marginLeakage: computed.marginLeakage, stage: 'sent'
      });
      await quote.save();

      offer.status = 'accepted';
      negotiation.status = 'resolved';
      await negotiation.save();

      await logAudit({ user: req.user, action: 'NEGOTIATION_OFFER_ACCEPTED', entity: 'Quote', entityId: quote._id, newValue: { discount: discountToApply } });

      return res.json({ quote, offer });
    }

    if (action === 'request_approval') {
      const quoteForApproval = {
        _id: quote._id, riskScore: quote.riskScore, riskBand: quote.riskBand,
        marginLeakage: quote.marginLeakage, reasons: [`Customer requested ${offer.requestedDiscount}% via negotiation chat.`]
      };
      const { requiresApproval, approval } = await evaluateAndRouteApproval(quoteForApproval, req.user, offer.requestedDiscount);

      offer.status = 'proposed';
      offer.approval = approval?._id;
      quote.stage = requiresApproval ? 'pending_approval' : 'approved';
      await quote.save();
      await negotiation.save();

      const confirmMsg = await NegotiationMessage.create({
        role: 'system',
        content: requiresApproval
          ? `Your request for ${offer.requestedDiscount}% has been submitted for approval.`
          : `Your request for ${offer.requestedDiscount}% has been approved automatically.`,
        intent: 'APPROVAL_SUBMITTED'
      });
      negotiation.messages.push(confirmMsg._id);
      await negotiation.save();

      return res.json({ quote, offer, approval, requiresApproval });
    }

    return res.status(400).json({ message: 'Invalid action' });
  } catch (err) { next(err); }
}

module.exports = { getForQuote, sendMessage, counterOffer };
