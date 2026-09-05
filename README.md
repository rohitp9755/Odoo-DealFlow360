# DealFlow360

An intelligent, self-governing B2B sales operations platform built for a 24-hour hackathon.

## Run it

```
cd server
npm install
npm start
```

Open **http://localhost:4000** in your browser. That's it — one server serves both the API and the frontend, no build step, no database setup.

Node.js 18+ required. No external services, API keys, or database installation needed — everything runs in memory and reseeds on restart.

## What's implemented (and actually computed, not hardcoded)

- **Discount risk engine** — every line is checked against `min(customer tier limit, product category limit)`. Overage per line is summed into a 0–100 blended risk score, which determines whether the quotation needs no approval, Sales Manager approval, or Sales Manager + Finance approval. The "why" reason string is generated from the actual offending line, not a static message.
- **Approval workflow** — routes automatically based on the risk score above; approve/reject/request-revision all write real audit log entries.
- **AI upsell panel** — rule-based co-purchase suggestions (seeded, structured so a real ML model could slot in later) with margin impact computed from each product's actual price/cost.
- **Warehouse fulfillment split** — greedy allocation across warehouses by live stock levels, with backorder detection when no warehouse has enough.
- **Hybrid billing** — one-time and recurring lines are split automatically based on product type, with a computed next billing date.
- **Customer negotiation portal** — a separate, restricted view (`/#/portal/:id`). A customer's counter-discount request re-runs the risk engine live; if it now exceeds the threshold, the quotation is automatically kicked back into the approval workflow — it cannot bypass governance.
- **Deal health dashboard** — KPIs, risk distribution, and stalled/anomaly alerts computed from the live quotation data, not static numbers.
- **Audit trail** — every discount change, approval, and negotiation is logged with user, timestamp, and old/new values.

## What's intentionally simplified for the 24h window

- No auth/login database — role selection on the login screen is a UI-only demo switch (see `Notes on scope` below).
- No persistent database — state lives in memory and resets when the server restarts. Swapping in SQLite/Postgres would mean replacing `server/store.js` with real queries; the route and logic layers don't need to change.
- No subscription proration/cancellation/refund logic, no multi-currency, no notifications system, no admin UI for editing discount tiers (they're configured in `server/data/seed.js`).
- Warehouse split only applies to physical (Hardware) line items — services and subscriptions aren't warehouse-fulfilled, by design.

## Project structure

```
dealflow360/
├── server/                    Express API + static file server
│   ├── index.js                Entry point, mounts routes, serves /client
│   ├── store.js                In-memory data store + audit helper
│   ├── data/
│   │   └── seed.js             Customers, products, warehouses, discount tiers, seed quotations
│   ├── logic/                  Pure business logic, no Express dependency
│   │   ├── riskEngine.js        Blended discount risk + approval routing
│   │   ├── upsellEngine.js      Co-purchase recommendation matching
│   │   ├── warehouseEngine.js   Stock allocation + backorder detection
│   │   └── billingEngine.js     One-time vs recurring split
│   └── routes/
│       ├── masterData.js       Customers / products / warehouses
│       ├── quotations.js       Quotation CRUD, submit, warehouse split, confirm
│       ├── approvals.js        Approval center actions
│       ├── portal.js           Customer-facing negotiation endpoints
│       └── dashboard.js        Aggregated KPIs and alerts
└── client/                     No-build vanilla JS SPA
    ├── index.html
    ├── css/styles.css          Design system (dark, teal/violet accent)
    └── js/
        ├── api.js               Fetch wrapper for the API
        └── app.js                Hash-routed views: dashboard, quotations, builder, approvals, portal
```

## Demo script (matches the official test flow)

1. **Login** as Sales Representative → land on the Dashboard.
2. Go to **Quotations → + New Quotation**, pick a Gold-tier customer (ABC Corp or Global Systems).
3. Add **Enterprise Laptop** (qty 10, 12% discount) — stays SAFE.
4. Add **Installation Service** (qty 1, **18%** discount) — instantly flagged OVER LIMIT, risk panel updates live, "why" reason appears.
5. Accept an **AI upsell recommendation** (e.g. Extended Warranty) — watch the total and margin update.
6. Click **Submit for Approval** — quotation routes to the Approval Center automatically.
7. Switch role to **Sales Manager** (top of sidebar → Switch role), go to **Approvals**, approve it (escalates to Finance if the blended risk score is high enough — approve again as Finance).
8. Back on the quotation, click **Compute Warehouse Split** — see the live stock allocation.
9. Copy the **Portal Link** and open it (or use the sample link on the login screen) to act as the **customer**: request a bigger discount on a line.
10. Watch it **automatically re-enter the approval workflow** — go re-approve it.
11. Back in the portal, click **Confirm Quotation**.
12. Return to the Dashboard — deal health, pipeline stage counts, and alerts all reflect the change in real time.

## What we'd build next with more time

- Real persistence (Postgres) and JWT-based auth per role.
- A trained recommendation model replacing the seeded upsell rules.
- Subscription proration, cancellation, and credit-note logic.
- Admin UI for configuring discount tiers and approval chains instead of editing `seed.js`.
- Notifications (email/Slack) on approval requests and stalled-deal alerts.
