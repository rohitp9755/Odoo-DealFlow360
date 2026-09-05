import { api } from "./api.js";

const root = document.getElementById("app");

const state = {
  role: null,
  roleName: null
};

const roles = {
  rep: { label: "Sales Representative", icon: "◈", desc: "Build quotations, track approvals and fulfillment" },
  manager: { label: "Sales Manager", icon: "◆", desc: "Approve deals and monitor pipeline health" },
  finance: { label: "Finance / Operations", icon: "◇", desc: "Second-level approval on high-risk discounts" }
};

function money(n) {
  return "₹" + Math.round(n || 0).toLocaleString("en-IN");
}

function timeAgo(iso) {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function navigate(hash) {
  window.location.hash = hash;
}

window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);

function currentHash() {
  return window.location.hash.replace(/^#\/?/, "") || "";
}

async function route() {
  const hash = currentHash();

  if (hash.startsWith("portal/")) {
    const id = hash.split("/")[1];
    return renderPortal(id);
  }

  if (!state.role) {
    return renderLogin();
  }

  if (hash.startsWith("quotation/")) {
    const id = hash.split("/")[1];
    return renderQuotationBuilder(id);
  }

  if (hash === "approvals") return renderApprovals();
  if (hash === "quotations") return renderQuotationsList();
  return renderDashboard();
}

function renderLogin() {
  root.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="brand" style="padding-left:0;padding-bottom:18px;">
          <div class="brand-mark">D</div>
          <div>
            <div class="brand-name">DealFlow360</div>
            <div class="brand-sub">SELF-GOVERNING SALES OPS</div>
          </div>
        </div>
        <div class="login-title">Sign in to continue</div>
        <div class="login-sub">Choose a role to demo the workspace</div>
        <div id="role-options"></div>
      </div>
      <div style="font-size:12px;color:var(--text-faint);">
        Customer? Ask your sales rep for a portal link, or
        <a href="#/portal/q-1002" style="color:var(--accent);text-decoration:underline;">open a sample quotation</a>
      </div>
    </div>
  `;
  const container = document.getElementById("role-options");
  Object.entries(roles).forEach(([key, r]) => {
    const div = document.createElement("div");
    div.className = "role-option";
    div.style.cursor = "pointer";
    div.innerHTML = `
      <div class="role-icon">${r.icon}</div>
      <div>
        <div class="role-option-name">${r.label}</div>
        <div class="role-option-desc">${r.desc}</div>
      </div>
    `;
    div.onclick = () => {
      state.role = key;
      state.roleName = r.label;
      navigate("/dashboard");
    };
    container.appendChild(div);
  });
}

function shell(activeKey, contentHtml) {
  const navItems = [
    { key: "dashboard", label: "Overview", icon: "▣", hash: "/dashboard" },
    { key: "quotations", label: "Quotations", icon: "▤", hash: "/quotations" },
    { key: "approvals", label: "Approvals", icon: "◈", hash: "/approvals" }
  ];

  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">D</div>
          <div>
            <div class="brand-name">DealFlow360</div>
            <div class="brand-sub">SALES OPS</div>
          </div>
        </div>
        <div class="nav-group-label">Workspace</div>
        ${navItems.map((n) => `
          <a class="nav-item ${n.key === activeKey ? "active" : ""}" href="#${n.hash}">
            <span>${n.icon}</span><span>${n.label}</span>
          </a>
        `).join("")}
        <div class="sidebar-footer">
          <div class="role-pill">
            <div class="avatar">${roles[state.role]?.icon || "?"}</div>
            <div>
              <div style="color:var(--text);font-weight:600;">${state.roleName}</div>
              <div>Demo session</div>
            </div>
          </div>
          <div class="switch-role" id="switch-role-link">Switch role</div>
        </div>
      </aside>
      <main class="main">${contentHtml}</main>
    </div>
  `;
  document.getElementById("switch-role-link").onclick = () => {
    state.role = null;
    navigate("/dashboard");
  };
}

async function renderDashboard() {
  shell("dashboard", `<div class="page-title">Loading…</div>`);
  const data = await api.getDashboard();
  const { kpis, dealHealth, alerts, pipelineByStage } = data;

  const alertsHtml = alerts.length
    ? alerts.map((a) => `
        <div class="alert-row" data-goto="${a.id}">
          <span class="alert-icon">${a.severity === "stalled" ? "🟠" : "🔴"}</span>
          <div>
            <div class="alert-title">${a.customerName} — ${a.severity === "stalled" ? `inactive for ${Math.round(a.hoursSinceUpdate / 24)} day(s)` : `risk score ${a.riskScore}/100`}</div>
            <div class="alert-detail">${a.severity === "stalled" ? money(a.total) + " pipeline value" : (a.reasons[0] || "Discount pattern flagged")}</div>
          </div>
        </div>
      `).join("")
    : `<div class="empty-state">No active alerts. Pipeline is healthy.</div>`;

  const stageOrder = [
    ["draft", "Draft"],
    ["pending_manager", "Pending Approval"],
    ["pending_finance", "Finance Review"],
    ["approved", "Approved / Fulfillment"],
    ["confirmed", "Won"]
  ];

  shell("dashboard", `
    <div class="topbar">
      <div>
        <div class="page-title">Good to see you, ${state.roleName}</div>
        <div class="page-sub">Here's what's moving across the pipeline right now</div>
      </div>
      <a class="btn btn-primary" href="#/quotations">+ New Quotation</a>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-label">Revenue Pipeline</div><div class="kpi-value">${money(kpis.pipelineValue)}</div></div>
      <div class="kpi-card"><div class="kpi-label">Active Deals</div><div class="kpi-value">${kpis.activeDeals}</div></div>
      <div class="kpi-card"><div class="kpi-label">Pending Approvals</div><div class="kpi-value">${kpis.pendingApprovals}</div></div>
      <div class="kpi-card"><div class="kpi-label">At-Risk Deals</div><div class="kpi-value" style="color:${kpis.atRiskDeals > 0 ? "var(--rose)" : "var(--text)"}">${kpis.atRiskDeals}</div></div>
    </div>

    <div class="grid-2">
      <div>
        <div class="card">
          <div class="card-title">Deal Health</div>
          <div class="card-sub">Share of active quotations by discount risk level</div>
          <div class="health-bar">
            <div class="health-seg healthy" style="width:${dealHealth.healthyPct}%"></div>
            <div class="health-seg risk" style="width:${dealHealth.atRiskPct}%"></div>
            <div class="health-seg critical" style="width:${dealHealth.criticalPct}%"></div>
          </div>
          <div class="health-legend">
            <span><span class="legend-dot" style="background:var(--accent)"></span>Healthy ${dealHealth.healthyPct}%</span>
            <span><span class="legend-dot" style="background:var(--amber)"></span>At Risk ${dealHealth.atRiskPct}%</span>
            <span><span class="legend-dot" style="background:var(--rose)"></span>Critical ${dealHealth.criticalPct}%</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Pipeline by Stage</div>
          <div class="card-sub">Where deals currently sit in the workflow</div>
          ${stageOrder.map(([key, label]) => `
            <div class="summary-row"><span>${label}</span><span class="val">${pipelineByStage[key] || 0}</span></div>
          `).join("")}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Deal Health &amp; Anomaly Alerts</div>
        <div class="card-sub">Click an alert to jump into the quotation</div>
        ${alertsHtml}
      </div>
    </div>
  `);

  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.onclick = () => navigate(`/quotation/${el.dataset.goto}`);
  });
}

