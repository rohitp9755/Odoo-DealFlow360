import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import api from '../services/api';

export default function ProductVariantManager({ productId }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newVariantName, setNewVariantName] = useState('');
  const [newValueByVariant, setNewValueByVariant] = useState({});

  useEffect(() => { load(); }, [productId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data: variantList } = await api.get(`/product-variants?product=${productId}`);
      const withValues = await Promise.all(
        variantList.map(async (v) => {
          const { data: values } = await api.get(`/product-variant-values?variant=${v._id}`);
          return { ...v, values };
        })
      );
      setVariants(withValues);
    } catch {
      setError('Failed to load variants');
    } finally {
      setLoading(false);
    }
  }

  async function addVariant(e) {
    e.preventDefault();
    const name = newVariantName.trim();
    if (!name) return;
    setError('');
    try {
      const { data } = await api.post('/product-variants', { product: productId, name });
      setVariants((prev) => [...prev, { ...data, values: [] }]);
      setNewVariantName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add variant');
    }
  }

  async function removeVariant(variant) {
    if (!window.confirm(`Delete variant "${variant.name}" and all its values?`)) return;
    try {
      await api.delete(`/product-variants/${variant._id}`);
      setVariants((prev) => prev.filter((v) => v._id !== variant._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete variant');
    }
  }

  async function addValue(variant, e) {
    e.preventDefault();
    const value = (newValueByVariant[variant._id] || '').trim();
    if (!value) return;
    setError('');
    try {
      const { data } = await api.post('/product-variant-values', { variant: variant._id, value });
      setVariants((prev) => prev.map((v) => (v._id === variant._id ? { ...v, values: [...v.values, data] } : v)));
      setNewValueByVariant((prev) => ({ ...prev, [variant._id]: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add value');
    }
  }

  async function removeValue(variant, value) {
    try {
      await api.delete(`/product-variant-values/${value._id}`);
      setVariants((prev) => prev.map((v) => (v._id === variant._id ? { ...v, values: v.values.filter((x) => x._id !== value._id) } : v)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete value');
    }
  }

  return (
    <div className="card p-6">
      <div className="font-semibold text-sm text-slate-700 mb-1">Variants</div>
      <div className="text-xs text-slate-500 mb-4">Define variation axes (e.g. Color, Size) and their values.</div>

      {loading && <div className="text-sm text-slate-400">Loading…</div>}

      {!loading && (
        <div className="space-y-4">
          {variants.map((v) => (
            <div key={v._id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-800">{v.name}</span>
                <button onClick={() => removeVariant(v)} className="text-slate-400 hover:text-red-500" title="Delete variant">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {v.values.length === 0 && <span className="text-xs text-slate-400">No values yet.</span>}
                {v.values.map((val) => (
                  <span key={val._id} className="badge bg-slate-100 text-slate-600 flex items-center gap-1">
                    {val.value}
                    <button onClick={() => removeValue(v, val)} className="text-slate-400 hover:text-red-500" title="Remove value">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={(e) => addValue(v, e)} className="flex gap-2">
                <input
                  className="input py-1.5 text-sm flex-1"
                  placeholder="Add a value (e.g. Red)…"
                  value={newValueByVariant[v._id] || ''}
                  onChange={(e) => setNewValueByVariant((prev) => ({ ...prev, [v._id]: e.target.value }))}
                />
                <button type="submit" className="btn btn-secondary text-xs">Add</button>
              </form>
            </div>
          ))}

          {variants.length === 0 && <div className="text-sm text-slate-400">No variants yet.</div>}

          <form onSubmit={addVariant} className="flex gap-2 pt-3 border-t border-slate-100">
            <input
              className="input flex-1"
              placeholder="New variant name (e.g. Color)…"
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={14} /> Add Variant
            </button>
          </form>
        </div>
      )}

      {error && <div className="text-red-600 text-sm mt-3">{error}</div>}
    </div>
  );
}
