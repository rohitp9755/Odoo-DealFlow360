import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FilePlus2,
  Mail,
  Phone,
  User as UserIcon,
  MapPin,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import RiskBadge from '../components/RiskBadge';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';

function formatAddress(a) {
  if (!a) return null;
  const parts = [a.street, a.city, a.state, a.postalCode, a.country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'SALES_REP'].includes(user?.role);
  const canDelete = user?.role === 'ADMIN';

  const [customer, setCustomer] = useState(null);
  const [tierDiscounts, setTierDiscounts] = useState({});
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get(`/customers/${id}`),
      api.get('/discount-rules/tiers').catch(() => ({ data: [] })),
      api.get('/quotes').catch(() => ({ data: [] }))
    ])
      .then(([c, tiers, q]) => {
        setCustomer(c.data);
        setTierDiscounts(
          Object.fromEntries((tiers.data || []).map((row) => [row.tier, row.autonomousDiscount]))
        );
        const related = (q.data || []).filter(
          (quote) => String(quote.customer?._id || quote.customer) === id
        );
        setQuotes(related);
      })
      .catch(() => setError('Failed to load customer record.'))
      .finally(() => setLoading(false));
  }, [id]);

  const autonomousDiscount = useMemo(
    () => (customer ? tierDiscounts[customer.tier] : undefined),
    [customer, tierDiscounts]
  );

  const analyticsData = useMemo(() => {
    if (!quotes.length) return { revenueTrend: [], pipeline: [] };

    const stages = {};
    quotes.forEach(q => {
      stages[q.stage] = (stages[q.stage] || 0) + 1;
    });
    const pipeline = Object.entries(stages).map(([k, v]) => ({ name: k.replace(/_/g, ' '), count: v }));

    const confirmed = quotes.filter(q => q.stage === 'confirmed').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const revenueTrend = confirmed.map(q => ({
      date: new Date(q.createdAt).toLocaleDateString(),
      value: q.total
    }));

    return { pipeline, revenueTrend };
  }, [quotes]);

  async function removeCustomer() {
    if (!window.confirm(`Delete "${customer.name}"? This only works if the customer has no quotes.`)) return;
    try {
      await api.delete(`/customers/${id}`);
      navigate('/customers');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer.');
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="p-12 text-center text-xs text-slate-400">Loading customer profile…</div>
      </Layout>
    );
  }

  if (error || !customer) {
    return (
      <Layout>
        <PageHeader title="Customer Account" backTo="/customers" backLabel="Back to Customers" />
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error || 'Customer not found.'}
        </div>
      </Layout>
    );
  }

  const billing = formatAddress(customer.billingAddress);
  const shipping = customer.shippingSameAsBilling ? billing : formatAddress(customer.shippingAddress);

  const quoteColumns = [
    {
      header: 'Quote ID',
      key: '_id',
      render: (q) => (
        <span className="font-semibold text-slate-900 font-mono text-xs">
          #{q._id.slice(-6)}
        </span>
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
      key: 'discountAmount',
      align: 'center',
      render: (q) => {
        const pct = q.subtotal > 0 ? Math.round((q.discountAmount / q.subtotal) * 100) : 0;
        return <span className="tabular-nums font-medium text-slate-700">{pct}%</span>;
      }
    },
    {
      header: 'Margin',
      key: 'marginPercent',
      align: 'center',
      render: (q) => (
        <span className="tabular-nums text-slate-700">
          {q.marginPercent ? `${q.marginPercent.toFixed(1)}%` : '—'}
        </span>
      )
    },
    {
      header: 'Risk',
      key: 'riskBand',
      align: 'center',
      render: (q) => <RiskBadge band={q.riskBand} />
    },
    {
      header: 'Stage',
      key: 'stage',
      align: 'center',
      render: (q) => <StatusBadge status={q.stage} size="xs" />
    }
  ];

  return (
    <Layout>
      <PageHeader
        title={customer.name}
        subtitle="Corporate account profile, contract terms, and historical sales transactions."
        backTo="/customers"
        backLabel="Back to Customers"
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge status={customer.tier.toLowerCase()} />
            <StatusBadge status={customer.status} size="xs" />
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => navigate(`/quotes/new?customer=${customer._id}`)}
                className="btn btn-primary text-xs flex items-center gap-1.5"
              >
                <FilePlus2 size={14} /> New Quote
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => navigate(`/customers/${id}/edit`)}
                className="btn btn-outline text-xs flex items-center gap-1.5"
              >
                <Pencil size={13} /> Edit Account
              </button>
            )}
            {canDelete && (
              <button
                onClick={removeCustomer}
                className="btn btn-danger text-xs flex items-center gap-1.5"
                title="Delete Customer"
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Proposals & Quotations History */}
        <div className="lg:col-span-8 space-y-5">
          {/* Analytics Summary */}
          {!loading && quotes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div className="card p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Historical Revenue</h3>
                <div className="h-40">
                  {analyticsData.revenueTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.revenueTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} width={50} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5, fill: '#10b981', stroke: '#09090b', strokeWidth: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No confirmed revenue yet</div>
                  )}
                </div>
              </div>
              <div className="card p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Deal Pipeline</h3>
                <div className="h-40 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.pipeline} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2}>
                        {analyticsData.pipeline.map((entry, index) => {
                          const colors = { draft: '#94a3b8', 'pending approval': '#f59e0b', approved: '#10b981', sent: '#3b82f6', 'in negotiation': '#8b5cf6', 'under negotiation': '#8b5cf6', confirmed: '#059669', rejected: '#f43f5e' };
                          return <Cell key={`cell-${index}`} fill={colors[entry.name.toLowerCase()] || '#cbd5e1'} />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Deal Proposals ({quotes.length})
            </h2>
            {canEdit && (
              <Link
                to={`/quotes/new?customer=${customer._id}`}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                + Create new quote for {customer.name}
              </Link>
            )}
          </div>

          <DataTable
            columns={quoteColumns}
            data={quotes}
            loading={false}
            emptyTitle="No quotes on file"
            emptyDescription="There are no active or historical proposals for this customer account."
            emptyAction={
              canEdit && (
                <button
                  onClick={() => navigate(`/quotes/new?customer=${customer._id}`)}
                  className="btn btn-primary text-xs"
                >
                  Create Quotation
                </button>
              )
            }
            onRowClick={(q) => navigate(`/quotes/${q._id}`)}
          />
        </div>

        {/* Right Column: Account Specifications & Addresses */}
        <div className="lg:col-span-4 space-y-5">
          {/* Account Details */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Account Overview
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Autonomous Limit:</span>
                <span className="font-semibold text-brand-700">
                  {autonomousDiscount !== undefined ? `${autonomousDiscount}%` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Assigned Rep:</span>
                <span className="font-semibold text-slate-800">
                  {customer.assignedRep?.name || 'Unassigned'}
                </span>
              </div>

              {customer.repHistoricalAvgDiscount > 0 && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Rep Historical Avg:</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {customer.repHistoricalAvgDiscount}%
                  </span>
                </div>
              )}

              <div className="space-y-2 pt-1">
                {customer.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <a href={`mailto:${customer.email}`} className="hover:underline truncate">
                      {customer.email}
                    </a>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span className="font-mono">{customer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin size={14} className="text-brand-600" />
              Locations & Shipping
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
                  Billing Address
                </span>
                <div className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {billing || <span className="text-slate-400 italic">No billing address specified</span>}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">
                  Shipping Address
                </span>
                <div className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {customer.shippingSameAsBilling ? (
                    <span className="text-slate-500 italic">Same as billing address</span>
                  ) : (
                    shipping || <span className="text-slate-400 italic">No shipping address specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
