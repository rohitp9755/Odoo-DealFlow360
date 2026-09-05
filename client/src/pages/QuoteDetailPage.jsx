import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  PackageCheck,
  Receipt,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Layers,
  ArrowLeft,
  DollarSign
} from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import RecommendationPanel from '../components/RecommendationPanel';
import NegotiationChat from '../components/NegotiationChat';

export default function QuoteDetailPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [recs, setRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [fulfillment, setFulfillment] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [health, setHealth] = useState(null);
  const [negotiation, setNegotiation] = useState(null);
  const [chatSending, setChatSending] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get(`/quotes/${id}`);
    setQuote(data);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api.get(`/recommendations/${id}`).then((res) => setRecs(res.data)).catch(() => {});
    api.get(`/negotiations/${id}`).then((res) => setNegotiation(res.data)).catch(() => {});
    api.get(`/fulfillment/${id}`).then((res) => setFulfillment(res.data)).catch(() => {});
    api.get(`/billing/${id}`).then((res) => setInvoices(res.data)).catch(() => {});
    api.get(`/deals/${id}/health`).then((res) => setHealth(res.data)).catch(() => {});
  }, [id]);

  async function updateLine(index, field, value) {
    const newLines = quote.lines.map((l, i) => (i === index ? { ...l, [field]: value } : l));
    setQuote({ ...quote, lines: newLines }); // optimistic
    const payload = newLines.map((l) => ({
      product: l.product._id || l.product,
      quantity: l.quantity,
      lineDiscount: l.lineDiscount
    }));
    const { data } = await api.put(`/quotes/${id}`, { lines: payload });
    setQuote(data);
  }

  async function generateRecs() {
    setRecsLoading(true);
    try {
      const { data } = await api.post(`/recommendations/generate/${id}`);
      setRecs(data);
    } finally {
      setRecsLoading(false);
    }
  }

  async function addRec(rec) {
    const { data } = await api.post(`/recommendations/${rec._id}/add`);
    setQuote(data);
    setRecs((prev) => prev.map((r) => (r._id === rec._id ? { ...r, status: 'added' } : r)));
  }

  async function dismissRec(rec) {
    await api.post(`/recommendations/${rec._id}/dismiss`);
    setRecs((prev) => prev.filter((r) => r._id !== rec._id));
  }

  async function submitForApproval() {
    setBusy(true);
    try {
      const { data } = await api.post(`/quotes/${id}/submit`);
      setSubmitResult(data);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function confirmQuote() {
    setBusy(true);
    try {
      const { data } = await api.post(`/quotes/${id}/confirm`);
      setQuote(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not confirm quotation.');
    } finally {
      setBusy(false);
    }
  }

  async function allocateWarehouses() {
    const { data } = await api.post(`/fulfillment/${id}/allocate`);
    setFulfillment(data);
  }

  async function generateInvoices() {
    const { data } = await api.post(`/billing/${id}/generate`);
    setInvoices(data);
  }

  async function recalcHealth() {
    const { data } = await api.post(`/deals/${id}/health/recalculate`);
    setHealth(data);
  }

  async function sendChat(text) {
    setChatSending(true);
    try {
      const { data } = await api.post(`/negotiations/${id}/message`, { message: text });
      setNegotiation(data.negotiation);
    } finally {
      setChatSending(false);
    }
  }

  async function offerAction(offer, action) {
    const { data } = await api.post(`/negotiations/${id}/counter-offer`, {
      offerId: offer._id,
      action
    });
    if (data.quote) setQuote(data.quote);
    const refreshed = await api.get(`/negotiations/${id}`);
    setNegotiation(refreshed.data);
  }

  if (!quote) {
    return (
      <Layout>
        <div className="p-12 text-center text-xs text-slate-400">Loading quotation…</div>
      </Layout>
    );
  }

  const lastOffer = negotiation?.offers?.[negotiation.offers.length - 1];

  return (
    <Layout>
      <PageHeader
        title={quote.customer?.name || 'Deal Proposal'}
        subtitle={`Quotation #${quote._id.slice(-6)} · Created ${new Date(quote.createdAt).toLocaleDateString()}`}
        backTo="/quotes"
        backLabel="Back to Quotations"
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge status={quote.stage} />
            <RiskBadge band={quote.riskBand} />
            <span className="text-xs text-slate-400 font-medium">
              {quote.customer?.tier} tier
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {['draft', 'returned'].includes(quote.stage) && (
              <button
                type="button"
                onClick={submitForApproval}
                disabled={busy}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <Send size={13} />
                {busy ? 'Submitting…' : 'Submit for Approval'}
              </button>
            )}
            {['approved', 'sent', 'under_negotiation'].includes(quote.stage) && (
              <button
                type="button"
                onClick={confirmQuote}
                disabled={busy}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} />
                {busy ? 'Confirming…' : 'Confirm Quotation'}
              </button>
            )}
          </div>
        }
      />

      {/* Submit Approval Result Banner */}
      {submitResult && (
        <div
          className={`card p-4 mb-6 border-l-4 ${
            submitResult.requiresApproval
              ? 'border-amber-500 bg-amber-50/40'
              : 'border-emerald-500 bg-emerald-50/40'
          }`}
        >
          <div className="font-semibold text-xs flex items-center gap-1.5 text-slate-800 mb-1.5">
            <AlertTriangle
              size={14}
              className={submitResult.requiresApproval ? 'text-amber-600' : 'text-emerald-600'}
            />
            {submitResult.requiresApproval
              ? 'Approval Workflow Required'
              : 'Quote Approved Automatically'}
          </div>

          {submitResult.approval && (
            <div className="text-xs text-slate-600 space-y-1">
              <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                {submitResult.approval.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-500">
                <span>
                  Risk score: <b>{submitResult.approval.riskScore}/100</b>
                </span>
                <span>•</span>
                <span>
                  Margin leakage:{' '}
                  <b>₹{(submitResult.approval.marginLeakage || 0).toLocaleString('en-IN')}</b>
                </span>
                <span>•</span>
                <span>
                  Required sign-off:{' '}
                  <b>{submitResult.approval.steps.map((s) => s.role).join(' + ')}</b>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Line Items + AI Assistants */}
        <div className="lg:col-span-8 space-y-6">
          {/* Products Table Card */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Line Items & Discounts
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Editable unit pricing, quantities, and negotiated percentage discounts
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {quote.lines.length} items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-th">Product</th>
                    <th className="table-th text-center w-20">Qty</th>
                    <th className="table-th text-right w-28">Unit Price</th>
                    <th className="table-th text-center w-24">Discount</th>
                    <th className="table-th text-center w-24">Allowed</th>
                    <th className="table-th text-right w-28">Total</th>
                    <th className="table-th text-right w-24">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {quote.lines.map((l, i) => {
                    const isViolated = l.violation > 0;
                    return (
                      <tr
                        key={l._id || i}
                        className={`transition-colors ${
                          isViolated ? 'bg-rose-50/40 hover:bg-rose-50/60' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="table-td">
                          <div className="font-semibold text-slate-900">
                            {l.product?.name || l.product}
                          </div>
                          {l.violation > 0 && (
                            <span className="text-[10px] font-medium text-rose-600">
                              Exceeds category ceiling by {l.violation}%
                            </span>
                          )}
                        </td>

                        <td className="table-td text-center">
                          <input
                            type="number"
                            min={1}
                            value={l.quantity}
                            className="input w-16 py-1 px-2 text-center text-xs"
                            onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))}
                          />
                        </td>

                        <td className="table-td text-right tabular-nums text-slate-700">
                          ₹{l.unitPrice?.toLocaleString('en-IN')}
                        </td>

                        <td className="table-td text-center">
                          <div className="relative inline-block">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={l.lineDiscount}
                              className={`input w-16 py-1 px-1.5 text-center text-xs ${
                                isViolated ? 'border-rose-400 ring-1 ring-rose-200 bg-rose-50/50' : ''
                              }`}
                              onChange={(e) =>
                                updateLine(i, 'lineDiscount', Number(e.target.value))
                              }
                            />
                          </div>
                        </td>

                        <td className="table-td text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {l.allowedDiscount}%
                          </span>
                        </td>

                        <td className="table-td text-right font-semibold text-slate-900 tabular-nums">
                          ₹{l.total?.toLocaleString('en-IN')}
                        </td>

                        <td className="table-td text-right">
                          <span
                            className={`text-xs font-medium tabular-nums ${
                              (l.marginPercent || 0) < 15
                                ? 'text-rose-600 font-semibold'
                                : 'text-slate-700'
                            }`}
                          >
                            {l.marginPercent?.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Recommendations Section */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    AI Product Recommendations
                  </h3>
                  <p className="text-[11px] text-slate-400 -mt-0.5">
                    Co-purchase affinity, margin optimization, and warehouse stock
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={generateRecs}
                disabled={recsLoading}
                className="btn btn-outline text-xs flex items-center gap-1.5"
              >
                <Sparkles size={12} className={recsLoading ? 'animate-spin text-brand-500' : ''} />
                {recsLoading ? 'Analyzing…' : 'Generate recommendations'}
              </button>
            </div>

            <RecommendationPanel
              recommendations={recs}
              onAdd={addRec}
              onDismiss={dismissRec}
              loading={recsLoading}
            />
          </div>

          {/* AI Negotiation Agent Section */}
          <div>
            <NegotiationChat
              messages={negotiation?.messages}
              offer={lastOffer}
              onSend={sendChat}
              onOfferAction={offerAction}
              sending={chatSending}
            />
          </div>
        </div>

        {/* Right Column: Financial Totals, Fulfillment, Billing & Health */}
        <div className="lg:col-span-4 space-y-5">
          {/* Financial Totals Card */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3.5">
              Financial Breakdown
            </h3>

            <div className="space-y-2 text-xs">
              <Row label="Gross Subtotal" value={quote.subtotal} />
              <Row label="Total Discount" value={-quote.discountAmount} isNegative />
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-900">Total Contract Value</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  ₹{quote.total?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <Row label="Projected Margin" value={quote.margin} />
                <div className="flex justify-between text-xs mt-1 text-slate-500">
                  <span>Margin %</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      quote.marginPercent < 15 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {quote.marginPercent?.toFixed(1)}%
                  </span>
                </div>
              </div>

              {quote.marginLeakage > 0 && (
                <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-700 text-xs">
                  <div className="font-semibold text-[11px] text-rose-800">Margin Leakage Detected</div>
                  <div className="text-[11px] mt-0.5">
                    ₹{quote.marginLeakage?.toLocaleString('en-IN')} estimated loss from discounts exceeding allowed thresholds.
                  </div>
                </div>
              )}

              {(quote.oneTimeTotal > 0 || quote.recurringTotal > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>One-time billing:</span>
                    <span className="font-medium text-slate-800">
                      ₹{quote.oneTimeTotal?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {quote.recurringTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Recurring ({quote.recurringCycle}):</span>
                      <span className="font-medium text-slate-800">
                        ₹{quote.recurringTotal?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                <PackageCheck size={15} className="text-brand-600" />
                Warehouse Allocation
              </div>
              {fulfillment && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {fulfillment.shipmentCount} shipment(s)
                </span>
              )}
            </div>

            {!fulfillment ? (
              <div>
                <p className="text-xs text-slate-500 mb-3">
                  Cheapest-first algorithmic allocation across Mumbai, Delhi, and Bangalore warehouses.
                </p>
                <button
                  type="button"
                  onClick={allocateWarehouses}
                  className="btn btn-outline text-xs w-full"
                >
                  Allocate Warehouses
                </button>
              </div>
            ) : (
              <div className="text-xs space-y-2">
                <div className="space-y-1.5">
                  {fulfillment.allocations.map((a, idx) => (
                    <div
                      key={a._id || idx}
                      className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="font-medium text-slate-800">
                        {a.warehouse?.name || a.warehouse}
                      </span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {a.quantity} units
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between font-medium">
                  <span className="text-slate-500">Shipping Cost:</span>
                  <span className="text-slate-900 tabular-nums">
                    ₹{fulfillment.totalShippingCost?.toLocaleString('en-IN')}
                  </span>
                </div>

                {fulfillment.backorders?.length > 0 && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{fulfillment.backorders.length} item(s) on backorder</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Billing Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                <Receipt size={15} className="text-brand-600" />
                Invoices & Schedules
              </div>
            </div>

            {invoices.length === 0 ? (
              <div>
                <p className="text-xs text-slate-500 mb-3">
                  Splits confirmed quotes into one-time receipts and recurring subscription invoices.
                </p>
                <button
                  type="button"
                  onClick={generateInvoices}
                  disabled={quote.stage !== 'confirmed'}
                  className="btn btn-outline text-xs w-full disabled:opacity-50"
                  title={quote.stage !== 'confirmed' ? 'Confirm quotation before billing' : ''}
                >
                  Generate Invoices
                </button>
              </div>
            ) : (
              <div className="text-xs space-y-2">
                {invoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 capitalize">
                        {inv.type} {inv.cycle ? `(${inv.cycle})` : ''}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize mt-0.5">
                        Status: {inv.status}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 tabular-nums">
                      ₹{inv.amount?.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deal Health Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                <Activity size={15} className="text-brand-600" />
                Deal Health & Anomaly Alerts
              </div>
            </div>

            {!health ? (
              <div>
                <p className="text-xs text-slate-500 mb-3">
                  Composite factor score analyzing discount anomalies, approval delays, and stalled status.
                </p>
                <button
                  type="button"
                  onClick={recalcHealth}
                  className="btn btn-outline text-xs w-full"
                >
                  Calculate Deal Health
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {health.score}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <StatusBadge status={health.status} />
                </div>

                {health.alerts?.length > 0 ? (
                  <div className="mt-3 space-y-1.5">
                    {health.alerts.map((a, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-amber-50 border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-1.5"
                      >
                        <AlertTriangle size={13} className="shrink-0 text-amber-600 mt-0.5" />
                        <span>{a.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
                    <CheckCircle2 size={13} /> All governance checks healthy
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value, bold, isNegative }) {
  return (
    <div
      className={`flex justify-between text-xs ${
        bold ? 'font-semibold text-slate-900' : 'text-slate-500'
      }`}
    >
      <span>{label}</span>
      <span className={`tabular-nums ${isNegative ? 'text-rose-600 font-medium' : 'text-slate-800'}`}>
        ₹{value?.toLocaleString('en-IN')}
      </span>
    </div>
  );
}
