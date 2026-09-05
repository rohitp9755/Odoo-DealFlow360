import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, Layers, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ProductVariantManager({ productId }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newVariantName, setNewVariantName] = useState('');
  const [newValueByVariant, setNewValueByVariant] = useState({});

  useEffect(() => {
    load();
  }, [productId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data: variantList } = await api.get(`/product-variants?product=${productId}`);
      const withValues = await Promise.all(
        (variantList || []).map(async (v) => {
          const { data: values } = await api.get(`/product-variant-values?variant=${v._id}`);
          return { ...v, values: values || [] };
        })
      );
      setVariants(withValues);
    } catch {
      setError('Failed to load product variants');
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
      setError(err.response?.data?.message || 'Failed to create variant');
    }
  }

  async function removeVariant(variant) {
    if (!window.confirm(`Delete variant "${variant.name}" and all associated values?`)) return;
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
      setVariants((prev) =>
        prev.map((v) => (v._id === variant._id ? { ...v, values: [...v.values, data] } : v))
      );
      setNewValueByVariant((prev) => ({ ...prev, [variant._id]: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add variant value');
    }
  }

  async function removeValue(variant, val) {
    try {
      await api.delete(`/product-variant-values/${val._id}`);
      setVariants((prev) =>
        prev.map((v) =>
          v._id === variant._id
            ? { ...v, values: v.values.filter((x) => x._id !== val._id) }
            : v
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove value');
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-brand-600" />
            Product Variants Matrix
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Define attributes (e.g. Storage, Color) and valid options for this product.
          </p>
        </div>
      </div>

      {loading && <div className="text-xs text-slate-400 py-3">Loading variants…</div>}

      {!loading && (
        <div className="space-y-3.5">
          {variants.map((v) => (
            <div
              key={v._id}
              className="p-3.5 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 tracking-tight">{v.name}</span>
                <button
                  type="button"
                  onClick={() => removeVariant(v)}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                  title="Delete attribute"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Value pills */}
              <div className="flex flex-wrap gap-1.5">
                {v.values.length === 0 && (
                  <span className="text-[11px] text-slate-400 italic">No values defined yet</span>
                )}
                {v.values.map((val) => (
                  <span
                    key={val._id}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-subtle"
                  >
                    <span>{val.value}</span>
                    <button
                      type="button"
                      onClick={() => removeValue(v, val)}
                      className="p-0.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove option"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Value Form */}
              <form onSubmit={(e) => addValue(v, e)} className="flex gap-2 pt-1">
                <input
                  className="input text-xs py-1 flex-1"
                  placeholder={`Add option to ${v.name} (e.g. Space Grey)…`}
                  value={newValueByVariant[v._id] || ''}
                  onChange={(e) =>
                    setNewValueByVariant((prev) => ({ ...prev, [v._id]: e.target.value }))
                  }
                />
                <button type="submit" className="btn btn-outline text-xs py-1">
                  Add Option
                </button>
              </form>
            </div>
          ))}

          {variants.length === 0 && (
            <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No variant attributes configured for this product.
            </div>
          )}

          {/* Add Variant Form */}
          <form onSubmit={addVariant} className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              className="input text-xs flex-1"
              placeholder="New attribute name (e.g. Color, RAM, Screen Size)…"
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary text-xs flex items-center gap-1.5">
              <Plus size={13} /> Add Attribute
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
          <AlertCircle size={13} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
