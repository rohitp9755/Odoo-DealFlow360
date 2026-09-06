import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Tags, AlertCircle, Power } from 'lucide-react';
import api from '../services/api';

const TIERS = ['Bronze', 'Silver', 'Gold'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

export default function PriceListManager({ productId }) {
  const [priceLists, setPriceLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newProductId, setNewProductId] = useState('');
  const [newTier, setNewTier] = useState('Bronze');
  const [newCurrency, setNewCurrency] = useState('INR');
  const [newPrice, setNewPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [productId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const url = productId ? `/price-lists?product=${productId}` : `/price-lists`;
      const [plRes, prodRes] = await Promise.all([
        api.get(url),
        !productId ? api.get('/products') : Promise.resolve({ data: [] })
      ]);
      setPriceLists(plRes.data || []);
      if (!productId) setProducts(prodRes.data || []);
    } catch {
      setError('Failed to load price lists');
    } finally {
      setLoading(false);
    }
  }

  async function addPriceList(e) {
    e.preventDefault();
    const targetProduct = productId || newProductId;
    if (!targetProduct) return setError('Product is required');
    if (!newPrice || Number(newPrice) < 0) return setError('Valid price is required');
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/price-lists', {
        product: targetProduct,
        tier: newTier,
        currency: newCurrency,
        price: Number(newPrice)
      });
      // Backend might not populate product in POST response, so let's reload to get populated data
      await load();
      setNewPrice('');
      setNewProductId('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add price rule');
    } finally {
      setSaving(false);
    }
  }

  async function removePriceList(pl) {
    if (!window.confirm(`Delete ${pl.tier} price rule?`)) return;
    try {
      await api.delete(`/price-lists/${pl._id}`);
      setPriceLists((prev) => prev.filter((p) => p._id !== pl._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete price rule');
    }
  }

  async function toggleActive(pl) {
    try {
      const { data } = await api.put(`/price-lists/${pl._id}`, { active: !pl.active });
      setPriceLists((prev) => prev.map((p) => (p._id === pl._id ? { ...p, active: data.active } : p)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Tags size={14} className="text-brand-600" />
            Tiered Price Lists
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Configure custom pricing overrides by customer tier and currency.
          </p>
        </div>
      </div>

      {loading && <div className="text-xs text-slate-400 py-3">Loading price lists…</div>}

      {!loading && (
        <div className="space-y-4">
          {priceLists.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    {!productId && <th className="text-left px-3 py-2">Product</th>}
                    <th className="text-left px-3 py-2">Tier</th>
                    <th className="text-left px-3 py-2">Currency</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-center px-3 py-2">Status</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {priceLists.map((pl) => (
                    <tr key={pl._id} className="hover:bg-slate-50/50">
                      {!productId && (
                        <td className="px-3 py-2 text-slate-700">
                          {pl.product?.name || 'Unknown Product'}
                        </td>
                      )}
                      <td className="px-3 py-2 font-semibold text-slate-800">{pl.tier}</td>
                      <td className="px-3 py-2 text-slate-500">{pl.currency}</td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-900">
                        {CURRENCY_SYMBOLS[pl.currency] || ''}{pl.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                          pl.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {pl.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleActive(pl)}
                            className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                            title={pl.active ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePriceList(pl)}
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
              No price overrides configured. Base price will be used.
            </div>
          )}

          <form onSubmit={addPriceList} className="flex flex-wrap sm:flex-nowrap gap-2 pt-2 border-t border-slate-100">
            {!productId && (
              <select
                className="input text-xs w-full sm:w-auto"
                value={newProductId}
                onChange={(e) => setNewProductId(e.target.value)}
              >
                <option value="">Select Product...</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            )}
            <select
              className="input text-xs w-full sm:w-auto"
              value={newTier}
              onChange={(e) => setNewTier(e.target.value)}
            >
              {TIERS.map(t => <option key={t} value={t}>{t} Tier</option>)}
            </select>
            <select
              className="input text-xs w-full sm:w-auto"
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input text-xs flex-1"
              placeholder="Custom price value..."
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <button type="submit" disabled={saving} className="btn btn-primary text-xs flex items-center gap-1.5 w-full sm:w-auto justify-center">
              <Plus size={13} /> {saving ? 'Adding...' : 'Add Rule'}
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
