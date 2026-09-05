import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Power } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import ProductVariantManager from '../components/ProductVariantManager';

const EMPTY_FORM = { name: '', category: '', price: '', cost: '', unit: 'unit', tax: 18, description: '', active: true };

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
    api.get('/product-categories?status=active').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get(`/products/${id}`)
      .then((r) => setForm({
        name: r.data.name,
        category: r.data.category,
        price: r.data.price,
        cost: r.data.cost,
        unit: r.data.unit,
        tax: r.data.tax,
        description: r.data.description || '',
        active: r.data.active
      }))
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!form.category) return setError('Category is required');
    if (form.price === '' || Number(form.price) < 0) return setError('A valid price is required');
    if (form.cost === '' || Number(form.cost) < 0) return setError('A valid cost is required');

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
      alert(err.response?.data?.message || 'Failed to update product');
    }
  }

  async function removeProduct() {
    if (!window.confirm(`Delete "${form.name}"? This also removes its variants.`)) return;
    try {
      await api.delete(`/products/${id}`);
      navigate('/admin/products');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  }

  if (loading) return <Layout><div className="text-slate-400">Loading…</div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin/products" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-1">
            <ArrowLeft size={13} /> Back to products
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">{isEdit ? (form.name || 'Product') : 'New Product'}</h1>
            {isEdit && (
              <span className={`badge ${form.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {form.active ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>
        {isEdit && (
          <div className="flex gap-2">
            <button onClick={toggleActive} className="btn btn-secondary flex items-center gap-1.5 text-xs">
              <Power size={14} /> {form.active ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={removeProduct} className="btn btn-danger flex items-center gap-1.5 text-xs">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-600">Name</label>
            <input className="input mt-1" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Category</label>
            <select className="input mt-1" value={form.category} onChange={(e) => update('category', e.target.value)}>
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
              {isEdit && form.category && !categories.some((c) => c.name === form.category) && (
                <option value={form.category}>{form.category} (inactive)</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Unit</label>
            <input className="input mt-1" value={form.unit} onChange={(e) => update('unit', e.target.value)} placeholder="unit" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Base Price (₹)</label>
            <input type="number" min={0} className="input mt-1" value={form.price} onChange={(e) => update('price', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Cost (₹, internal)</label>
            <input type="number" min={0} className="input mt-1" value={form.cost} onChange={(e) => update('cost', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-600">Tax (%)</label>
            <input type="number" min={0} max={100} className="input mt-1 max-w-[10rem]" value={form.tax} onChange={(e) => update('tax', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-600">Description</label>
            <textarea className="input mt-1" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
        </button>
      </form>

      {isEdit && (
        <div className="max-w-2xl mt-6">
          <ProductVariantManager productId={id} />
        </div>
      )}
    </Layout>
  );
}
