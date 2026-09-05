import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  ShieldAlert,
  Handshake,
  Wallet,
  ArrowUpRight,
  Clock,
  Sparkles,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const HEALTH_COLORS = {
  Healthy: '#10b981',
  Watch: '#0284c7',
  'At Risk': '#f59e0b',
  Critical: '#ef4444'
};

const DEFAULT_HEALTH_COLORS = ['#10b981', '#0284c7', '#f59e0b', '#ef4444'];

function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-popover border border-slate-800">
        <div className="font-semibold text-slate-300 mb-0.5">{label}</div>
        <div className="text-white font-bold">
          {prefix}
          {typeof payload[0].value === 'number'
            ? payload[0].value.toLocaleString('en-IN')
            : payload[0].value}
          {suffix}
        </div>
      </div>
    );
  }
  return null;
}

export default function ExecutiveDashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [sumRes, anaRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/analytics')
      ]);
      setSummary(sumRes.data);
      setAnalytics(anaRes.data);
    } catch (err) {
      setError('Failed to load dashboard metrics. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (error) {
    return (
      <Layout>
        <PageHeader
          title="Sales Operations Dashboard"
          subtitle="Real-time deal pipeline, risk monitoring, and executive analytics"
        />
        <ErrorState message={error} onRetry={loadData} />
      </Layout>
    );
  }

  const marginPct =
    summary?.revenue > 0 && summary?.margin
      ? ((summary.margin / summary.revenue) * 100).toFixed(1)
      : null;

  return (
    <Layout>
      <PageHeader
        title="Executive Dashboard"
        subtitle="Operational command center: pipeline velocity, risk governance, and revenue integrity."
        breadcrumb="Operations"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="btn btn-outline text-xs flex items-center gap-1.5"
              title="Refresh data"
            >
              <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/quotes/new')}
              className="btn btn-primary text-xs flex items-center gap-1"
            >
              <span>+</span> New Quote
            </button>
          </div>
        }
      />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
        <KpiCard
          label="Confirmed Revenue"
          value={loading ? '-' : `₹${(summary?.revenue || 0).toLocaleString('en-IN')}`}
          context={marginPct ? `${marginPct}% overall margin` : 'Booked deals'}
          icon={Wallet}
          variant="default"
          loading={loading}
        />
        <KpiCard
          label="Active Deals"
          value={loading ? '-' : summary?.activeDeals ?? 0}
          context="In quote/approval pipeline"
          icon={TrendingUp}
          variant="default"
          loading={loading}
          onClick={() => navigate('/quotes')}
        />
        <KpiCard
          label="Pending Approvals"
          value={loading ? '-' : summary?.pendingApprovals ?? 0}
          context="Requiring sign-off"
          icon={ShieldAlert}
          variant={(summary?.pendingApprovals ?? 0) > 0 ? 'warning' : 'default'}
          loading={loading}
          onClick={() => navigate('/approvals')}
        />
        <KpiCard
          label="Deals at Risk"
          value={loading ? '-' : summary?.dealsAtRisk ?? 0}
          context="Health alerts raised"
          icon={AlertTriangle}
          variant={(summary?.dealsAtRisk ?? 0) > 0 ? 'danger' : 'default'}
          loading={loading}
        />
        <KpiCard
          label="Negotiations"
          value={loading ? '-' : summary?.negotiations ?? 0}
          context="Customer counter-offers"
          icon={Handshake}
          variant="default"
          loading={loading}
        />
        <KpiCard
          label="Total Deals"
          value={loading ? '-' : summary?.totalDeals ?? 0}
          context="Lifetime transaction volume"
          icon={Clock}
          variant="default"
          loading={loading}
        />
      </div>

      {/* Primary Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Revenue Velocity */}
        <div className="lg:col-span-8 card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Revenue Velocity</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily confirmed deal volume over time
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            {loading ? (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />
            ) : !analytics?.revenueTrend || analytics.revenueTrend.length === 0 ? (
              <EmptyState
                title="No confirmed revenue yet"
                description="Revenue trend will chart here as quotes are confirmed."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip prefix="₹" />} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#1e3fd1"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#1e3fd1', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Deal Health Distribution */}
        <div className="lg:col-span-4 card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Deal Health Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated anomaly scoring across active deals
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center my-2">
            {loading ? (
              <div className="w-32 h-32 rounded-full bg-slate-100 animate-pulse" />
            ) : !analytics?.dealHealthDist || analytics.dealHealthDist.length === 0 ? (
              <div className="text-xs text-slate-400 text-center">
                No deal health records evaluated yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.dealHealthDist}
                    dataKey="count"
                    nameKey="_id"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {analytics.dealHealthDist.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={
                          HEALTH_COLORS[entry._id] ||
                          DEFAULT_HEALTH_COLORS[idx % DEFAULT_HEALTH_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip suffix=" deals" />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            {analytics?.dealHealthDist?.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      HEALTH_COLORS[d._id] ||
                      DEFAULT_HEALTH_COLORS[i % DEFAULT_HEALTH_COLORS.length]
                  }}
                />
                <span className="text-slate-600 truncate">{d._id}:</span>
                <span className="font-semibold text-slate-900">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Deal Pipeline by Stage */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Pipeline by Stage</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Number of deals currently in each lifecycle phase
              </p>
            </div>
          </div>

          <div className="h-56 w-full">
            {loading ? (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />
            ) : !analytics?.pipeline || analytics.pipeline.length === 0 ? (
              <EmptyState title="No active pipeline" description="No quotes currently in progress." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.pipeline} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={(s) => (s || '').replace(/_/g, ' ')}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        suffix=" deals"
                        prefix=""
                      />
                    }
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Margin Trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Margin Integrity Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Average deal margin (%) realized on confirmed transactions
              </p>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
              Min target: 15%
            </span>
          </div>

          <div className="h-56 w-full">
            {loading ? (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />
            ) : !analytics?.marginTrend || analytics.marginTrend.length === 0 ? (
              <EmptyState
                title="No margin data available"
                description="Margin trends calculate automatically as transactions are finalized."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.marginTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${Math.round(v)}%`}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                  <Line
                    type="monotone"
                    dataKey="avgMargin"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
