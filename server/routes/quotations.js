import { Router } from "express";
import { db, findQuotation, addAudit, nextId } from "../store.js";
import { evaluateQuotation } from "../logic/riskEngine.js";
import { getUpsellSuggestions } from "../logic/upsellEngine.js";
import { computeFulfillment } from "../logic/warehouseEngine.js";
import { computeBilling } from "../logic/billingEngine.js";

const router = Router();

function buildFullView(quotation) {
  const customer = db.customers.find((c) => c.id === quotation.customerId);
  const evaluation = evaluateQuotation(quotation, customer, db.products);
  const upsell = getUpsellSuggestions(quotation.lines, db.upsellRules, db.products);
  const billing = computeBilling(evaluation.lines, quotation.lines, db.products);
  return {
    id: quotation.id,
    status: quotation.status,
    customer,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
    evaluation,
    upsell,
    billing,
    warehouseSplit: quotation.warehouseSplit,
    auditLog: [...quotation.auditLog].reverse(),
    negotiations: quotation.negotiations
  };
}

router.get("/", (req, res) => {
  const list = db.quotations.map((q) => {
    const customer = db.customers.find((c) => c.id === q.customerId);
    const evaluation = evaluateQuotation(q, customer, db.products);
    const hoursSinceUpdate = (Date.now() - new Date(q.updatedAt).getTime()) / 3600000;
    return {
      id: q.id,
      customerName: customer.name,
      status: q.status,
      total: evaluation.total,
      riskScore: evaluation.riskScore,
      riskLevel: evaluation.riskLevel,
      updatedAt: q.updatedAt,
      isStalled: hoursSinceUpdate > 72 && !["confirmed", "rejected"].includes(q.status)
    };
  });
  res.json(list);
});

router.get("/:id", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  res.json(buildFullView(q));
});

router.post("/", (req, res) => {
  const { customerId } = req.body;
  const customer = db.customers.find((c) => c.id === customerId);
  if (!customer) return res.status(400).json({ error: "Invalid customer" });
  const q = {
    id: nextId("q"),
    customerId,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lines: [],
    auditLog: [],
    warehouseSplit: null,
    negotiations: []
  };
  addAudit(q, "Sales Rep", `Quotation created for ${customer.name}`);
  db.quotations.push(q);
  res.status(201).json(buildFullView(q));
});

router.post("/:id/lines", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  const { productId, qty, discount } = req.body;
  const product = db.products.find((p) => p.id === productId);
  if (!product) return res.status(400).json({ error: "Invalid product" });
  const line = { id: nextId("l"), productId, qty: Number(qty) || 1, discount: Number(discount) || 0 };
  q.lines.push(line);
  addAudit(q, "Sales Rep", `Added ${product.name} x${line.qty} at ${line.discount}% discount`);
  res.status(201).json(buildFullView(q));
});

router.patch("/:id/lines/:lineId", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  const line = q.lines.find((l) => l.id === req.params.lineId);
  if (!line) return res.status(404).json({ error: "Line not found" });
  const product = db.products.find((p) => p.id === line.productId);
  const before = { qty: line.qty, discount: line.discount };
  if (req.body.qty !== undefined) line.qty = Number(req.body.qty);
  if (req.body.discount !== undefined) line.discount = Number(req.body.discount);
  addAudit(q, "Sales Rep", `Updated ${product.name}`, {
    oldValue: `qty ${before.qty}, discount ${before.discount}%`,
    newValue: `qty ${line.qty}, discount ${line.discount}%`
  });
  res.json(buildFullView(q));
});

router.delete("/:id/lines/:lineId", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  q.lines = q.lines.filter((l) => l.id !== req.params.lineId);
  addAudit(q, "Sales Rep", "Removed a line item");
  res.json(buildFullView(q));
});

router.post("/:id/upsell/:productId", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  const product = db.products.find((p) => p.id === req.params.productId);
  if (!product) return res.status(400).json({ error: "Invalid product" });
  const line = { id: nextId("l"), productId: product.id, qty: 1, discount: 0 };
  q.lines.push(line);
  addAudit(q, "System", `AI recommendation accepted: added ${product.name}`);
  res.status(201).json(buildFullView(q));
});

router.post("/:id/submit", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  if (q.lines.length === 0) return res.status(400).json({ error: "Cannot submit an empty quotation" });
  const customer = db.customers.find((c) => c.id === q.customerId);
  const evaluation = evaluateQuotation(q, customer, db.products);

  addAudit(q, "System", `Risk score calculated: ${evaluation.riskScore}/100 (${evaluation.riskLevel})`);

  if (evaluation.approvalLevel === "none") {
    q.status = "approved";
    addAudit(q, "System", "No approval required, quotation auto-approved");
  } else if (evaluation.approvalLevel === "manager") {
    q.status = "pending_manager";
    addAudit(q, "System", "Routed to Sales Manager for approval", { reason: evaluation.reasons.join("; ") });
  } else {
    q.status = "pending_manager";
    q.requiresFinance = true;
    addAudit(q, "System", "Routed to Sales Manager, then Finance for approval", { reason: evaluation.reasons.join("; ") });
  }

  res.json(buildFullView(q));
});

router.post("/:id/warehouse-split/accept", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  if (q.status !== "approved") return res.status(400).json({ error: "Quotation must be approved before fulfillment can be planned" });
  const fulfillment = computeFulfillment(q.lines, db.warehouses, db.products);
  q.warehouseSplit = { ...fulfillment, mode: "auto", acceptedAt: new Date().toISOString() };
  addAudit(q, "Sales Rep", `Accepted warehouse split across ${fulfillment.shipmentCount} shipment(s)`);
  res.json(buildFullView(q));
});

router.post("/:id/warehouse-split/override", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  if (q.status !== "approved") return res.status(400).json({ error: "Quotation must be approved before fulfillment can be planned" });
  const { allocations } = req.body;
  q.warehouseSplit = { allocations, backorders: [], shipmentCount: allocations.length, estimatedShippingCost: allocations.length * 450, mode: "manual" };
  addAudit(q, "Sales Rep", "Manually overrode warehouse split");
  res.json(buildFullView(q));
});

router.post("/:id/confirm", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  if (q.status !== "approved") return res.status(400).json({ error: "Quotation must be approved before it can be confirmed" });
  q.status = "confirmed";
  q.invoiceStatus = "paid";
  addAudit(q, "System", "Order confirmed, payment recorded, invoice marked paid");
  res.json(buildFullView(q));
});

export default router;
