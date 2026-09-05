import { Router } from "express";
import { db, findQuotation, addAudit } from "../store.js";
import { evaluateQuotation } from "../logic/riskEngine.js";

const router = Router();

router.get("/", (req, res) => {
  const pending = db.quotations.filter((q) => q.status === "pending_manager" || q.status === "pending_finance");
  const list = pending.map((q) => {
    const customer = db.customers.find((c) => c.id === q.customerId);
    const evaluation = evaluateQuotation(q, customer, db.products);
    const hoursWaiting = Math.max(0, Math.round((Date.now() - new Date(q.updatedAt).getTime()) / 3600000));
    return {
      id: q.id,
      customerName: customer.name,
      total: evaluation.total,
      riskScore: evaluation.riskScore,
      riskLevel: evaluation.riskLevel,
      reasons: evaluation.reasons,
      currentApprover: q.status === "pending_finance" ? "Finance" : "Sales Manager",
      requiresFinance: !!q.requiresFinance,
      hoursWaiting
    };
  });
  res.json(list);
});

router.post("/:id/decide", (req, res) => {
  const q = findQuotation(req.params.id);
  if (!q) return res.status(404).json({ error: "Quotation not found" });
  const { decision, role, reason } = req.body;

  if (decision === "reject") {
    q.status = "rejected";
    addAudit(q, role === "finance" ? "Finance" : "Sales Manager", "Quotation rejected", { reason });
    return res.json({ status: q.status });
  }

  if (decision === "revise") {
    q.status = "draft";
    addAudit(q, role === "finance" ? "Finance" : "Sales Manager", "Returned for revision", { reason });
    return res.json({ status: q.status });
  }

  if (q.status === "pending_manager" && q.requiresFinance) {
    q.status = "pending_finance";
    addAudit(q, "Sales Manager", "Manager approved, escalated to Finance");
  } else {
    q.status = "approved";
    addAudit(q, role === "finance" ? "Finance" : "Sales Manager", "Approved");
  }

  res.json({ status: q.status });
});

export default router;
