# DealFlow360
**An Intelligent, Self-Governing Sales Operations Platform**

Built for a 24-hour hackathon. React + Vite + Tailwind frontend, Node/Express +
MongoDB Atlas backend, with two mandatory AI features (Negotiation Agent +
Product Recommendation Engine) layered on top of a deterministic discount
governance and approval engine.

## Stack
- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas
- **AI:** Anthropic Claude API (optional) with a deterministic rule-based
  fallback — the app works fully even with no API key set.

## Project structure
```
server/
  models/       Mongoose schemas (19 collections)
  services/     ALL business logic lives here — discount engine, risk engine,
                approval engine, negotiation engine, recommendation engine,
                warehouse allocation, billing, deal health
  controllers/  Thin HTTP layer — calls services, never contains business rules
  routes/       Express routers, wired with auth + role middleware
  middleware/   JWT auth, role guards, central error handler
  seed/         Deterministic demo data generator
  config/       DB connection + centralized business config defaults

client/
  src/
    pages/       One file per screen (login, quote list/builder, approvals,
                 dashboard, admin settings, customer portal)
    components/  Reusable UI (sidebar, badges, recommendation panel, chat)
    context/     Auth context (JWT + user in localStorage)
    services/    Axios client with auth interceptor
```

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
# Fill in MONGODB_URI (MongoDB Atlas connection string) and JWT_SECRET.
# ANTHROPIC_API_KEY is optional — leave blank to run on the deterministic
# negotiation fallback only.
npm install
npm run seed     # wipes and re-seeds demo data (users, products, quotes...)
npm run dev       # starts on :5000
```

### 2. Frontend
```bash
cd client
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev             # starts on :5173
```

### 3. Log in
After seeding, these accounts exist (password for all: `password123`):

| Role     | Email                         |
|----------|--------------------------------|
| Rep      | rep@dealflow360.com            |
| Manager  | manager@dealflow360.com        |
| Finance  | finance@dealflow360.com        |
| Admin    | admin@dealflow360.com          |
| Customer | customer@dealflow360.com       |

The login screen has one-click buttons to fill in each demo email.

## The 5-minute demo flow
1. Log in as **Rep** → Dashboard → Quotes → open the seeded Acme Technologies
   quote (created with a Laptop Pro line at 15% discount, above the 10%
   Hardware ceiling).
2. Generate **AI Recommendations** → add the suggested USB-C Docking Station.
3. Click **Submit** → the app explains exactly why approval is required
   (which lines violate which ceiling, estimated margin leakage, risk score).
4. Log in as **Manager** → **Approvals** → open it, read the explanation,
   **Approve**. Log in as **Finance** and approve the second step if the
   discount crossed into the Finance band.
5. Log in as **Customer** → **My Quotes** → open the Acme quote → the
   **Deal Negotiation Assistant** already has history; type e.g.
   *"Can you give me 18% discount if I confirm today?"* and watch the agent
   counter-offer within policy, then **Confirm Quotation**.
6. Back as Rep/Admin, open the quote → **Allocate Warehouses** (watch it
   split across Mumbai/Delhi/Bangalore by cheapest shipping first),
   **Generate Invoices** (one-time + recurring split), **Calculate** Deal
   Health.

## Critical safety architecture (AI Negotiation Agent)
The LLM is **never** allowed to touch MongoDB or decide business outcomes.
Every negotiation turn works like this:

```
customer message
   → extract requested discount (simple parser)
   → decideOutcome() — 100% deterministic: tier autonomous limit,
     approval thresholds from DiscountTier / ApprovalRule collections
   → (optional) ask the LLM ONLY to phrase a friendly customerMessage,
     with a guardrail that rejects any AI output mentioning numbers
     it wasn't explicitly given
   → backend persists NegotiationMessage / NegotiationOffer
   → if the customer accepts a request-approval action, the existing
     deterministic Approval Engine creates the approval — same code
     path a rep's manual discount request uses
```

If `ANTHROPIC_API_KEY` is unset or the API call fails/times out, the agent
falls back to a template message built from the same deterministic decision
— the demo never breaks because of an AI outage.

## What's implemented vs. simplified for hackathon scope
**Fully implemented (P0 + P1):** auth & roles, admin config for discount
tiers/category ceilings/approval rules/warehouses, quote builder with
backend-authoritative live calculation, discount governance + deterministic
explainable risk scoring, margin leakage, approval workflow with audit
trail, AI recommendation engine (co-purchase + similarity + margin +
inventory + promotion scoring), AI negotiation agent with LLM+fallback,
customer portal with real data restriction (no cost/margin/risk ever sent),
warehouse allocation with backorders, hybrid one-time+recurring billing,
deal health scoring with anomaly alerts, executive dashboard with real
Mongo-aggregated charts.

**Simplified (P2, by design per the priority rules):** no real-time
Socket.IO collaboration, no natural-language quote builder, no PDF export
(CSV/JSON only via existing endpoints), no MongoDB Atlas Vector Search
(category/tag similarity fallback is used from the start, since the spec
requires the app to work without an external embedding API anyway).

## Notes
- This was generated from a blank repo — there was no existing baseline to
  inspect, so it's a fresh implementation of the full spec rather than an
  extension of prior code.
- The backend was syntax-checked and boot-tested (all modules load with no
  Mongo connection) and the frontend was build-tested with `vite build`
  (zero errors) inside the environment that generated this repo — but it
  has **not** been run end-to-end against a live MongoDB Atlas cluster.
  Budget time in your hackathon to run `npm run seed` against a real
  cluster and walk the Quick Test Flow before the demo.