async function renderQuotationsList() {
  shell("quotations", `<div class="page-title">Loading…</div>`);
  const [quotations, customers] = await Promise.all([api.getQuotations(), api.getCustomers()]);

  const rows = quotations.map((q) => `
    <tr class="row-link" data-id="${q.id}">
      <td>${q.customerName}</td>
      <td><span class="status-chip ${q.status}">${q.status.replace(/_/g, " ")}</span></td>
      <td class="val" style="font-family:var(--font-mono)">${money(q.total)}</td>
      <td>${riskBadge(q.riskScore, q.riskLevel)}</td>
      <td>${q.isStalled ? '<span class="badge badge-moderate">Stalled</span>' : `<span style="color:var(--text-faint);font-size:12px;">${timeAgo(q.updatedAt)}</span>`}</td>
    </tr>
  `).join("");

  shell("quotations", `
    <div class="topbar">
      <div>
        <div class="page-title">Quotations</div>
        <div class="page-sub">${quotations.length} quotation(s) in the system</div>
      </div>
      <button class="btn btn-primary" id="new-quote-btn">+ New Quotation</button>
    </div>
    <div class="card">
      <table>
        <thead><tr><th>Customer</th><th>Status</th><th>Total</th><th>Risk</th><th>Activity</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5"><div class="empty-state">No quotations yet</div></td></tr>`}</tbody>
      </table>
    </div>

    <div id="new-quote-modal"></div>
  `);

  document.querySelectorAll("tr[data-id]").forEach((row) => {
    row.onclick = () => navigate(`/quotation/${row.dataset.id}`);
  });

  document.getElementById("new-quote-btn").onclick = () => {
    const modal = document.getElementById("new-quote-modal");
    modal.innerHTML = `
      <div class="card" style="margin-top:16px;">
        <div class="card-title">Create quotation</div>
        <div class="card-sub">Pick a customer to start building</div>
        <select id="new-customer-select" style="width:100%;margin-bottom:12px;">
          ${customers.map((c) => `<option value="${c.id}">${c.name} — ${c.tier} tier</option>`).join("")}
        </select>
        <button class="btn btn-primary" id="create-quote-confirm">Create Draft</button>
      </div>
    `;
    document.getElementById("create-quote-confirm").onclick = async () => {
      const customerId = document.getElementById("new-customer-select").value;
      const q = await api.createQuotation(customerId);
      navigate(`/quotation/${q.id}`);
    };
  };
}

function riskBadge(score, level) {
  const cls = level === "LOW" ? "badge-low" : level === "MODERATE" ? "badge-moderate" : "badge-high";
  return `<span class="badge ${cls}">${score}/100</span>`;
}

async function renderQuotationBuilder(id) {
  shell("quotations", `<div class="page-title">Loading…</div>`);
  const [detail, products] = await Promise.all([api.getQuotation(id), api.getProducts()]);
  const { evaluation, upsell, billing, warehouseSplit, auditLog, customer, status } = detail;

  const isEditable = status === "draft";
  const riskClass = evaluation.riskLevel.toLowerCase();

  const lineRows = evaluation.lines.map((l) => `
    <div class="line-item">
      <div>
        <div class="product-name">${l.productName}</div>
        <div class="product-meta">${l.category} · allowed ${l.allowedDiscount}%</div>
      </div>
      <input type="number" min="1" value="${l.qty}" data-field="qty" data-line="${l.lineId}" ${isEditable ? "" : "disabled"} />
      <input type="number" min="0" max="100" value="${l.discount}" data-field="discount" data-line="${l.lineId}" ${isEditable ? "" : "disabled"} />
      <div class="${l.overage > 0 ? "over" : ""}" style="font-family:var(--font-mono);font-size:12px;">${money(l.total)}</div>
      <div>${l.overage > 0 ? `<span class="badge badge-high">+${l.overage}%</span>` : `<span class="badge badge-low">SAFE</span>`}</div>
      ${isEditable ? `<button class="btn btn-ghost btn-sm" data-remove="${l.lineId}">✕</button>` : "<span></span>"}
    </div>
  `).join("");

  const availableProducts = products.filter((p) => !evaluation.lines.some((l) => l.productId === p.id));

  const reasonsHtml = evaluation.reasons.length
    ? evaluation.reasons.map((r) => `<div class="reason-item">⚠ ${r}</div>`).join("")
    : "";

  const upsellHtml = upsell.length
    ? upsell.map((u) => `
        <div class="upsell-card">
          <div class="upsell-head">
            <span class="upsell-name">${u.productName}</span>
            <span class="confidence-tag">${u.confidence}% match</span>
          </div>
          <div class="upsell-reason">${u.reason}</div>
          <div class="upsell-margin">+${money(u.marginImpact)} margin impact</div>
          <div class="upsell-actions">
            <button class="btn btn-sm btn-primary" data-add-upsell="${u.productId}" ${isEditable ? "" : "disabled"}>Add to Quote</button>
          </div>
        </div>
      `).join("")
    : `<div class="empty-state">No recommendations for the current cart.</div>`;

  let actionHtml = "";
  if (status === "draft") {
    actionHtml = `<button class="btn btn-primary" id="submit-btn" ${evaluation.lines.length === 0 ? "disabled" : ""}>Submit for Approval →</button>`;
  } else if (status === "pending_manager" || status === "pending_finance") {
    actionHtml = `<span class="status-chip ${status}">${status === "pending_finance" ? "Awaiting Finance" : "Awaiting Manager Approval"}</span>`;
  } else if (status === "approved" && !warehouseSplit) {
    actionHtml = `<button class="btn btn-primary" id="split-btn">Compute Warehouse Split →</button>`;
  } else if (status === "approved" && warehouseSplit) {
    actionHtml = `<button class="btn btn-primary" id="confirm-btn">Confirm Order &amp; Record Payment</button>`;
  } else if (status === "confirmed") {
    actionHtml = `<span class="badge badge-low">Order Confirmed · Invoice Paid</span>`;
  } else if (status === "rejected") {
    actionHtml = `<span class="badge badge-high">Rejected</span>`;
  }

  const portalLink = `${window.location.origin}/#/portal/${id}`;

  const splitHtml = warehouseSplit
    ? `
      <div class="card">
        <div class="card-title">Warehouse Fulfillment</div>
        <div class="card-sub">${warehouseSplit.shipmentCount} shipment(s) · est. ${money(warehouseSplit.estimatedShippingCost)} shipping</div>
        ${warehouseSplit.allocations.map((a) => `
          <div style="margin-bottom:8px;">
            <div style="font-size:12.5px;font-weight:600;margin-bottom:4px;">${a.productName}</div>
            ${a.allocations.map((x) => `<div class="split-wh"><span>${x.warehouseName}</span><span class="val" style="font-family:var(--font-mono);">${x.qty} units</span></div>`).join("")}
          </div>
        `).join("")}
        ${warehouseSplit.backorders.length ? warehouseSplit.backorders.map((b) => `<div class="reason-item">⚠ Backorder: ${b.backorderQty}× ${b.productName}</div>`).join("") : ""}
      </div>
    `
    : "";

  const billingHtml = `
    <div class="card">
      <div class="card-title">Billing</div>
      <div class="card-sub">${billing.hasRecurring ? `One-time + recurring · next billing ${fmtDate(billing.nextBillingDate)}` : "One-time only"}</div>
      <div class="summary-row"><span>One-time total</span><span class="val">${money(billing.oneTimeTotal)}</span></div>
      ${billing.hasRecurring ? `<div class="summary-row"><span>Recurring total (per cycle)</span><span class="val">${money(billing.recurringTotal)}</span></div>` : ""}
    </div>
  `;

  shell("quotations", `
    <div class="topbar">
      <div>
        <div class="page-title">${customer.name} <span style="color:var(--text-faint);font-weight:400;font-size:16px;">· ${customer.tier} tier</span></div>
        <div class="page-sub">Quotation ${id} · <span class="status-chip ${status}">${status.replace(/_/g, " ")}</span></div>
      </div>
      <div style="display:flex;gap:8px;">
        ${status !== "draft" ? `<button class="btn btn-sm" id="copy-portal-link">Copy Portal Link</button>` : ""}
        ${actionHtml}
      </div>
    </div>

    <div class="builder-grid">
      <div>
        <div class="card">
          <div class="card-title">Line Items</div>
          <div class="line-item" style="border-bottom:1px solid var(--border-strong);padding-top:0;font-size:11px;color:var(--text-faint);text-transform:uppercase;letter-spacing:.04em;">
            <div>Product</div><div>Qty</div><div>Disc %</div><div>Total</div><div>Status</div><div></div>
          </div>
          ${lineRows || '<div class="empty-state">No line items yet — add a product below.</div>'}
          ${isEditable ? `
            <div class="add-line-row">
              <select id="new-line-product">
                ${availableProducts.map((p) => `<option value="${p.id}">${p.name} · ${money(p.price)}</option>`).join("")}
              </select>
              <input type="number" id="new-line-qty" placeholder="Qty" value="1" min="1" />
              <input type="number" id="new-line-discount" placeholder="Disc %" value="0" min="0" max="100" />
              <button class="btn btn-sm" id="add-line-btn">+ Add</button>
            </div>
          ` : ""}
        </div>

        ${reasonsHtml ? `<div class="card"><div class="card-title">Why approval is required</div>${reasonsHtml}</div>` : ""}

        ${splitHtml}
        ${billingHtml}

        <div class="card">
          <div class="card-title">Audit Trail</div>
          ${auditLog.map((a) => `
            <div class="audit-entry">
              <div class="audit-time">${new Date(a.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
              <div class="audit-body">
                <div><span class="audit-user">${a.user}</span> <span class="audit-action">${a.action}</span></div>
                ${a.oldValue || a.newValue ? `<div class="audit-meta">${a.oldValue || ""} → ${a.newValue || ""}</div>` : ""}
                ${a.reason ? `<div class="audit-meta">${a.reason}</div>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-title">Deal Summary</div>
          <div class="risk-meter">
            <div class="risk-score ${riskClass}">${evaluation.riskScore}</div>
            <div style="color:var(--text-dim);font-size:12px;">/100 · ${evaluation.riskLevel} risk</div>
          </div>
          <div class="summary-row"><span>Subtotal</span><span class="val">${money(evaluation.subtotal)}</span></div>
          <div class="summary-row"><span>Discount</span><span class="val" style="color:var(--rose)">-${money(evaluation.discountValue)}</span></div>
          <div class="summary-row total"><span>Total</span><span class="val">${money(evaluation.total)}</span></div>
          <div class="summary-row"><span>Estimated margin</span><span class="val" style="color:var(--accent)">${money(evaluation.margin)} (${evaluation.marginPct}%)</span></div>
        </div>

        <div class="card">
          <div class="card-title">AI Upsell &amp; Cross-Sell</div>
          <div class="card-sub">Ranked by co-purchase confidence and margin impact</div>
          ${upsellHtml}
        </div>
      </div>
    </div>
  `);

  bindBuilderEvents(id, portalLink);
}

function bindBuilderEvents(id, portalLink) {
  document.querySelectorAll("input[data-line]").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const lineId = e.target.dataset.line;
      const field = e.target.dataset.field;
      await api.updateLine(id, lineId, { [field]: e.target.value });
      renderQuotationBuilder(id);
    });
  });

  document.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.onclick = async () => {
      await api.removeLine(id, btn.dataset.remove);
      renderQuotationBuilder(id);
    };
  });

  document.querySelectorAll("[data-add-upsell]").forEach((btn) => {
    btn.onclick = async () => {
      await api.addUpsell(id, btn.dataset.addUpsell);
      toast("Recommendation added to quote");
      renderQuotationBuilder(id);
    };
  });

  const addBtn = document.getElementById("add-line-btn");
  if (addBtn) {
    addBtn.onclick = async () => {
      const productId = document.getElementById("new-line-product").value;
      const qty = document.getElementById("new-line-qty").value;
      const discount = document.getElementById("new-line-discount").value;
      if (!productId) return;
      await api.addLine(id, { productId, qty, discount });
      renderQuotationBuilder(id);
    };
  }

  const submitBtn = document.getElementById("submit-btn");
  if (submitBtn) {
    submitBtn.onclick = async () => {
      await api.submit(id);
      renderQuotationBuilder(id);
    };
  }

  const splitBtn = document.getElementById("split-btn");
  if (splitBtn) {
    splitBtn.onclick = async () => {
      await api.acceptSplit(id);
      toast("Warehouse split accepted");
      renderQuotationBuilder(id);
    };
  }

  const confirmBtn = document.getElementById("confirm-btn");
  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      await api.confirmOrder(id);
      toast("Order confirmed and invoice marked paid");
      renderQuotationBuilder(id);
    };
  }

  const copyBtn = document.getElementById("copy-portal-link");
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard?.writeText(portalLink).catch(() => {});
      toast("Portal link copied");
    };
  }
}

