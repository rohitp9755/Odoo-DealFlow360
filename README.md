Ink the Deal

Ink the Deal is a MERN-stack Quote-to-Cash platform that connects the complete deal lifecycle — from quotation and approval to negotiation, fulfillment, billing, and business insights.

It brings sales, finance, operations, and customers into one connected workflow.

Overview

Traditional sales processes often use separate systems for quotations, approvals, customer communication, inventory, and billing. This creates delays, manual work, and limited visibility.

Ink the Deal connects the entire process around a single deal.

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

Core Features

1. Sales Dashboard

A centralized workspace for monitoring:

Revenue and pipeline

Open quotations

Pending approvals

At-risk deals

Recent activity

The dashboard focuses on what requires attention right now.

2. Smart Quotations

Create and manage quotations with:

Products and pricing

Quantities

Discounts and taxes

Approval status

Customer information

Deal status

Quotation lifecycle:

Draft
  ↓
Pending Approval
  ↓
Approved
  ↓
Negotiation
  ↓
Confirmed

3. Discount & Risk Analysis

Ink the Deal evaluates discounts against configurable business rules.

Customer Tier
      +
Product Category
      +
Discount Given
      +
Allowed Discount
      ↓
Risk Evaluation

Deals can be classified as:

LOW       → Normal
MEDIUM    → Manager Review
HIGH      → Manager + Finance

This helps businesses control discount leakage and identify risky deals early.

4. AI Negotiation Agent

The AI Negotiation Agent assists sales teams during customer negotiations.

It can:

Understand customer requests

Analyze proposed changes

Suggest counter-offers

Consider pricing and discount limits

Recommend negotiation strategies

Protect business margins

The agent assists the salesperson while keeping the final decision under human control.

5. Smart Approval Workflow

Approval paths are automatically determined based on deal risk.

Low Risk       → Automatic Approval
Medium Risk    → Sales Manager
High Risk      → Sales Manager → Finance

Approvers can:

Approve

Reject

Request changes

Add comments

Review approval history

6. Customer Portal

Customers receive a dedicated interface where they can:

View quotations

Review products

Add comments

Request price changes

Request delivery changes

Submit counter-offers

Confirm quotations

This replaces fragmented email-based negotiation with a structured workflow.

7. Fulfillment & Inventory

Approved deals are connected with inventory information.

The system provides visibility into:

Warehouse stock

Reserved stock

Available stock

Backorders

Fulfillment status

Warehouse allocation

It can also recommend fulfillment options based on available inventory.

8. Subscriptions & Billing

Manage recurring products and services alongside the original deal.

Track:

Active subscriptions

Billing cycles

Recurring revenue

Invoices

Due dates

Payment status

9. Deal Health

Ink the Deal continuously evaluates deal activity to identify potential problems.

It can highlight:

Stalled deals

Discount anomalies

Delivery delays

High-risk deals

Lack of customer activity

The objective is to identify problems before they become lost revenue.

10. Basket Analysis

Basket Analysis identifies products that are frequently purchased together.

It helps businesses discover:

Cross-selling opportunities

Upselling opportunities

Product relationships

Frequently combined products

Potential bundle recommendations

This converts transaction data into actionable sales opportunities.

11. Product Management

A centralized product and pricing catalog keeps quotation data consistent.

Each product can contain:

Product name

Category

Price

Currency

Unit

Tax

Description

Variants

Stock quantity

Subscription settings

Price lists

12. Configurable Discount Rules

Administrators can configure business rules such as:

Customer Tier

Maximum Discount

Bronze

5%

Silver

10%

Gold

15%

Product-level rules can also be defined:

Category

Maximum Discount

Hardware

15%

Services

10%

Approval rules can then be based on the resulting risk level.

Complete Deal Lifecycle

                    INK THE DEAL

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

One platform. One deal. One connected journey.

User Roles

Role

Responsibility

Sales Representative

Create and manage quotations

Sales Manager

Review and approve deals

Finance

Review high-risk deals and billing

Operations

Manage inventory and fulfillment

Customer

Review and negotiate quotations

Admin

Manage products, pricing, and rules

Frontend Experience

Ink the Deal is designed as a modern enterprise SaaS application using React.js and Tailwind CSS.

The interface follows a clean, restrained visual system focused on usability and information hierarchy rather than excessive visual effects.

Design Principles

Minimal and professional interface

Soft neutral backgrounds

Muted accent colors

Clear information hierarchy

Thin borders and subtle shadows

Consistent spacing and typography

Responsive layouts

Purposeful micro-interactions

Interactive UI

The frontend uses subtle interactions to improve usability:

Hover states on cards and navigation

Small elevation changes on interactive elements

Animated data transitions

Contextual tooltips

Floating insight cards

