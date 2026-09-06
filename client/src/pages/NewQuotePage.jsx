import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, Trash2, UserPlus, ArrowLeft, Send, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import CustomerPicker from '../components/CustomerPicker';
import StatusBadge from '../components/StatusBadge';

export default function NewQuotePage() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState([{ product: '', quantity: 1, lineDiscount: 0 }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    api.get('/customers?status=active').then((res) => {
      setCustomers(res.data);
      const preselect = searchParams.get('customer');
      if (preselect && res.data.some((c) => c._id === preselect)) setCustomerId(preselect);
    });
    api.get('/products?status=active').then((res) => setProducts(res.data)).catch(() => {
      api.get('/products').then((res) => setProducts(res.data));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c._id === customerId),
    [customers, customerId]
  );

  useEffect(() => {
    if (selectedCustomer) {
      api.get(`/price-lists?tier=${selectedCustomer.tier}&status=active`)
        .then(res => setPriceLists(res.data))
        .catch(() => setPriceLists([]));
    } else {
      setPriceLists([]);
    }
  }, [selectedCustomer]);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p._id, p])),
    [products]
  );

  const priceListMap = useMemo(() => {
    const map = new Map();
    for (const pl of priceLists) {
      const prodId = typeof pl.product === 'object' ? pl.product._id : pl.product;
      map.set(prodId, pl.price);
    }
    return map;
  }, [priceLists]);

  function updateLine(i, field, value) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { product: '', quantity: 1, lineDiscount: 0 }]);
  }

  function removeLine(i) {
    if (lines.length === 1) {
      setLines([{ product: '', quantity: 1, lineDiscount: 0 }]);
      return;
    }
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Live estimated numbers
  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    for (const l of lines) {
      const p = productMap.get(l.product);
      if (!p) continue;
      const unitPrice = priceListMap.has(p._id) ? priceListMap.get(p._id) : p.price;
      const qty = Math.max(1, Number(l.quantity) || 1);
      const disc = Math.min(100, Math.max(0, Number(l.lineDiscount) || 0));
      const lineSubtotal = unitPrice * qty;
      const lineDiscAmount = lineSubtotal * (disc / 100);
      subtotal += lineSubtotal;
      discount += lineDiscAmount;
    }
    return {
      subtotal,
      discount,
      total: subtotal - discount
    };
  }, [lines, productMap, priceListMap]);

  async function createQuote() {
    setError('');
    if (!customerId) return setError('Please select a customer.');
    const validLines = lines.filter((l) => l.product);
    if (validLines.length === 0) return setError('Please add at least one product item.');

    setSaving(true);
    try {
      const { data } = await api.post('/quotes', { customer: customerId, lines: validLines });
      navigate(`/quotes/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quotation.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Create Quotation"
        subtitle="Build a deal proposal with real-time margin calculations and discount risk analysis."
        backTo="/quotes"
        backLabel="Back to Quotations"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Builder Form */}
        <div className="lg:col-span-8 space-y-5">
          {/* Customer Selection Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Customer Account
              </label>
              <Link
                to="/customers/new"
                className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1"
              >
                <UserPlus size={13} /> New customer
              </Link>
            </div>
            <CustomerPicker customers={customers} value={customerId} onChange={setCustomerId} />

            {selectedCustomer && (
              <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Tier:</span>
                  <StatusBadge status={selectedCustomer.tier.toLowerCase()} size="xs" />
                  {selectedCustomer.email && (
                    <span className="text-slate-400 hidden sm:inline">· {selectedCustomer.email}</span>
                  )}
                </div>
                <div className="text-slate-500 font-medium">
                  {selectedCustomer.tier === 'Gold'
                    ? '15% autonomous ceiling'
                    : selectedCustomer.tier === 'Silver'
                    ? '10% autonomous ceiling'
                    : '5% autonomous ceiling'}
                </div>
              </div>
            )}
          </div>

          {/* Line Items Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Products & Line Items
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specify catalog items, quantities, and negotiated discounts.
                </p>
              </div>
              <button
                type="button"
                onClick={addLine}
                className="btn btn-outline text-xs flex items-center gap-1.5"
              >
                <Plus size={14} /> Add item
              </button>
            </div>

            <div className="space-y-2.5">
              {lines.map((line, i) => {
                const prod = productMap.get(line.product);
                const unitPrice = prod ? (priceListMap.has(prod._id) ? priceListMap.get(prod._id) : prod.price) : 0;
                const lineTotal = prod
                  ? unitPrice * (Number(line.quantity) || 1) * (1 - (Number(line.lineDiscount) || 0) / 100)
                  : 0;

                return (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 transition-colors"
                  >
                    {/* Product Select */}
                    <div className="flex-[3]">
                      <select
                        className="input text-xs"
                        value={line.product}
                        onChange={(e) => updateLine(i, 'product', e.target.value)}
                      >
                        <option value="">Select product from catalog…</option>
                        {products.map((p) => {
                          const pPrice = priceListMap.has(p._id) ? priceListMap.get(p._id) : p.price;
                          return (
                            <option key={p._id} value={p._id}>
                              {p.name} — ₹{pPrice.toLocaleString('en-IN')} ({p.category})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-full sm:w-20">
                      <label className="text-[10px] text-slate-400 block sm:hidden">Qty</label>
                      <input
                        type="number"
                        min={1}
                        className="input text-xs"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))}
                      />
                    </div>

                    {/* Discount % */}
                    <div className="w-full sm:w-24">
                      <label className="text-[10px] text-slate-400 block sm:hidden">Discount %</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="input text-xs pr-6"
                          placeholder="Disc"
                          value={line.lineDiscount}
                          onChange={(e) => updateLine(i, 'lineDiscount', Number(e.target.value))}
                        />
                        <span className="absolute right-2.5 top-2 text-xs text-slate-400 pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Line Total preview */}
                    <div className="w-full sm:w-28 text-right sm:text-right font-semibold text-xs text-slate-800 tabular-nums self-center">
                      {prod ? `₹${Math.round(lineTotal).toLocaleString('en-IN')}` : '-'}
                    </div>

                    {/* Delete line */}
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors self-center shrink-0"
                      title="Remove line"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200/60 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary & Confirmation Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-5 sticky top-20">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Proposal Estimation
            </h3>

            <div className="space-y-2 text-xs pb-3 border-b border-slate-100">
              <div className="flex justify-between text-slate-500">
                <span>Gross Subtotal</span>
                <span className="font-medium text-slate-800 tabular-nums">
                  ₹{totals.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Discount</span>
                <span className="font-medium text-slate-800 tabular-nums">
                  -₹{Math.round(totals.discount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Items</span>
                <span className="font-medium text-slate-800">
                  {lines.filter((l) => l.product).length} line items
                </span>
              </div>
            </div>

            <div className="pt-3 mb-5 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-slate-900">Net Deal Total</span>
              <span className="text-xl font-bold text-brand-700 tabular-nums">
                ₹{Math.round(totals.total).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 mb-5 space-y-1">
              <div>• Calculations are recalculated server-side.</div>
              <div>• Discounts exceeding tier/category limits will route to manager approval.</div>
            </div>

            <button
              type="button"
              onClick={createQuote}
              disabled={saving}
              className="btn btn-primary w-full py-2.5 text-xs flex justify-center items-center gap-2"
            >
              <Send size={14} />
              {saving ? 'Creating quotation…' : 'Generate Quotation'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
