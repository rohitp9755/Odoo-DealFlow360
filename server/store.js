import { buildSeed, logEntry } from "./data/seed.js";

const seed = buildSeed();

export const db = {
  customers: seed.customers,
  products: seed.products,
  warehouses: seed.warehouses,
  upsellRules: seed.upsellRules,
  quotations: seed.quotations
};

export function findQuotation(id) {
  return db.quotations.find((q) => q.id === id);
}

export function addAudit(quotation, user, action, extra) {
  quotation.auditLog.push(logEntry(user, action, new Date().toISOString(), extra));
  quotation.updatedAt = new Date().toISOString();
}

export function nextId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
