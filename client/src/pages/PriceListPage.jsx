import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import Layout from '../components/Layout';

const TIERS = ['Bronze', 'Silver', 'Gold'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

const EMPTY_FORM = { tier: 'Bronze', currency: 'INR', product: '', price: '' };

export default function PriceListPage() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tierFilter, setTierFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/products?status=active').then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierFilter, currencyFilter, statusFilter]);

  function load() {
    setLoading(true);
    setError('');
    const params = {};
    if (tierFilter) params.tier = tierFilter;
    if (currencyFilter) params.currency = currencyFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    api.get('/price-lists', { params })
      .then((r) => setRows(r.data))
      .catch(() => setError('Failed to load price lists'))
      .finally(() => setLoading(false));
  }

  const productById = useMemo(() => {
    const map = new Map(products.map((p) => [p._id, p]));
    return map;
  }, [products]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditingId(row._id);
    setForm({
      tier: row.tier,
      currency: row.currency,
      product: row.product?._id || row.product,
      price: row.price
    });
    setFormError('');
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.product) return setFormError('Product is required');
    if (form.price === '' || Number(form.price) < 0) return setFormError('A valid price is required');

    setSaving(true);
    try {
      if (editingId) {
        const { data } = await api.put(`/price-lists/${editingId}`, { price: Number(form.price) });
        setRows((prev) => prev.map((r) => (r._id === editingId ? { ...r, ...data } : r)));
      } else {
        const payload = {
          tier: form.tier,
          currency: form.currency,
          product: form.product,
          price: Number(form.price)
        };
        const { data } = await api.post('/price-lists', payload);
        setRows((prev) => [data, ...prev]);
      }
      closeForm();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save price rule');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    try {
      const { data } = await api.put(`/price-lists/${row._id}`, { active: !row.active });
      setRows((prev) => prev.map((r) => (r._id === row._id ? { ...r, ...data } : r)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update price rule');
    }
  }

  async function remove(row) {
    const name = row.product?.name || 'this product';
    if (!window.confirm(`Delete the ${row.tier}/${row.currency} price rule for "${name}"?`)) return;
    try {
      await api.delete(`/price-lists/${row._id}`);
      setRows((prev) => prev.filter((r) => r._id !== row._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete price rule');
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Price Lists</h1>
          <p className="text-sm text-slate-500">Manage tier- and currency-specific product pricing</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={16} /> New Price Rule
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select className="input w-auto" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value="">All tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="input w-auto" value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)}>
          <option value="">All currencies</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All statuses</option>
        </select>
      </div>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      {formOpen && (
        <Modal isOpen={formOpen} onClose={closeForm} title={editingId ? 'Edit Price Rule' : 'New Price Rule'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600">Product</label>
                <select
                  className="input mt-1"
                  value={form.product}
                  onChange={(e) => update('product', e.target.value)}
                  disabled={Boolean(editingId)}
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Customer Tier</label>
                <select
                  className="input mt-1"
                  value={form.tier}
                  onChange={(e) => update('tier', e.target.value)}
                  disabled={Boolean(editingId)}
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Currency</label>
                <select
                  className="input mt-1"
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value)}
                  disabled={Boolean(editingId)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600">
                  Price ({CURRENCY_SYMBOLS[form.currency] || form.currency})
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="input mt-1 max-w-[12rem]"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                />
              </div>
            </div>

            {formError && <div className="text-red-600 text-sm">{formError}</div>}

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Price Rule'}
              </button>
              <button type="button" onClick={closeForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Tier</th>
              <th className="text-left px-4 py-3">Currency</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Base Price</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No price rules match your filters.</td></tr>
            )}
            {rows.map((r) => {
              const product = r.product && typeof r.product === 'object' ? r.product : productById.get(r.product);
              return (
                <tr key={r._id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{product?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{r.tier}</td>
                  <td className="px-4 py-3 text-slate-500">{r.currency}</td>
                  <td className="px-4 py-3">{CURRENCY_SYMBOLS[r.currency] || ''}{r.price?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-400">{product ? `₹${product.price?.toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${r.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {r.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100" title="Edit price">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => toggleActive(r)} className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-slate-100" title={r.active ? 'Deactivate' : 'Activate'}>
                        <Power size={15} />
                      </button>
                      <button onClick={() => remove(r)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
