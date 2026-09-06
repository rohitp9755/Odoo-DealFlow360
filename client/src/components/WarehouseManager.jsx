import React, { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function WarehouseManager() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newShippingCost, setNewShippingCost] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const { data } = await api.get('/admin/warehouses');
      setWarehouses(data || []);
    } catch {
      setError('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }

  async function addWarehouse(e) {
    e.preventDefault();
    if (!newName || !newCode) return setError('Name and Code are required');
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/admin/warehouses', {
        name: newName,
        code: newCode,
        location: newLocation,
        shippingCostPerUnit: Number(newShippingCost) || 0
      });
      setWarehouses((prev) => [...prev, data]);
      setNewName('');
      setNewCode('');
      setNewLocation('');
      setNewShippingCost('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add warehouse');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-xs text-slate-400 py-3">Loading warehouses…</div>;

  return (
    <div className="card p-5 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={16} className="text-brand-600" />
            Facilities & Warehouses
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Manage distribution centers and shipping cost weights.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {warehouses.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Code</th>
                  <th className="text-left px-3 py-2">Location</th>
                  <th className="text-right px-3 py-2">Shipping Cost/Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warehouses.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-semibold text-slate-800">{w.name}</td>
                    <td className="px-3 py-2 text-slate-500">{w.code}</td>
                    <td className="px-3 py-2 text-slate-500">{w.location}</td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-900">
                      ₹{w.shippingCostPerUnit?.toLocaleString('en-IN') || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
            No warehouses configured.
          </div>
        )}

        <form onSubmit={addWarehouse} className="flex flex-wrap sm:flex-nowrap gap-2 pt-2 border-t border-slate-100 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Name</label>
            <input type="text" className="input text-xs w-full" placeholder="Main Depot" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="w-full sm:w-24">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Code</label>
            <input type="text" className="input text-xs w-full uppercase" placeholder="M-01" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} />
          </div>
          <div className="flex-[1.5] min-w-[150px]">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Location</label>
            <input type="text" className="input text-xs w-full" placeholder="Mumbai, IN" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
          </div>
          <div className="w-full sm:w-28">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Shipping (₹)</label>
            <input type="number" min="0" className="input text-xs w-full" placeholder="1000" value={newShippingCost} onChange={(e) => setNewShippingCost(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary text-xs flex items-center gap-1.5 h-[34px] px-3">
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
