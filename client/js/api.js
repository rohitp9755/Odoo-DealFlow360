const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCustomers: () => request("/customers"),
  getProducts: () => request("/products"),
  getWarehouses: () => request("/warehouses"),

  getQuotations: () => request("/quotations"),
  getQuotation: (id) => request(`/quotations/${id}`),
  createQuotation: (customerId) => request("/quotations", { method: "POST", body: JSON.stringify({ customerId }) }),
  addLine: (id, line) => request(`/quotations/${id}/lines`, { method: "POST", body: JSON.stringify(line) }),
  updateLine: (id, lineId, patch) => request(`/quotations/${id}/lines/${lineId}`, { method: "PATCH", body: JSON.stringify(patch) }),
  removeLine: (id, lineId) => request(`/quotations/${id}/lines/${lineId}`, { method: "DELETE" }),
  addUpsell: (id, productId) => request(`/quotations/${id}/upsell/${productId}`, { method: "POST" }),
  submit: (id) => request(`/quotations/${id}/submit`, { method: "POST" }),
  acceptSplit: (id) => request(`/quotations/${id}/warehouse-split/accept`, { method: "POST" }),
  confirmOrder: (id) => request(`/quotations/${id}/confirm`, { method: "POST" }),

  getApprovals: () => request("/approvals"),
  decideApproval: (id, decision, role, reason) =>
    request(`/approvals/${id}/decide`, { method: "POST", body: JSON.stringify({ decision, role, reason }) }),

  getDashboard: () => request("/dashboard"),

  getPortalQuotation: (id) => request(`/portal/${id}`),
  negotiate: (id, payload) => request(`/portal/${id}/negotiate`, { method: "POST", body: JSON.stringify(payload) }),
  portalConfirm: (id) => request(`/portal/${id}/confirm`, { method: "POST" })
};
