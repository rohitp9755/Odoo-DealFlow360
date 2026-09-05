# DealFlow360 — Architecture

## Request flow
```
React (Vite)
   ↓ axios
Express routes
   ↓
Controllers (thin — no business rules)
   ↓
Services / Engines (all business logic lives here)
   ├── discountEngine        tier + category allowed-discount lookup
   ├── quoteCalculator       THE single source of truth for every number
   │                         on a quote (subtotal/discount/total/margin) —
   │                         frontend numbers are optimistic UI only
   ├── riskEngine            deterministic, explainable 0-100 risk score
   ├── approvalEngine        routes to manager/finance/escalation,
   │                         builds human-readable reason trails,
   │                         processes approve/reject/return + audit log
   ├── recommendationEngine  hybrid score: co-purchase + similarity +
   │                         margin + inventory + promotion
   ├── negotiationEngine     parses intent, computes the ONLY numbers
   │                         that matter deterministically, optionally
   │                         asks the LLM to phrase the reply
   ├── aiService             thin Anthropic API wrapper with timeout +
   │                         JSON parsing; every caller has a fallback
   ├── warehouseEngine       cheapest-shipping-first greedy allocation
   │                         + backorder creation
   ├── billingEngine         one-time + recurring invoice generation,
   │                         proration on cancellation
   └── dealHealthEngine      composite 0-100 health score + anomaly
                             alerts (stalled deal, unusual discount,
                             approval delay, inventory risk)
   ↓
Mongoose models
   ↓
MongoDB Atlas
```

## AI safety architecture (both mandatory AI features)

```
LLM (optional, via aiService.callStructuredLLM)
   ↓ structured JSON only, generated under a strict system prompt
Backend validation
   ↓ numeric/enum sanity checks; guardrail rejects unexplained numbers
Deterministic engine (discountEngine / approvalEngine / recommendationEngine)
   ↓ this layer — not the LLM — decides every business outcome
MongoDB
```

Concretely, for the Negotiation Agent:
- `negotiationEngine.decideOutcome()` is pure, deterministic, and unit-testable:
  given `requestedDiscount` and `{ autonomousDiscount }`, it returns the
  exact same `{ intent, recommendedDiscount, requiresApproval }` every time,
  with zero LLM involvement.
- `negotiationEngine.phraseCustomerMessage()` is the *only* place the LLM is
  called, and it is only ever asked to phrase a message around numbers the
  backend already decided — never to decide the numbers itself. A guardrail
  scans the LLM's output for any number that wasn't explicitly provided to
  it, and falls back to a plain template if one is found.
- If `ANTHROPIC_API_KEY` is unset, or the API call errors/times out (8s
  hard limit), `phraseCustomerMessage()` transparently returns the template
  message. Nothing downstream needs to know whether the AI ran or not.

For the Recommendation Engine, there is no LLM call at all by design — it's
a fully deterministic hybrid scorer (see `recommendationEngine.js`), which
means it works identically with or without any external AI service, and
satisfies the spec's Vector Search fallback requirement from day one.

## Data model highlights
- `Quote.lines` is an **embedded array** of `QuoteLineSchema` sub-documents
  (not a separate collection) — a line only ever exists in the context of
  its quote, and embedding keeps `quoteCalculator.computeQuote()` atomic.
- `Approval.steps` embeds one sub-document per required approver role
  (`manager` / `finance` / `escalation`), each independently
  pending/approved/rejected — this is what lets a discount request need
  *both* Manager and Finance sign-off without two separate collections.
- `AuditLog` is a flat, append-only collection written by every mutating
  service call (`logAudit()` in `auditService.js`), never the frontend.
- Customer-role users are linked via `User.customer`, and every
  customer-facing controller (`customerPortalController.sanitizeQuote`)
  strips `cost`, `margin`, `marginPercent`, `riskScore`, `riskBand`,
  `marginLeakage`, `allowedDiscount`, `categoryCeiling`, and `violation`
  before the response ever leaves the server — this is enforced at the
  controller layer, not just hidden in the UI.

## Why some P2 items were left out
Per the prompt's own priority system (P0 must work, P1 should stand out,
P2 only if time remains), Socket.IO real-time collaboration, the natural-
language quote builder, and PDF export were left out of this pass so that
every P0 and P1 feature listed in the brief is fully wired end-to-end
rather than having a wider set of half-finished features. All of those P2
items are additive — they don't require touching the discount/approval/
negotiation engines — so they can be layered on without risk to the core
demo.
