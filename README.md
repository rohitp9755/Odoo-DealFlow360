# Ink the Deal

**Ink the Deal** is a MERN-stack Quote-to-Cash platform that unifies the complete deal lifecycle — from quotation and approval to negotiation, fulfillment, billing, and business insights — into a single connected workflow spanning sales, finance, operations, and customers.

---

## Overview

Traditional sales processes rely on disconnected systems for quotations, approvals, customer communication, inventory, and billing. This fragmentation creates delays, manual overhead, and limited visibility into deal health.

**Ink the Deal connects the entire process around a single deal:**

```
Customer → Quotation → Risk Analysis → Approval → AI Negotiation
    → Customer Confirmation → Fulfillment → Subscription / Invoice
    → Deal Health → Business Insights
```

---

## Core Features

### 1. Sales Dashboard
A centralized workspace for monitoring:
- Revenue and pipeline
- Open quotations
- Pending approvals
- At-risk deals
- Recent activity

The dashboard is designed to surface what requires attention right now.

### 2. Smart Quotations
Create and manage quotations with products, pricing, quantities, discounts, taxes, approval status, customer information, and deal status.

**Quotation lifecycle:**
```
Draft → Pending Approval → Approved → Negotiation → Confirmed
```

### 3. Discount & Risk Analysis
Ink the Deal evaluates discounts against configurable business rules:

```
Customer Tier + Product Category + Discount Given + Allowed Discount → Risk Evaluation
```

| Risk Level | Response |
|---|---|
| Low | Normal processing |
| Medium | Manager review |
| High | Manager + Finance review |

This helps businesses control discount leakage and identify risky deals early.

### 4. AI Negotiation Agent
Assists sales teams during customer negotiations by:
- Understanding customer requests
- Analyzing proposed changes
- Suggesting counter-offers
- Applying pricing and discount limits
- Recommending negotiation strategies
- Protecting business margins

The agent supports the salesperson while keeping the final decision under human control.

### 5. Smart Approval Workflow
Approval paths are automatically determined based on deal risk:

| Risk Level | Approval Path |
|---|---|
| Low | Automatic approval |
| Medium | Sales Manager |
| High | Sales Manager → Finance |

Approvers can approve, reject, request changes, add comments, and review approval history.

### 6. Customer Portal
Customers can view quotations, review products, add comments, request price or delivery changes, submit counter-offers, and confirm quotations — replacing fragmented email-based negotiation with a structured workflow.

### 7. Fulfillment & Inventory
Approved deals connect directly with inventory data, providing visibility into warehouse stock, reserved stock, available stock, backorders, fulfillment status, and warehouse allocation. The system can also recommend fulfillment options based on availability.

### 8. Subscriptions & Billing
Manage recurring products and services alongside the original deal, including active subscriptions, billing cycles, recurring revenue, invoices, due dates, and payment status.

### 9. Deal Health
Continuously evaluates deal activity to surface potential problems: stalled deals, discount anomalies, delivery delays, high-risk deals, and lack of customer activity — identifying issues before they become lost revenue.

### 10. Basket Analysis
Identifies products frequently purchased together to uncover cross-selling and upselling opportunities, product relationships, and bundle recommendations — turning transaction data into actionable sales opportunities.

### 11. Product Management
A centralized product and pricing catalog keeps quotation data consistent, covering product name, category, price, currency, unit, tax, description, variants, stock quantity, subscription settings, and price lists.

### 12. Configurable Discount Rules
Administrators can configure tier- and category-based discount limits, with approval rules driven by the resulting risk level.

**Customer tier limits:**

| Customer Tier | Maximum Discount |
|---|---|
| Bronze | 5% |
| Silver | 10% |
| Gold | 15% |

**Product category limits:**

| Category | Maximum Discount |
|---|---|
| Hardware | 15% |
| Services | 10% |

---

## Complete Deal Lifecycle

```
QUOTE → RISK ANALYSIS → APPROVAL → AI NEGOTIATION → CUSTOMER CONFIRMATION
    → FULFILLMENT → (SUBSCRIPTION / INVOICE) → PAYMENT
    → DEAL HEALTH → BUSINESS INSIGHTS
```

**One platform. One deal. One connected journey.**

---

## User Roles

| Role | Responsibility |
|---|---|
| Sales Representative | Create and manage quotations |
| Sales Manager | Review and approve deals |
| Finance | Review high-risk deals and billing |
| Operations | Manage inventory and fulfillment |
| Customer | Review and negotiate quotations |
| Admin | Manage products, pricing, and rules |

---

## Frontend Experience

Ink the Deal is built as a modern enterprise SaaS application using React.js and Tailwind CSS, following a clean, restrained visual system focused on usability and information hierarchy over excessive visual effects.

**Design principles:**
- Minimal and professional interface
- Soft neutral backgrounds with muted accent colors
- Clear information hierarchy
- Thin borders and subtle shadows
- Consistent spacing and typography
- Responsive layouts
- Purposeful micro-interactions

