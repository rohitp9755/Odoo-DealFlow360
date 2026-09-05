# DealFlow360

### AI-Powered Quote-to-Cash Platform

DealFlow360 is a MERN-stack platform that connects the complete deal lifecycle — from quotation and approval to negotiation, fulfillment, billing, and business insights.

It brings sales, finance, operations, and customers into one connected workflow.

---

## Overview

Traditional sales processes often use separate systems for quotations, approvals, customer communication, inventory, and billing. This leads to delays, manual work, and limited visibility.

**DealFlow360 connects the entire process around a single deal.**

```text
Customer
   ↓
Quotation
   ↓
Risk Analysis
   ↓
Approval
   ↓
AI Negotiation
   ↓
Customer Confirmation
   ↓
Fulfillment
   ↓
Subscription / Invoice
   ↓
Deal Health
   ↓
Business Insights
```

---

## Core Features

### Sales Dashboard

A centralized workspace for monitoring:

* Revenue and pipeline
* Open quotations
* Pending approvals
* At-risk deals
* Recent activity

The dashboard focuses on what requires attention right now.

### Smart Quotations

Create and manage quotations with:

* Products and pricing
* Quantities
* Discounts and taxes
* Approval status
* Customer information
* Deal status

### Risk & Discount Analysis

DealFlow360 evaluates discounts against configurable business rules.

```text
Customer Tier
      +
Product Category
      +
Discount Given
      +
Allowed Discount
      ↓
Risk Evaluation
```

Deals can be classified as:

```text
LOW       → Normal
MEDIUM    → Manager Review
HIGH      → Manager + Finance
```

This helps businesses control discount leakage and identify risky deals early.

### AI Negotiation Agent

The AI Negotiation Agent assists sales teams during customer negotiations.

It can:

* Understand customer requests
* Analyze proposed changes
* Suggest counter-offers
* Consider pricing and discount limits
* Recommend negotiation strategies
* Protect business margins

The agent assists the salesperson while keeping the **final decision under human control**.

### Smart Approval Workflow

Approval paths are automatically determined based on deal risk.

```text
Low Risk       → Automatic Approval
Medium Risk    → Sales Manager
High Risk      → Sales Manager → Finance
```

Approvers can approve, reject, request changes, and review the complete approval history.

### Customer Portal

Customers receive a dedicated interface where they can:

* View quotations
* Review products
* Add comments
* Request price changes
* Request delivery changes
* Submit counter-offers
* Confirm quotations

This replaces fragmented email-based negotiation with a structured workflow.

### Fulfillment & Inventory

Approved deals are connected with inventory information.

The system provides visibility into:

* Warehouse stock
* Reserved stock
* Available stock
* Backorders
* Fulfillment status
* Warehouse allocation

It can also recommend fulfillment options based on available inventory.

### Subscriptions & Billing

Manage recurring products and services alongside the original deal.

Track:

* Active subscriptions
* Billing cycles
* Recurring revenue
* Invoices
* Due dates
* Payment status

### Deal Health

DealFlow360 continuously evaluates deal activity to identify potential problems.

It can highlight:

* Stalled deals
* Discount anomalies
* Delivery delays
* High-risk deals
* Lack of customer activity

The objective is to identify problems before they become lost revenue.

### Basket Analysis

Basket Analysis identifies products that are frequently purchased together.

It helps businesses discover:

* Cross-selling opportunities
* Upselling opportunities
* Product relationships
* Frequently combined products
* Potential bundle recommendations

This converts transaction data into actionable sales opportunities.

---

## Complete Deal Lifecycle

```text
                 DEALFLOW360

                    QUOTE
                      ↓
                 RISK ANALYSIS
                      ↓
                   APPROVAL
                      ↓
                AI NEGOTIATION
                      ↓
              CUSTOMER CONFIRMATION
                      ↓
                 FULFILLMENT
                   ↙       ↘
          SUBSCRIPTION     INVOICE
                   ↘       ↙
                    PAYMENT
                      ↓
                  DEAL HEALTH
                      ↓
              BUSINESS INSIGHTS
```

**One platform. One deal. One connected journey.**

---

## Frontend Experience

DealFlow360 is designed as a modern enterprise SaaS application using **React.js and Tailwind CSS**.

The interface follows a clean and restrained visual system rather than relying on excessive gradients or visual effects.

### Design Principles

* Minimal and professional interface
* Soft neutral backgrounds
* Muted accent colors
* Clear information hierarchy
* Thin borders and subtle shadows
* Consistent spacing and typography
* Responsive layouts
* Purposeful micro-interactions

### Interactive UI

The frontend uses subtle interactions to improve usability:

* Hover states on cards and navigation
* Small elevation changes on interactive elements
* Animated data transitions
* Contextual tooltips
* Floating insight cards
* AI recommendation panels
* Interactive charts
* Status indicators

Animations are used to communicate state and hierarchy rather than distract from the application.

---

## User Roles

| Role                 | Responsibility                      |
| -------------------- | ----------------------------------- |
| Sales Representative | Create and manage quotations        |
| Sales Manager        | Review and approve deals            |
| Finance              | Review high-risk deals and billing  |
| Operations           | Manage inventory and fulfillment    |
| Customer             | Review and negotiate quotations     |
| Admin                | Manage products, pricing, and rules |

---

## Technology Stack

| Layer          | Technology                        |
| -------------- | --------------------------------- |
| Frontend       | React.js                          |
| Styling        | Tailwind CSS                      |
| Backend        | Node.js                           |
| API            | Express.js                        |
| Database       | MongoDB                           |
| ODM            | Mongoose                          |
| Authentication | Role-Based Authentication         |
| AI             | Risk Analysis & Negotiation Agent |
| Analytics      | Basket Analysis & Deal Insights   |

---

## Project Structure

```text
DealFlow360/
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

* Node.js
* npm
* MongoDB or MongoDB Atlas
* Git

### Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd DealFlow360
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

Open another terminal:

```bash
cd server
npm install
npm run dev
```

### Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Do not commit `.env` or database credentials to the repository.

---

## Hackathon Demo

The recommended demo follows one deal through the entire platform.

```text
1. Create a quotation
          ↓
2. Apply a discount
          ↓
3. Risk engine detects an issue
          ↓
4. Quote enters approval workflow
          ↓
5. Manager reviews the deal
          ↓
6. Customer negotiates using the portal
          ↓
7. AI Negotiation Agent suggests a response
          ↓
8. Customer confirms the deal
          ↓
9. Inventory is checked
          ↓
10. Fulfillment is planned
          ↓
11. Invoice / subscription is generated
          ↓
12. Deal Health monitors the transaction
          ↓
13. Basket Analysis provides sales insights
```

This demonstrates how multiple business processes work together instead of operating as isolated features.

---

## Why DealFlow360?

DealFlow360 combines:

**Sales Automation + Risk Intelligence + AI Negotiation + Smart Approvals + Fulfillment + Billing + Basket Analysis**

into a single connected platform.

Instead of simply showing what happened to a deal, DealFlow360 helps teams understand:

> **What happened, what is happening, and what should happen next.**

---

## Future Scope

The platform can be extended with:

* Predictive revenue forecasting
* Advanced deal-risk scoring
* Next-best-action recommendations
* Automated customer follow-ups
* Real-time notifications
* Payment gateway integration
* CRM and ERP integrations
* Multi-currency support
* Advanced predictive analytics

---

## Built With

**MongoDB · Express.js · React.js · Node.js · Tailwind CSS**

### DealFlow360

**From Quote to Revenue, in one connected workflow.**
