import { Router } from "express";
import { db, findQuotation, addAudit, nextId } from "../store.js";
import { evaluateQuotation } from "../logic/riskEngine.js";

const router = Router();

function portalStatus(q) {
  if (["pending_manager", "pending_finance"].includes(q.status)) return "Under Review";
  if (q.status === "approved") return "Approved - Awaiting Confirmation";
  if (q.status === "confirmed") return "Confirmed";
  if (q.status === "rejected") return "Rejected";
  return "Sent";
}

router.get("/:id", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  const customer = db.customers.find((c) => c.id === q.customerId);
  const evaluation = evaluateQuotation(q, customer, db.products);
  res.json({
    id: q.id,
    customerName: customer.name,
    portalStatus: portalStatus(q),
    canConfirm: q.status === "approved",
    lines: evaluation.lines,
    total: evaluation.total,
    negotiations: q.negotiations
  });
});

router.post("/:id/negotiate", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  const { lineId, requestedDiscount, comment } = req.body;
  const line = q.lines.find((l) => l.id === lineId);
  if (!line) return res.status(404).json({ error: "Line not found" });
  const product = db.products.find((p) => p.id === line.productId);

  const negotiation = {
    id: nextId("neg"),
    lineId,
    productName: product.name,
    previousDiscount: line.discount,
    requestedDiscount: Number(requestedDiscount),
    comment,
    createdAt: new Date().toISOString()
  };
  q.negotiations.push(negotiation);
  line.discount = Number(requestedDiscount);

  const customer = db.customers.find((c) => c.id === q.customerId);
  const evaluation = evaluateQuotation(q, customer, db.products);

  addAudit(q, "Customer", `Requested discount change on ${product.name}`, {
    oldValue: `${negotiation.previousDiscount}%`,
    newValue: `${negotiation.requestedDiscount}%`,
    reason: comment
  });

  if (evaluation.approvalLevel !== "none") {
    q.status = "pending_manager";
    q.requiresFinance = evaluation.approvalLevel === "manager_finance";
    addAudit(q, "System", "New terms exceed approval threshold, quotation re-routed for approval", {
      reason: evaluation.reasons.join("; ")
    });
  } else {
    q.status = "approved";
    addAudit(q, "System", "New terms within approved thresholds, no re-approval needed");
  }

  res.json({ status: q.status, evaluation });
});

router.post("/:id/confirm", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  if (q.status !== "approved") return res.status(400).json({ error: "Quotation is not ready to be confirmed" });
  q.status = "confirmed";
  q.invoiceStatus = "paid";
  addAudit(q, "Customer", "Customer confirmed the quotation, invoice marked paid");
  res.json({ status: q.status });
});

export default router;
