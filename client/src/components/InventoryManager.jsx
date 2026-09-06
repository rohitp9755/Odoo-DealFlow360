import React, { useEffect, useState } from 'react';
import { PackageSearch, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function InventoryManager() {
  const [stocks, setStocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newWarehouse, setNewWarehouse] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [stockRes, whRes, prodRes] = await Promise.all([
        api.get('/admin/warehouse-stock'),
        api.get('/admin/warehouses'),
        api.get('/products')
      ]);
      setStocks(stockRes.data || []);
      setWarehouses(whRes.data || []);
      setProducts(prodRes.data || []);
    } catch {
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }

  async function setStock(e) {
    e.preventDefault();
    if (!newWarehouse || !newProduct || newQuantity === '') return setError('All fields are required');
    if (Number(newQuantity) < 0) return setError('Quantity cannot be negative');
    
    setError('');
    setSaving(true);
    try {
      const { data } = await api.put('/admin/warehouse-stock', {
        warehouse: newWarehouse,
        product: newProduct,
        quantity: Number(newQuantity)
      });
      
      const newStockRecord = {
        ...data,
        warehouse: warehouses.find(w => w._id === newWarehouse),
        product: products.find(p => p._id === newProduct)
      };

      setStocks(prev => {
        const existing = prev.findIndex(s => s.warehouse?._id === newWarehouse && s.product?._id === newProduct);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newStockRecord;
          return updated;
        }
        return [...prev, newStockRecord];
      });

      if (data.backordersConsolidated && data.backordersConsolidated.length > 0) {
        alert(`Stock updated! Consolidated ${data.backordersConsolidated.length} backordered lines automatically.`);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-xs text-slate-400 py-3">Loading inventory…</div>;

  return (
    <div className="card p-5 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <PackageSearch size={16} className="text-brand-600" />
            Inventory Levels
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Manage product availability across warehouses. Consolidates backorders automatically.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {stocks.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="text-left px-3 py-2">Warehouse</th>
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-right px-3 py-2">Available Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stocks.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-semibold text-slate-800">{s.warehouse?.name || 'Unknown'}</td>
                    <td className="px-3 py-2 text-slate-500">{s.product?.name || 'Unknown'}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-900">
                      {s.quantity?.toLocaleString('en-IN') || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No stock records.
          </div>
        )}

        <form onSubmit={setStock} className="flex flex-wrap sm:flex-nowrap gap-2 pt-2 border-t border-slate-100 items-end">
          <div className="flex-[2] min-w-[150px]">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Warehouse</label>
            <select className="input text-xs w-full" value={newWarehouse} onChange={(e) => setNewWarehouse(e.target.value)}>
              <option value="">Select...</option>
              {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>
          <div className="flex-[2] min-w-[150px]">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Product</label>
            <select className="input text-xs w-full" value={newProduct} onChange={(e) => setNewProduct(e.target.value)}>
              <option value="">Select...</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-28">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">New Qty</label>
            <input type="number" min="0" className="input text-xs w-full" placeholder="0" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary text-xs flex items-center gap-1.5 h-[34px] px-3 shrink-0">
            <Save size={13} /> {saving ? 'Saving...' : 'Set Stock'}
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
