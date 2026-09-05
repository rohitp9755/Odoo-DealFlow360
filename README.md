<div align="center">

# DealFlow360

**Every quote governs itself.**

![Node](https://img.shields.io/badge/node-18%2B-4d7466?style=flat-square)
![Build Steps](https://img.shields.io/badge/build%20steps-0-7fb69e?style=flat-square&labelColor=161a1a)
![Logic Engines](https://img.shields.io/badge/logic%20engines-4-c98a6b?style=flat-square&labelColor=161a1a)
![License](https://img.shields.io/badge/license-MIT-576560?style=flat-square&labelColor=161a1a)

DealFlow360 evaluates risk, routes approvals, splits warehouse stock, and recommends upsells the moment a rep types a discount — no hardcoded numbers, no bypassing governance.

**[▶ Open the interactive live demo](./README.html)** — floating background, a working risk-score slider, and an expandable API panel. GitHub strips `<script>`/`<style>` from rendered markdown, so that version only runs when opened directly or hosted (e.g. GitHub Pages) — this file below is the GitHub-native companion.

</div>

---

## Contents

- [Overview](#overview)
- [How the risk score works](#how-the-risk-score-works)
- [Features](#features)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [API reference](#api-reference)
- [Demo script](#demo-script)
- [Scope notes](#scope-notes)

## Overview

| | |
|---|---|
| Pure logic engines | 4 |
| Build steps | 0 |
| Role-based views | 3 |
| Risk scale | 0–100 pts |

Every quote line is checked against the stricter of two ceilings: the customer's tier limit and the product category's limit. If a discount exceeds that ceiling, the overage drives a risk score, which decides the approval path — auto-approved, sales manager, or finance.

## How the risk score works

```text
allowed  = min(tierLimit, categoryLimit)
overage  = max(0, discountGiven - allowed)
risk     = min(100, overage * 6)

risk == 0         → auto-approved
0 < risk <= 40    → sales manager
risk > 40         → finance
```

This is the exact function the rep's quote builder calls, and the same one that re-runs when a customer negotiates from the customer portal — there's no separate, looser path for negotiated deals.

<details>
<summary><strong>Try it — example walkthrough (click to expand)</strong></summary>

<br>

| Customer tier | Category | Discount given | Allowed | Overage | Risk | Route |
|---|---|---|---|---|---|---|
| Gold (15%) | Services (10%) | 12% | 10% | 2% | 12 | Sales manager |
| Gold (15%) | Services (10%) | 18% | 10% | 8% | 48 | Finance |
| Platinum (25%) | Hardware (15%) | 12% | 15% | 0% | 0 | Auto-approved |

For the fully live, slider-driven version of this table, open [`README.html`](./README.html).

</details>

## Features

| Feature | What it actually does |
|---|---|
| AI upsell panel | Margin = `price − cost` per suggestion, ranked by seeded confidence. Recalculates instantly on add. |
| Warehouse split | Greedy allocation across warehouses by preference, pulling real per-warehouse stock. Backorders are computed, not assumed. |
| Hybrid billing | Lines split one-time vs. recurring by product type, with a computed next billing date. |
| Customer negotiation | A counter-discount re-invokes the same risk engine the rep uses — no better deal than governance allows. |
| Audit trail | Every change, submission, approval, and rejection writes a real log entry: user, action, timestamp, old/new values. |
| Zero hardcoding | Every number on screen is computed from real logic against seeded data — nothing is a static prop. |

## Architecture

The logic layer has zero dependency on Express, so the same function used by the rep's builder is reused by the customer portal's negotiation flow. Swapping the in-memory store for Postgres later only touches `store.js`.

```text
Client (hash-routed SPA, no build step)
        ⇄
Server (Express routes)
        →
Logic layer (pure functions, no Express)
    ├── riskEngine.js
    ├── upsellEngine.js
    ├── warehouseEngine.js
    └── billingEngine.js
        →
Store (in-memory, seeded on boot)
```

## Quick start

No `npm install` beyond the standard dependency install, no `.env`, no seed script. Four customers, seven products, three warehouses, and two in-flight quotations are ready on boot.

```bash
cd server
npm start

# then open
http://localhost:4000

# requirements: Node.js 18+, nothing else
```

## Project structure

```text
dealflow360/
├── README.md
├── README.html              interactive live demo (open directly, or host via GitHub Pages)
├── docs/screenshots/
├── server/                  Express API + static file server
│   ├── index.js
│   ├── store.js             in-memory store + audit helper
│   ├── data/seed.js
│   ├── logic/                pure business logic, no Express
│   │   ├── riskEngine.js
│   │   ├── upsellEngine.js
│   │   ├── warehouseEngine.js
│   │   └── billingEngine.js
│   └── routes/               masterData · quotations · approvals · portal · dashboard
└── client/                   no-build vanilla JS SPA
```

## Tech stack

`Node.js (ES modules)` · `Express 4` · `In-memory JS store` · `Vanilla JS SPA` · `Hand-rolled hash router` · `Hand-written CSS`

## API reference

<details>
<summary><strong>Master data</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/customers` | List all customers |
| `GET` | `/api/products` | List all products |
| `GET` | `/api/warehouses` | List all warehouses with stock |

</details>

<details>
<summary><strong>Quotations</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/quotations` | List all quotations with summary + risk |
| `GET` | `/api/quotations/:id` | Full detail — evaluation, upsell, billing, audit log |
| `POST` | `/api/quotations` | Create a draft `{ customerId }` |
| `POST` | `/api/quotations/:id/lines` | Add a line `{ productId, qty, discount }` |
| `PATCH` | `/api/quotations/:id/lines/:lineId` | Update qty/discount |
| `DELETE` | `/api/quotations/:id/lines/:lineId` | Remove a line |
| `POST` | `/api/quotations/:id/upsell/:productId` | Accept an AI recommendation |
| `POST` | `/api/quotations/:id/submit` | Run risk engine, route for approval or auto-approve |
| `POST` | `/api/quotations/:id/warehouse-split/accept` | Compute and accept fulfillment split |
| `POST` | `/api/quotations/:id/confirm` | Confirm order, mark invoice paid |

</details>

<details>
<summary><strong>Approvals</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/approvals` | List quotations pending a decision |
| `POST` | `/api/approvals/:id/decide` | `{ decision: approve \| reject \| revise, role, reason }` |

</details>

<details>
<summary><strong>Customer portal</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/portal/:id` | Customer-safe view of a quotation |
| `POST` | `/api/portal/:id/negotiate` | `{ lineId, requestedDiscount, comment }` — re-runs the risk engine |
| `POST` | `/api/portal/:id/confirm` | Customer confirms an approved quotation |

</details>

<details>
<summary><strong>Dashboard</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | KPIs, deal health split, alerts, pipeline-by-stage |

</details>

## Demo script

<details open>
<summary><strong>The 8-step flow, run before presenting</strong></summary>

1. **Login** as Sales Representative → lands on the Dashboard.
2. **New Quotation** → pick a Gold-tier customer.
3. Add **Enterprise Laptop**, qty 10, 12% discount → stays **safe**.
4. Add **Installation Service**, 18% discount → instantly flagged **over limit**.
5. Accept an **AI upsell** → total and margin update immediately.
6. **Submit for Approval** → quotation routes automatically.
7. Switch to **Sales Manager** → approve (escalates to Finance if risk is high).
8. **Compute Warehouse Split** → send the portal link, negotiate, and confirm.

</details>

## Scope notes

Deliberate cuts made for a 24-hour build window.

<table>
<tr>
<td valign="top" width="50%">

**Cut for this build**
- No persistent database — state resets on restart
- No auth database — role select is a UI-only switch
- No proration, refunds, or multi-currency
- No admin UI for discount tiers or approval chains
- Warehouse split applies to Hardware lines only

</td>
<td valign="top" width="50%">

**What we'd build next**
- Real persistence (Postgres) + JWT auth per role
- A trained recommendation model behind the upsell panel
- Subscription proration, cancellation, credit notes
- Admin UI for discount tiers and approval chains
- Email/Slack notifications on approvals and stalls

</td>
</tr>
</table>

---

<div align="center">

Built for a 24-hour hackathon · MIT license

</div>
