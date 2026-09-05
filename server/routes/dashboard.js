import { Router } from "express";
import { db } from "../store.js";
import { evaluateQuotation } from "../logic/riskEngine.js";

const router = Router();

router.get("/", (req, res) => {
  const evaluations = db.quotations.map((q) => {
    const customer = db.customers.find((c) => c.id === q.customerId);
    return { q, customer, evaluation: evaluateQuotation(q, customer, db.products) };
  });

  const activeDeals = evaluations.filter((e) => !["confirmed", "rejected"].includes(e.q.status));
  const pendingApprovals = evaluations.filter((e) => ["pending_manager", "pending_finance"].includes(e.q.status));
  const atRiskDeals = evaluations.filter((e) => e.evaluation.riskScore > 0 && !["confirmed", "rejected"].includes(e.q.status));
  const pipelineValue = activeDeals.reduce((s, e) => s + e.evaluation.total, 0);

  const stalled = evaluations
    .filter((e) => {
      const hours = (Date.now() - new Date(e.q.updatedAt).getTime()) / 3600000;
      return hours > 72 && !["confirmed", "rejected"].includes(e.q.status);
    })
    .map((e) => ({
      id: e.q.id,
      customerName: e.customer.name,
      total: e.evaluation.total,
      hoursSinceUpdate: Math.round((Date.now() - new Date(e.q.updatedAt).getTime()) / 3600000),
      severity: "stalled"
    }));

  const anomalies = evaluations
    .filter((e) => e.evaluation.riskScore > 40)
    .map((e) => ({
      id: e.q.id,
      customerName: e.customer.name,
      riskScore: e.evaluation.riskScore,
      reasons: e.evaluation.reasons,
      severity: "high_risk"
    }));

  const healthy = evaluations.filter((e) => e.evaluation.riskScore === 0).length;
  const atRisk = evaluations.filter((e) => e.evaluation.riskScore > 0 && e.evaluation.riskScore <= 40).length;
  const critical = evaluations.filter((e) => e.evaluation.riskScore > 40).length;
  const totalCount = evaluations.length || 1;

  res.json({
    kpis: {
      pipelineValue: Math.round(pipelineValue),
      activeDeals: activeDeals.length,
      pendingApprovals: pendingApprovals.length,
      atRiskDeals: atRiskDeals.length
    },
    dealHealth: {
      healthyPct: Math.round((healthy / totalCount) * 100),
      atRiskPct: Math.round((atRisk / totalCount) * 100),
      criticalPct: Math.round((critical / totalCount) * 100)
    },
    alerts: [...stalled, ...anomalies],
    pipelineByStage: {
      draft: db.quotations.filter((q) => q.status === "draft").length,
      pending_manager: db.quotations.filter((q) => q.status === "pending_manager").length,
      pending_finance: db.quotations.filter((q) => q.status === "pending_finance").length,
      approved: db.quotations.filter((q) => q.status === "approved").length,
      confirmed: db.quotations.filter((q) => q.status === "confirmed").length
    }
  });
});

export default router;
