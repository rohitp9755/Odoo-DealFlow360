import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const TIERS = ['Bronze', 'Silver', 'Gold'];
const TIER_STYLES = {
  Gold: 'bg-amber-100 text-amber-700',
  Silver: 'bg-slate-200 text-slate-700',
  Bronze: 'bg-orange-100 text-orange-700'
};

export default function CustomerListPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'SALES_REP'].includes(user?.role);
  const canDelete = user?.role === 'ADMIN';

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    setError('');
    api.get('/customers')
      .then((r) => setCustomers(r.data))
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false));
  }

  // Search + filters run client-side: the customer list is small enough that a
  // round-trip per keystroke isn't worth it, and it keeps this in sync with the
  // same searchable pattern used by CustomerPicker on the quote form.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (tierFilter && c.tier !== tierFilter) return false;
      if (q) {
        const haystack = [c.name, c.email, c.phone, c.assignedRep?.name].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [customers, search, tierFilter, statusFilter]);

  async function remove(c) {
    if (!window.confirm(`Delete "${c.name}"? This only works if the customer has no quotes.`)) return;
    try {
      await api.delete(`/customers/${c._id}`);
      setCustomers((prev) => prev.filter((x) => x._id !== c._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Customers</h1>
          <p className="text-sm text-slate-500">Manage customer accounts, tiers, and territory assignments</p>
        </div>
        {canEdit && (
          <button onClick={() => navigate('/customers/new')} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={16} /> New Customer
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-8"
            placeholder="Search by name, email, phone, rep…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value="">All tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All statuses</option>
        </select>
      </div>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Tier</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Assigned Rep</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No customers match your filters.</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c._id} onClick={() => navigate(`/customers/${c._id}`)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${TIER_STYLES[c.tier] || 'bg-slate-100 text-slate-600'}`}>{c.tier}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{c.email || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{c.assignedRep?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                      <button onClick={() => navigate(`/customers/${c._id}/edit`)} className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100" title="Edit">
                        <Pencil size={15} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => remove(c)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