async function renderApprovals() {
  shell("approvals", `<div class="page-title">Loading…</div>`);
  const pending = await api.getApprovals();

  const rows = pending.map((p) => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div class="card-title">${p.customerName}</div>
          <div class="card-sub">${money(p.total)} · waiting ${p.hoursWaiting}h on ${p.currentApprover}</div>
        </div>
        ${riskBadge(p.riskScore, p.riskLevel)}
      </div>
      ${p.reasons.map((r) => `<div class="reason-item">⚠ ${r}</div>`).join("")}
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-primary btn-sm" data-approve="${p.id}" data-role="${p.currentApprover === "Finance" ? "finance" : "manager"}">Approve</button>
        <button class="btn btn-sm" data-revise="${p.id}">Request Revision</button>
        <button class="btn btn-danger btn-sm" data-reject="${p.id}">Reject</button>
        <a class="btn btn-ghost btn-sm" style="margin-left:auto;" href="#/quotation/${p.id}">View Quotation →</a>
      </div>
    </div>
  `).join("");

  shell("approvals", `
    <div class="topbar">
      <div>
        <div class="page-title">Approval Center</div>
        <div class="page-sub">${pending.length} quotation(s) waiting on a decision</div>
      </div>
    </div>
    ${rows || `<div class="card"><div class="empty-state">Nothing waiting for approval right now.</div></div>`}
  `);

  document.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.onclick = async () => {
      await api.decideApproval(btn.dataset.approve, "approve", btn.dataset.role);
      toast("Quotation approved");
      renderApprovals();
    };
  });
  document.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.onclick = async () => {
      const reason = prompt("Reason for rejection?") || "Not specified";
      await api.decideApproval(btn.dataset.reject, "reject", "manager", reason);
      toast("Quotation rejected");
      renderApprovals();
    };
  });
  document.querySelectorAll("[data-revise]").forEach((btn) => {
    btn.onclick = async () => {
      const reason = prompt("What needs to change?") || "Needs revision";
      await api.decideApproval(btn.dataset.revise, "revise", "manager", reason);
      toast("Sent back for revision");
      renderApprovals();
    };
  });
}

async function renderPortal(id) {
  root.innerHTML = `<div class="portal-shell"><div class="page-title">Loading…</div></div>`;
  const data = await api.getPortalQuotation(id);

  const lineRows = data.lines.map((l) => `
    <div class="line-item" style="grid-template-columns:1fr 60px 70px 90px;">
      <div>
        <div class="product-name">${l.productName}</div>
        <div class="product-meta">${l.category}</div>
      </div>
      <div style="font-family:var(--font-mono);font-size:12px;">×${l.qty}</div>
      <div style="font-family:var(--font-mono);font-size:12px;">${l.discount}%</div>
      <div style="font-family:var(--font-mono);font-size:12px;text-align:right;">${money(l.total)}</div>
    </div>
  `).join("");

  const negotiationLog = data.negotiations.length
    ? data.negotiations.map((n) => `
        <div class="negotiation-log-item">
          Requested ${n.productName} discount ${n.previousDiscount}% → ${n.requestedDiscount}%${n.comment ? ` — "${n.comment}"` : ""}
        </div>
      `).join("")
    : "";

  root.innerHTML = `
    <div class="portal-shell">
      <div class="portal-header">
        <div class="portal-logo">
          <div class="brand-mark" style="width:26px;height:26px;font-size:12px;">D</div>
          <div style="font-family:var(--font-display);font-weight:600;">DealFlow360 <span style="color:var(--text-faint);font-weight:400;">— Customer Portal</span></div>
        </div>
        <span class="status-chip">${data.portalStatus}</span>
      </div>

      <div class="card">
        <div class="card-title">Quotation for ${data.customerName}</div>
        <div class="card-sub">Reference ${data.id}</div>
        <div class="line-item" style="grid-template-columns:1fr 60px 70px 90px;border-bottom:1px solid var(--border-strong);font-size:11px;color:var(--text-faint);text-transform:uppercase;">
          <div>Product</div><div>Qty</div><div>Disc</div><div style="text-align:right;">Total</div>
        </div>
        ${lineRows}
        <div class="summary-row total"><span>Total</span><span class="val">${money(data.total)}</span></div>
      </div>

      <div class="card">
        <div class="card-title">Negotiate</div>
        <div class="card-sub">Request a different discount on a line item, or accept the quotation as-is</div>
        <div class="negotiate-box">
          <label class="field-label">Line item</label>
          <select id="neg-line" style="width:100%;margin-bottom:10px;">
            ${data.lines.map((l) => `<option value="${l.lineId}">${l.productName} (currently ${l.discount}%)</option>`).join("")}
          </select>
          <label class="field-label">Requested discount %</label>
          <input type="number" id="neg-discount" min="0" max="100" value="0" style="margin-bottom:10px;" />
          <label class="field-label">Comment</label>
          <textarea id="neg-comment" rows="2" placeholder="e.g. Can we get a better rate on installation?" style="margin-bottom:10px;"></textarea>
          <button class="btn btn-primary btn-sm" id="submit-negotiation">Submit Request</button>
        </div>
        ${negotiationLog}
      </div>

      <div class="card">
        <button class="btn btn-primary" id="portal-confirm-btn" ${data.canConfirm ? "" : "disabled"} style="width:100%;justify-content:center;">
          ${data.canConfirm ? "Confirm Quotation" : "Awaiting internal approval before you can confirm"}
        </button>
      </div>
    </div>
  `;

  document.getElementById("submit-negotiation").onclick = async () => {
    const lineId = document.getElementById("neg-line").value;
    const requestedDiscount = document.getElementById("neg-discount").value;
    const comment = document.getElementById("neg-comment").value;
    const result = await api.negotiate(id, { lineId, requestedDiscount, comment });
    if (result.status === "pending_manager" || result.status === "pending_finance") {
      toast("New terms exceed threshold — sent back for internal approval");
    } else {
      toast("Terms updated — no re-approval needed");
    }
    renderPortal(id);
  };

  const confirmBtn = document.getElementById("portal-confirm-btn");
  if (data.canConfirm) {
    confirmBtn.onclick = async () => {
      await api.portalConfirm(id);
      toast("Quotation confirmed — moving to fulfillment");
      renderPortal(id);
    };
  }
}

route();
