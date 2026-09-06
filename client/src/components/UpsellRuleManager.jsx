import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function UpsellRuleManager() {
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [baseProduct, setBaseProduct] = useState('');
  const [recommendedProduct, setRecommendedProduct] = useState('');
  const [minMarginPercent, setMinMarginPercent] = useState(0);
  const [isPromotion, setIsPromotion] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/upsell-rules'),
      api.get('/products')
    ]).then(([rulesRes, prodRes]) => {
      setRules(rulesRes.data || []);
      setProducts(prodRes.data || []);
    }).catch(() => {
      setError('Failed to load upsell rules or products');
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  async function addRule(e) {
    e.preventDefault();
    if (!baseProduct || !recommendedProduct) return setError('Base and Recommended products are required');
    if (baseProduct === recommendedProduct) return setError('Products must be different');
    
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/admin/upsell-rules', {
        baseProduct,
        recommendedProduct,
        minMarginPercent: Number(minMarginPercent),
        isPromotion
      });
      // The API might not populate the returned doc, so we find it locally or reload
      const newRule = {
        ...data,
        baseProduct: products.find(p => p._id === baseProduct),
        recommendedProduct: products.find(p => p._id === recommendedProduct)
      };
      setRules((prev) => [...prev, newRule]);
      setRecommendedProduct('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add rule');
    } finally {
      setSaving(false);
    }
  }

  async function removeRule(rule) {
    if (!window.confirm(`Delete recommendation rule?`)) return;
    try {
      await api.delete(`/admin/upsell-rules/${rule._id}`);
      setRules((prev) => prev.filter((r) => r._id !== rule._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete rule');
    }
  }

  if (loading) return <div className="text-xs text-slate-400 py-3">Loading recommendations…</div>;

  return (
    <div className="card p-5 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <LinkIcon size={16} className="text-brand-600" />
            Upsell & Cross-sell Rules
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Define product recommendations based on catalog items.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {rules.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="text-left px-3 py-2">Base Product</th>
                  <th className="text-left px-3 py-2">Recommended</th>
                  <th className="text-center px-3 py-2">Min Margin</th>
                  <th className="text-center px-3 py-2">Promotion</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-semibold text-slate-800">{r.baseProduct?.name || 'Unknown'}</td>
                    <td className="px-3 py-2 text-brand-700 font-medium">{r.recommendedProduct?.name || 'Unknown'}</td>
                    <td className="px-3 py-2 text-center text-slate-500">{r.minMarginPercent}%</td>
                    <td className="px-3 py-2 text-center">
                      {r.isPromotion ? (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] uppercase font-bold tracking-wider">Promo</span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => removeRule(r)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No upsell rules configured.
          </div>
        )}

        <form onSubmit={addRule} className="flex flex-wrap sm:flex-nowrap gap-2 pt-2 border-t border-slate-100 items-end">
          <div className="flex-[2] min-w-[150px]">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Base Product</label>
            <select className="input text-xs w-full" value={baseProduct} onChange={(e) => setBaseProduct(e.target.value)}>
              <option value="">Select...</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex-[2] min-w-[150px]">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Recommended</label>
            <select className="input text-xs w-full" value={recommendedProduct} onChange={(e) => setRecommendedProduct(e.target.value)}>
              <option value="">Select...</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-24">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Min Margin %</label>
            <input
              type="number"
              min={0}
              max={100}
              className="input text-xs w-full"
              placeholder="0"
              value={minMarginPercent}
              onChange={(e) => setMinMarginPercent(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-24 flex items-center h-[34px] px-2 gap-2">
            <input
              type="checkbox"
              id="promo"
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={isPromotion}
              onChange={(e) => setIsPromotion(e.target.checked)}
            />
            <label htmlFor="promo" className="text-xs text-slate-700 cursor-pointer">Promo</label>
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary text-xs flex items-center gap-1.5 h-[34px] px-3 shrink-0">
            <Plus size={13} /> {saving ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
          <AlertCircle size={13} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
