import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Power, Save, Boxes, DollarSign } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import ProductVariantManager from '../components/ProductVariantManager';
import PriceListManager from '../components/PriceListManager';

const EMPTY_FORM = {
  name: '',
  category: '',
  price: '',
  cost: '',
  unit: 'unit',
  tax: 18,
  description: '',
  active: true
};

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/product-categories?status=active').then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get(`/products/${id}`)
      .then((r) =>
        setForm({
          name: r.data.name,
          category: r.data.category,
          price: r.data.price,
          cost: r.data.cost,
          unit: r.data.unit,
          tax: r.data.tax,
          description: r.data.description || '',
          active: r.data.active
        })
      )
      .catch(() => setError('Failed to load product details'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Product name is required');
    if (!form.category) return setError('Category is required');
    if (form.price === '' || Number(form.price) < 0) return setError('A valid selling price is required');
    if (form.cost === '' || Number(form.cost) < 0) return setError('A valid unit cost is required');

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      cost: Number(form.cost),
      unit: form.unit.trim() || 'unit',
      tax: Number(form.tax) || 0,
      description: form.description.trim()
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        navigate('/admin/products');
      } else {
        const { data } = await api.post('/products', payload);
        navigate(`/admin/products/${data._id}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    try {
      const { data } = await api.put(`/products/${id}`, { active: !form.active });
      setForm((prev) => ({ ...prev, active: data.active }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update active state');
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${form.name}"? This also removes its variants.`)) return;
    try {
      await api.delete(`/products/${id}`);
      navigate('/admin/products');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-12 text-center text-xs text-slate-400">Loading catalog item…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={isEdit ? form.name || 'Edit Product' : 'Create Catalog Product'}
        subtitle="Configure catalog item attributes, margin parameters, and variation values."
        backTo="/admin/products"
        backLabel="Back to Products"
        badge={
          isEdit && (
            <StatusBadge status={form.active ? 'active' : 'inactive'} size="xs" />
          )
        }
        actions={
          isEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleActive}
                className="btn btn-outline text-xs flex items-center gap-1.5"
              >
                <Power size={13} />
                {form.active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={remove}
                className="btn btn-danger text-xs flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Core Product Information Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
            <Boxes size={15} className="text-brand-600" />
            General Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Product Title *</label>
              <input
                className="input text-xs"
                placeholder="e.g. Laptop Pro 14"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Category *</label>
              <select
                className="input text-xs"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                required
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit of Measure</label>
              <input
                className="input text-xs"
                placeholder="unit, seat, month…"
                value={form.unit}
                onChange={(e) => update('unit', e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Description</label>
              <textarea
                className="input text-xs h-20 resize-none"
                placeholder="Technical specifications or sales notes…"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Pricing and Margins Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
            <DollarSign size={15} className="text-brand-600" />
            Financials & Taxation
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Base Selling Price (₹) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input text-xs"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit Cost (₹) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="input text-xs"
                placeholder="0.00"
                value={form.cost}
                onChange={(e) => update('cost', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tax Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="input text-xs"
                placeholder="18"
                value={form.tax}
                onChange={(e) => update('tax', e.target.value)}
              />
            </div>
          </div>

          {form.price && form.cost && Number(form.price) > 0 && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Target Product Margin:</span>
              <span className="font-semibold text-emerald-700">
                ₹{(Number(form.price) - Number(form.cost)).toLocaleString('en-IN')} (
                {(
                  ((Number(form.price) - Number(form.cost)) / Number(form.price)) *
                  100
                ).toFixed(1)}
                %)
              </span>
            </div>
          )}
        </div>

        {/* Product Variant Manager */}
        {isEdit && <ProductVariantManager productId={id} />}

        {/* Price List Manager */}
        {isEdit && <PriceListManager productId={id} />}

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <Save size={13} />
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="btn btn-ghost text-xs"
          >
            Cancel
          </button>
        </div>
      </form>
    </Layout>
  );
}
