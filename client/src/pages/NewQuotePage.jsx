import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function NewQuotePage() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState([{ product: '', quantity: 1, lineDiscount: 0 }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/customers').then((res) => setCustomers(res.data));
    api.get('/products').then((res) => setProducts(res.data));
  }, []);

  function updateLine(i, field, value) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, { product: '', quantity: 1, lineDiscount: 0 }]);
  }
  function removeLine(i) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function createQuote() {
    setError('');
    if (!customerId) return setError('Select a customer');
    const validLines = lines.filter((l) => l.product);
    if (validLines.length === 0) return setError('Add at least one product');

    setSaving(true);
    try {
      const { data } = await api.post('/quotes', { customer: customerId, lines: validLines });
      navigate(`/quotes/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quote');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <h1 className="text-xl font-bold text-slate-800 mb-6">New Quotation</h1>
      <div className="card p-6 max-w-3xl space-y-5">
        <div>
          <label className="text-xs font-medium text-slate-600">Customer</label>
          <select className="input mt-1" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>{c.name} ({c.tier})</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-600">Products</label>
            <button onClick={addLine} className="text-xs text-brand-600 flex items-center gap-1 font-medium">
              <Plus size={14} /> Add line
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select className="input flex-[3]" value={line.product} onChange={(e) => updateLine(i, 'product', e.target.value)}>
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} — ₹{p.price.toLocaleString('en-IN')} ({p.category})</option>
                  ))}
                </select>
                <input type="number" min={1} className="input flex-1" placeholder="Qty" value={line.quantity}
                  onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))} />
                <input type="number" min={0} max={100} className="input flex-1" placeholder="Disc %" value={line.lineDiscount}
                  onChange={(e) => updateLine(i, 'lineDiscount', Number(e.target.value))} />
                <button onClick={() => removeLine(i)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button onClick={createQuote} disabled={saving} className="btn btn-primary">
          {saving ? 'Creating…' : 'Create Quote'}
        </button>
      </div>
    </Layout>
  );
}
