import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Users, UserPlus } from 'lucide-react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';

const TIERS = [
  { value: '', label: 'All customer tiers' },
  { value: 'Bronze', label: 'Bronze' },
  { value: 'Silver', label: 'Silver' },
  { value: 'Gold', label: 'Gold' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active accounts' },
  { value: 'inactive', label: 'Inactive accounts' },
  { value: 'all', label: 'All account statuses' }
];

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

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    setError('');
    api.get('/customers')
      .then((r) => setCustomers(r.data || []))
      .catch(() => setError('Failed to load customer accounts'))
      .finally(() => setLoading(false));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (tierFilter && c.tier !== tierFilter) return false;
      if (q) {
        const haystack = [c.name, c.email, c.phone, c.assignedRep?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [customers, search, tierFilter, statusFilter]);

  const analyticsData = useMemo(() => {
    if (!filtered.length) return { tierData: [], statusData: [] };
    
    const tiers = {};
    const statuses = {};
    
    filtered.forEach(c => {
      const t = c.tier || 'Unassigned';
      tiers[t] = (tiers[t] || 0) + 1;
      
      const s = c.status || 'inactive';
      statuses[s] = (statuses[s] || 0) + 1;
    });

    const tierData = Object.entries(tiers).map(([k, v]) => ({ name: k, count: v }));
    const statusData = Object.entries(statuses).map(([k, v]) => ({ name: k, count: v }));

    return { tierData, statusData };
  }, [filtered]);

  async function remove(c) {
    if (!window.confirm(`Delete "${c.name}"? This only works if the customer has no quotes.`)) return;
    try {
      await api.delete(`/customers/${c._id}`);
      setCustomers((prev) => prev.filter((x) => x._id !== c._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  }

  const columns = [
    {
      header: 'Customer Account',
      key: 'name',
      render: (c) => (
        <div>
          <div className="font-semibold text-slate-900">{c.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{c.email || 'No email registered'}</div>
        </div>
      )
    },
    {
      header: 'Discount Tier',
      key: 'tier',
      align: 'center',
      render: (c) => <StatusBadge status={c.tier?.toLowerCase()} />
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (c) => (
        <span className="text-xs text-slate-600 font-mono">
          {c.phone || '—'}
        </span>
      )
    },
    {
      header: 'Assigned Sales Rep',
      key: 'assignedRep',
      render: (c) => (
        <span className="text-xs font-medium text-slate-700">
          {c.assignedRep?.name || <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      align: 'center',
      render: (c) => <StatusBadge status={c.status} size="xs" />
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (c) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {canEdit && (
            <button
              onClick={() => navigate(`/customers/${c._id}/edit`)}
              className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
              title="Edit Account"
              aria-label={`Edit ${c.name}`}
            >
              <Pencil size={14} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => remove(c)}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Account"
              aria-label={`Delete ${c.name}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <Layout>
      <PageHeader
        title="Customers"
        subtitle="Manage client organizations, contract tiers, and territory sales representative assignments."
        breadcrumb="Workspace"
        actions={
          canEdit && (
            <button
              onClick={() => navigate('/customers/new')}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus size={15} /> New Customer
            </button>
          )
        }
      />

      {/* Analytics Summary */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Tier Distribution</h3>
            <div className="h-32 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analyticsData.tierData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2}>
                    {analyticsData.tierData.map((entry, index) => {
                      const colors = { Bronze: '#cd7f32', Silver: '#94a3b8', Gold: '#fbbf24', Unassigned: '#cbd5e1' };
                      return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#cbd5e1'} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Status Breakdown</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.statusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {analyticsData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'active' ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className="input !pl-9 text-xs"
            placeholder="Search by customer, email, or rep…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input w-auto text-xs py-1.5"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            className="input w-auto text-xs py-1.5"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {(search || tierFilter || statusFilter !== 'active') && (
            <button
              onClick={() => {
                setSearch('');
                setTierFilter('');
                setStatusFilter('active');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Customers Data Table */}
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No customers found"
        emptyDescription={
          search || tierFilter
            ? 'No customer accounts match your current filters.'
            : 'Get started by creating your first client organization.'
        }
        emptyAction={
          canEdit && (
            <button onClick={() => navigate('/customers/new')} className="btn btn-primary text-xs">
              Add Customer
            </button>
          )
        }
        onRowClick={(c) => navigate(`/customers/${c._id}`)}
      />
    </Layout>
  );
}
