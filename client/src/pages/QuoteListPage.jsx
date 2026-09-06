import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw, Layers } from 'lucide-react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import DataTable from '../components/DataTable';

const STAGE_OPTIONS = [
  { value: 'all', label: 'All stages' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'under_negotiation', label: 'In Negotiation' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'rejected', label: 'Rejected' }
];

const RISK_OPTIONS = [
  { value: 'all', label: 'All risk levels' },
  { value: 'LOW', label: 'Low Risk' },
  { value: 'MEDIUM', label: 'Medium Risk' },
  { value: 'HIGH', label: 'High Risk' },
  { value: 'VERY_HIGH', label: 'Critical Risk' }
];

export default function QuoteListPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const navigate = useNavigate();

  async function loadQuotes() {
    setLoading(true);
    try {
      const res = await api.get('/quotes');
      setQuotes(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes();
  }, []);

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((item) => {
      if (stageFilter !== 'all' && item.stage !== stageFilter) return false;
      if (riskFilter !== 'all' && item.riskBand !== riskFilter) return false;
      if (q) {
        const customerName = (item.customer?.name || '').toLowerCase();
        if (!customerName.includes(q)) return false;
      }
      return true;
    });
  }, [quotes, search, stageFilter, riskFilter]);

  const analyticsData = useMemo(() => {
    if (!filteredQuotes.length) return { pipeline: [], riskData: [] };
    
    const stages = {};
    const risk = {};
    
    filteredQuotes.forEach(q => {
      stages[q.stage] = (stages[q.stage] || 0) + 1;
      risk[q.riskBand || 'UNKNOWN'] = (risk[q.riskBand || 'UNKNOWN'] || 0) + 1;
    });

    const pipeline = Object.entries(stages).map(([k, v]) => ({ name: k.replace(/_/g, ' '), count: v }));
    const riskData = Object.entries(risk).map(([k, v]) => ({ name: k, count: v }));

    return { pipeline, riskData };
  }, [filteredQuotes]);

  const columns = [
    {
      header: 'Customer',
      key: 'customer',
      render: (q) => (
        <div>
          <div className="font-semibold text-slate-900">{q.customer?.name || 'Unnamed Customer'}</div>
          <div className="text-xs text-slate-400 mt-0.5">{q.customer?.tier || 'Bronze'} tier</div>
        </div>
      )
    },
    {
      header: 'Total Value',
      key: 'total',
      align: 'right',
      render: (q) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          ₹{(q.total || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Discount',
      key: 'discount',
      align: 'center',
      render: (q) => {
        const pct = q.subtotal > 0 ? Math.round((q.discountAmount / q.subtotal) * 100) : 0;
        return (
          <span className={`text-xs font-medium tabular-nums ${pct > 15 ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
            {pct}%
          </span>
        );
      }
    },
    {
      header: 'Margin',
      key: 'margin',
      align: 'center',
      render: (q) => (
        <span className="text-xs font-medium text-slate-700 tabular-nums">
          {q.marginPercent ? `${q.marginPercent.toFixed(1)}%` : '0%'}
        </span>
      )
    },
    {
      header: 'Risk Level',
      key: 'riskBand',
      align: 'center',
      render: (q) => <RiskBadge band={q.riskBand} />
    },
    {
      header: 'Lifecycle Stage',
      key: 'stage',
      align: 'center',
      render: (q) => <StatusBadge status={q.stage} />
    },
    {
      header: 'Created',
      key: 'createdAt',
      align: 'right',
      render: (q) => (
        <span className="text-xs text-slate-400 tabular-nums">
          {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '-'}
        </span>
      )
    }
  ];

  return (
    <Layout>
      <PageHeader
        title="Quotations"
        subtitle="Manage deal proposals, track margin integrity, and monitor customer negotiations."
        breadcrumb="Workspace"
        actions={
          <button
            onClick={() => navigate('/quotes/new')}
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus size={15} /> New Quotation
          </button>
        }
      />

      {/* Analytics Summary */}
      {!loading && filteredQuotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Pipeline Volume</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.pipeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#3b5fdf" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Risk Distribution</h3>
            <div className="h-32 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analyticsData.riskData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2}>
                    {analyticsData.riskData.map((entry, index) => {
                      const colors = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f43f5e', VERY_HIGH: '#9f1239', UNKNOWN: '#cbd5e1' };
                      return <Cell key={`cell-${index}`} fill={colors[entry.name] || '#cbd5e1'} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className="input !pl-9 text-xs"
            placeholder="Search by customer name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input w-auto text-xs py-1.5"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="input w-auto text-xs py-1.5"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            {RISK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {(search || stageFilter !== 'all' || riskFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStageFilter('all');
                setRiskFilter('all');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Quotations Data Table */}
      <DataTable
        columns={columns}
        data={filteredQuotes}
        loading={loading}
        emptyTitle="No quotations found"
        emptyDescription={
          search || stageFilter !== 'all' || riskFilter !== 'all'
            ? 'No quotes match your active filters. Try resetting search criteria.'
            : 'Get started by creating your first sales quotation.'
        }
        emptyAction={
          <button
            onClick={() => navigate('/quotes/new')}
            className="btn btn-primary text-xs"
          >
            Create Quotation
          </button>
        }
        onRowClick={(q) => navigate(`/quotes/${q._id}`)}
      />
    </Layout>
  );
}
