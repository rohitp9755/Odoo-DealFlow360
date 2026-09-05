import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Send, PackageCheck, Receipt, Activity, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import StageBadge from '../components/StageBadge';
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

  useEffect(() => { load(); }, [load]);
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
    const payload = newLines.map((l) => ({ product: l.product._id || l.product, quantity: l.quantity, lineDiscount: l.lineDiscount }));
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
    } finally { setBusy(false); }
  }

  async function confirmQuote() {
    setBusy(true);
    try {
      const { data } = await api.post(`/quotes/${id}/confirm`);
      setQuote(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not confirm');
    } finally { setBusy(false); }
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
    } finally { setChatSending(false); }
  }
  async function offerAction(offer, action) {
    const { data } = await api.post(`/negotiations/${id}/counter-offer`, { offerId: offer._id, action });
    if (data.quote) setQuote(data.quote);
    const refreshed = await api.get(`/negotiations/${id}`);
    setNegotiation(refreshed.data);
  }

  if (!quote) return <Layout><div className="text-slate-400">Loading…</div></Layout>;

  const lastOffer = negotiation?.offers?.[negotiation.offers.length - 1];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{quote.customer?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StageBadge stage={quote.stage} />
            <RiskBadge band={quote.riskBand} />
            <span className="text-xs text-slate-400">{quote.customer?.tier} tier</span>
          </div>
        </div>
        <div className="flex gap-2">
          {['draft', 'returned'].includes(quote.stage) && (
            <button onClick={submitForApproval} disabled={busy} className="btn btn-primary flex items-center gap-1.5">
              <Send size={15} /> Submit
            </button>
          )}
          {['approved', 'sent', 'under_negotiation'].includes(quote.stage) && (
            <button onClick={confirmQuote} disabled={busy} className="btn btn-primary">Confirm Quote</button>
          )}
        </div>
      </div>

      {submitResult && (
        <div className={`card p-4 mb-6 border-l-4 ${submitResult.requiresApproval ? 'border-amber-400' : 'border-emerald-400'}`}>
          <div className="font-semibold text-sm mb-1 flex items-center gap-1.5">
            <AlertTriangle size={15} className={submitResult.requiresApproval ? 'text-amber-500' : 'text-emerald-500'} />
            {submitResult.requiresApproval ? 'Approval Required' : 'No Approval Needed'}
          </div>
          {submitResult.approval && (
            <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5 mt-1">
              {submitResult.approval.reasons.map((r, i) => <li key={i}>{r}</li>)}
              <li>Risk score: {submitResult.approval.riskScore}/100 · Margin leakage: ₹{submitResult.approval.marginLeakage.toLocaleString('en-IN')}</li>
              <li>Required approvers: {submitResult.approval.steps.map((s) => s.role).join(' + ')}</li>
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2.5">Product</th>
                  <th className="text-left px-4 py-2.5">Qty</th>
                  <th className="text-left px-4 py-2.5">Price</th>
                  <th className="text-left px-4 py-2.5">Discount %</th>
                  <th className="text-left px-4 py-2.5">Allowed %</th>
                  <th className="text-left px-4 py-2.5">Total</th>
                  <th className="text-left px-4 py-2.5">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {quote.lines.map((l, i) => (
                  <tr key={l._id} className={`border-t border-slate-100 ${l.violation > 0 ? 'bg-red-50/50' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-slate-700">{l.product?.name || l.product}</td>
                    <td className="px-4 py-2.5">
                      <input type="number" min={1} value={l.quantity} className="input w-16 py-1"
                        onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))} />
                    </td>
                    <td className="px-4 py-2.5">₹{l.unitPrice?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">
                      <input type="number" min={0} max={100} value={l.lineDiscount} className={`input w-16 py-1 ${l.violation > 0 ? 'border-red-400' : ''}`}
                        onChange={(e) => updateLine(i, 'lineDiscount', Number(e.target.value))} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{l.allowedDiscount}%</td>
                    <td className="px-4 py-2.5 font-medium">₹{l.total?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5">{l.marginPercent?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-4">
            <div className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-1.5">
              <Sparkles size={15} className="text-brand-500" /> AI Product Recommendations
            </div>
            <button onClick={generateRecs} className="btn btn-secondary text-xs mb-3">Generate recommendations</button>
            <RecommendationPanel recommendations={recs} onAdd={addRec} onDismiss={dismissRec} loading={recsLoading} />
          </div>

          <div>
            <div className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-1.5">
              AI Negotiation Agent
            </div>
            <NegotiationChat
              messages={negotiation?.messages}
              offer={lastOffer}
              onSend={sendChat}
              onOfferAction={offerAction}
              sending={chatSending}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <div className="font-semibold text-sm text-slate-700 mb-3">Totals</div>
            <Row label="Subtotal" value={quote.subtotal} />
            <Row label="Discount" value={-quote.discountAmount} />
            <Row label="Total" value={quote.total} bold />
            <Row label="Margin" value={quote.margin} />
            <div className="flex justify-between text-sm mt-1.5">
              <span className="text-slate-500">Margin %</span>
              <span className="font-medium">{quote.marginPercent?.toFixed(1)}%</span>
            </div>
            {quote.marginLeakage > 0 && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs">
                Margin leakage: ₹{quote.marginLeakage?.toLocaleString('en-IN')}
              </div>
            )}
            {(quote.oneTimeTotal > 0 || quote.recurringTotal > 0) && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div>One-time: ₹{quote.oneTimeTotal?.toLocaleString('en-IN')}</div>
                {quote.recurringTotal > 0 && <div>Recurring ({quote.recurringCycle}): ₹{quote.recurringTotal?.toLocaleString('en-IN')}</div>}
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-1.5">
              <PackageCheck size={15} className="text-brand-500" /> Fulfillment
            </div>
            {!fulfillment ? (
              <button onClick={allocateWarehouses} className="btn btn-secondary text-xs w-full">Allocate Warehouses</button>
            ) : (
              <div className="text-xs space-y-1.5">
                {fulfillment.allocations.map((a) => (
                  <div key={a._id} className="flex justify-between">
                    <span>{a.warehouse?.name || a.warehouse}</span>
                    <span>{a.quantity} units</span>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-slate-100 flex justify-between font-medium">
                  <span>Shipping cost</span><span>₹{fulfillment.totalShippingCost?.toLocaleString('en-IN')}</span>
                </div>
                {fulfillment.backorders?.length > 0 && (
                  <div className="text-amber-600">Backordered: {fulfillment.backorders.length} line(s)</div>
                )}
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-1.5">
              <Receipt size={15} className="text-brand-500" /> Billing
            </div>
            {invoices.length === 0 ? (
              <button onClick={generateInvoices} className="btn btn-secondary text-xs w-full" disabled={quote.stage !== 'confirmed'}>
                Generate Invoices
              </button>
            ) : (
              <div className="text-xs space-y-1.5">
                {invoices.map((inv) => (
                  <div key={inv._id} className="flex justify-between">
                    <span className="capitalize">{inv.type} {inv.cycle ? `(${inv.cycle})` : ''}</span>
                    <span>₹{inv.amount?.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-1.5">
              <Activity size={15} className="text-brand-500" /> Deal Health
            </div>
            {!health ? (
              <button onClick={recalcHealth} className="btn btn-secondary text-xs w-full">Calculate</button>
            ) : (
              <div>
                <div className="text-2xl font-bold text-slate-800">{health.score}<span className="text-sm text-slate-400">/100</span></div>
                <div className="text-xs text-slate-500 mb-2">{health.status}</div>
                {health.alerts?.length > 0 && (
                  <ul className="text-xs text-amber-600 space-y-1">
                    {health.alerts.map((a, i) => <li key={i}>⚠ {a.message}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between text-sm mb-1.5 ${bold ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
      <span>{label}</span>
      <span>₹{value?.toLocaleString('en-IN')}</span>
    </div>
  );
}
