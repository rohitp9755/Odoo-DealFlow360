import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function SubscriptionPlanManager() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newCycle, setNewCycle] = useState('monthly');
  const [newProration, setNewProration] = useState(true);
  const [newCancellation, setNewCancellation] = useState('prorated');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const { data } = await api.get('/admin/subscription-plans');
      setPlans(data || []);
    } catch {
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  }

  async function addPlan(e) {
    e.preventDefault();
    if (!newName.trim()) return setError('Plan name is required');
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/admin/subscription-plans', {
        name: newName,
        cycle: newCycle,
        prorationAllowed: newProration,
        cancellationRefundPolicy: newCancellation
      });
      setPlans((prev) => [...prev, data]);
      setNewName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add plan');
    } finally {
      setSaving(false);
    }
  }

  async function removePlan(plan) {
    if (!window.confirm(`Delete ${plan.name} plan?`)) return;
    try {
      await api.delete(`/admin/subscription-plans/${plan._id}`);
      setPlans((prev) => prev.filter((p) => p._id !== plan._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete plan');
    }
  }

  if (loading) return <div className="text-xs text-slate-400 py-3">Loading plans…</div>;

  return (
    <div className="card p-5 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={16} className="text-brand-600" />
            Subscription Plans
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Manage recurring billing intervals, proration, and cancellation rules.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {plans.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="text-left px-3 py-2">Plan Name</th>
                  <th className="text-left px-3 py-2">Cycle</th>
                  <th className="text-center px-3 py-2">Proration</th>
                  <th className="text-left px-3 py-2">Cancellation Policy</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-semibold text-slate-800">{p.name}</td>
                    <td className="px-3 py-2 text-slate-500 capitalize">{p.cycle}</td>
                    <td className="px-3 py-2 text-center text-slate-500">{p.prorationAllowed ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2 text-slate-500 capitalize">{p.cancellationRefundPolicy}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => removePlan(p)}
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
            No subscription plans configured.
          </div>
        )}

        <form onSubmit={addPlan} className="flex flex-wrap sm:flex-nowrap gap-2 pt-2 border-t border-slate-100 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Name</label>
            <input
              type="text"
              className="input text-xs w-full"
              placeholder="e.g. Premium Yearly"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Cycle</label>
            <select className="input text-xs w-full" value={newCycle} onChange={(e) => setNewCycle(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="w-full sm:w-32">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Proration</label>
            <select className="input text-xs w-full" value={newProration} onChange={(e) => setNewProration(e.target.value === 'true')}>
              <option value="true">Allowed</option>
              <option value="false">Not Allowed</option>
            </select>
          </div>
          <div className="w-full sm:w-32">
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">Refunds</label>
            <select className="input text-xs w-full" value={newCancellation} onChange={(e) => setNewCancellation(e.target.value)}>
              <option value="full">Full</option>
              <option value="prorated">Prorated</option>
              <option value="none">None</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary text-xs flex items-center gap-1.5 h-[34px] px-3">
            <Plus size={13} /> {saving ? 'Adding...' : 'Add Plan'}
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