**Interactive UI elements:**
- Hover states on cards and navigation
- Small elevation changes on interactive elements
- Animated data transitions
- Contextual tooltips
- Floating insight cards
- AI recommendation panels
- Interactive charts
- Status indicators

Animations are used to communicate state and hierarchy, not to distract from the application.

---

## Application Journey

The platform is organized into connected screens representing the full business lifecycle:

1. Login / Signup
2. Sales Dashboard
3. Quotations
4. Quotation Detail
5. Approvals
6. Approval Detail
7. Fulfillment & Stock
8. Fulfillment Detail
9. Subscriptions
10. Billing Detail
11. Customer Portal
12. Invoices
13. Invoice Detail
14. Deal Health
15. Reporting
16. Product Dashboard
17. Product Details
18. Discount Rules

These are not isolated pages — they represent one connected business process.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Styling | Tailwind CSS |
| Backend | Node.js |
| API | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | Role-Based Authentication |
| AI | Risk Analysis & Negotiation Agent |
| Analytics | Basket Analysis & Deal Insights |

**MERN:**
- **M** — MongoDB: Database
- **E** — Express.js: Backend API
- **R** — React.js: Frontend
- **N** — Node.js: Server runtime

---

## Architecture

```
┌──────────────────────────────────────────┐
│                 FRONTEND                  │
│                  React                    │
│        Components • Pages • UI            │
└────────────────────┬───────────────────────┘
                      │ REST API
                      ▼
┌──────────────────────────────────────────┐
│                 BACKEND                   │
│           Node.js • Express.js            │
│    Routes • Controllers • Business Logic  │
└────────────────────┬───────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────┐
│                 DATABASE                  │
│                 MongoDB                   │
│             Mongoose Models               │
└──────────────────────────────────────────┘
```

---

## Core Data Model

```
Company
  ├── Users
  └── Quotations
        ├── Quote Items → Products
        ├── Approval
        ├── Negotiation
        ├── Fulfillment
        ├── Subscription
        ├── Invoice
        └── Deal Health
```

**Core entities:** Users, Companies, Products, Quotations, Approvals, Negotiations, Fulfillments, Subscriptions, Invoices, Deal Health, Discount Configuration, Audit Logs.

---

## Project Structure

```
Ink-the-Deal/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── config/
│   └── server.js
│
├── README.md
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js
- npm
- MongoDB or MongoDB Atlas
- Git

### Clone the Repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Ink-the-Deal
```

### Install Frontend Dependencies
```bash
cd client
npm install
```

### Install Backend Dependencies
In a separate terminal:
```bash
cd server
npm install
```

### Environment Variables
Create a `.env` file inside `server/`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

> **Note:** Do not commit `.env` or database credentials to the repository.

### Start the Backend
```bash
cd server
npm run dev
```

### Start the Frontend
In a separate terminal:
```bash
cd client
npm run dev
```

Open the local URL provided by Vite.

---

## Recommended Hackathon Demo

The strongest demo follows a single deal through the complete platform.

**Example deal — Customer: Acme Corp**
- 2 × Laptop Pro 14
- 1 × Onsite Setup
- 1 × Extended Warranty

**Demo flow:**
1. Create a quotation
2. Apply a discount
3. Risk engine flags an issue
4. Quote enters the approval workflow
5. Manager reviews the deal
6. Customer negotiates through the portal
7. AI Negotiation Agent suggests a response
8. Customer confirms the deal
9. Inventory is checked
10. Fulfillment is planned
11. Invoice / subscription is generated
12. Deal Health monitors the transaction
13. Basket Analysis surfaces sales insights

This flow demonstrates how multiple business processes operate together rather than as isolated features.

---

## Why Ink the Deal?

Ink the Deal combines **Sales Automation, Risk Intelligence, AI Negotiation, Smart Approvals, Fulfillment, Billing, and Basket Analysis** into a single connected platform.

Rather than simply recording what happened to a deal, Ink the Deal helps teams understand:

> **What happened, what is happening, and what should happen next.**

---

## Security

The application is built around common security practices, including:
- Authentication
- Role-based access control
- Protected routes
- Password hashing
- Environment-based secrets
- API validation
- Audit logging

For production deployment, additional controls — HTTPS, rate limiting, stronger input validation, and infrastructure-level access controls — should be enabled.

---

## Future Scope

- Predictive revenue forecasting
- Advanced deal-risk scoring
- Next-best-action recommendations
- Automated customer follow-ups
- Real-time notifications
- Payment gateway integration
- CRM and ERP integrations
- Multi-currency support
- Advanced predictive analytics
- AI-powered quote recommendations

---

## The Core Idea

Most systems ask: *"What happened to this deal?"*

**Ink the Deal** aims to answer: *"What happened, what is happening, and what should happen next?"*

```
QUOTE → RISK → APPROVAL → NEGOTIATION → FULFILLMENT
    → SUBSCRIPTION / INVOICE → PAYMENT → DEAL HEALTH → INSIGHT
```

---

## Built With

MongoDB · Express.js · React.js · Node.js · Tailwind CSS

---

**Ink the Deal** — *From Quote to Revenue, in one connected workflow.*