AI recommendation panels

Interactive charts

Status indicators

Animations are used to communicate state and hierarchy rather than distract from the application.

Application Journey

The platform is organized into connected screens representing the full business lifecycle:

01  Login / Signup
        ↓
02  Sales Dashboard
        ↓
03  Quotations
        ↓
04  Quotation Detail
        ↓
05  Approvals
        ↓
06  Approval Detail
        ↓
07  Fulfillment & Stock
        ↓
08  Fulfillment Detail
        ↓
09  Subscriptions
        ↓
10  Billing Detail
        ↓
11  Customer Portal
        ↓
12  Invoices
        ↓
13  Invoice Detail
        ↓
14  Deal Health
        ↓
15  Reporting
        ↓
16  Product Dashboard
        ↓
17  Product Details
        ↓
18  Discount Rules

These are not isolated pages. They represent one connected business process.

Technology Stack

Layer

Technology

Frontend

React.js

Styling

Tailwind CSS

Backend

Node.js

API

Express.js

Database

MongoDB

ODM

Mongoose

Authentication

Role-Based Authentication

AI

Risk Analysis & Negotiation Agent

Analytics

Basket Analysis & Deal Insights

Architecture

┌──────────────────────────────────────────┐
│                 FRONTEND                 │
│                  React                  │
│       Components • Pages • UI           │
└────────────────────┬─────────────────────┘
                     │
                     │ REST API
                     ▼
┌──────────────────────────────────────────┐
│                 BACKEND                 │
│                Node.js                  │
│              Express.js                │
│      Routes • Controllers • Logic       │
└────────────────────┬─────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│                DATABASE                 │
│                 MongoDB                 │
│            Mongoose Models              │
└──────────────────────────────────────────┘

MERN

M — MongoDB: Database

E — Express.js: Backend API

R — React.js: Frontend

N — Node.js: Server runtime

Core Data Model

Company
   │
   ├── Users
   │
   └── Quotations
          │
          ├── Quote Items → Products
          ├── Approval
          ├── Negotiation
          ├── Fulfillment
          ├── Subscription
          ├── Invoice
          └── Deal Health

Core entities include:

Users

Companies

Products

Quotations

Approvals

Negotiations

Fulfillments

Subscriptions

Invoices

Deal Health

Discount Configuration

Audit Logs

Project Structure

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

Getting Started

Prerequisites

Node.js

npm

MongoDB or MongoDB Atlas

Git

Clone the Repository

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Ink-the-Deal

Install Frontend Dependencies

cd client
npm install

Install Backend Dependencies

Open another terminal:

cd server
npm install

Environment Variables

Create server/.env:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

Do not commit .env or database credentials to the repository.

Start the Backend

cd server
npm run dev

Start the Frontend

Open another terminal:

cd client
npm run dev

Open the local URL provided by Vite.

Recommended Hackathon Demo

The strongest demo follows one deal through the complete platform.

Example Deal

Customer: Acme Corp

Products:

2 × Laptop Pro 14

1 × Onsite Setup

1 × Extended Warranty

Demo Flow

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
6. Customer negotiates through the portal
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

This demonstrates how multiple business processes work together instead of operating as isolated features.

Why Ink the Deal?

Ink the Deal combines:

Sales Automation + Risk Intelligence + AI Negotiation + Smart Approvals + Fulfillment + Billing + Basket Analysis

into a single connected platform.

Instead of simply showing what happened to a deal, Ink the Deal helps teams understand:

What happened, what is happening, and what should happen next.

Security

The application is designed around common security practices, including:

Authentication

Role-based access

Protected routes

Password hashing

Environment-based secrets

API validation

Audit logging

For production deployment, additional controls such as HTTPS, rate limiting, stronger input validation, and infrastructure-level access controls should be enabled.

Future Scope

The platform can be extended with:

Predictive revenue forecasting

Advanced deal-risk scoring

Next-best-action recommendations

Automated customer follow-ups

Real-time notifications

Payment gateway integration

CRM and ERP integrations

Multi-currency support

Advanced predictive analytics

AI-powered quote recommendations

The Core Idea

Most systems ask:

What happened to this deal?

Ink the Deal aims to answer:

What happened, what is happening, and what should happen next?

                    INK THE DEAL

                       QUOTE
                         ↓
                       RISK
                         ↓
                    APPROVAL
                         ↓
                   NEGOTIATION
                         ↓
                   FULFILLMENT
                         ↓
               SUBSCRIPTION / INVOICE
                         ↓
                     PAYMENT
                         ↓
                   DEAL HEALTH
                         ↓
                     INSIGHT

Built With

MongoDB · Express.js · React.js · Node.js · Tailwind CSS

Ink the Deal

From Quote to Revenue, in one connected workflow.
