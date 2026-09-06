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
import { useSocket } from '../context/SocketContext';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import RealtimeConnectionStatus from '../components/RealtimeConnectionStatus';
import LiveActivityFeed from '../components/LiveActivityFeed';

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
      <div className="bg-white text-slate-900 text-xs px-3 py-2 rounded-none border-2 border-slate-900 shadow-brutal">
        <div className="font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</div>
        <div className="text-slate-900 font-black">
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
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { socket } = useSocket();

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

  useEffect(() => {
    if (!socket) return;
    
    let debounceTimer;
    
    const handleEvent = (payload) => {
      const { event, timestamp, data } = payload;
      
      let title = 'System Event';
      let description = '';
      
      if (event === 'quotation.created') {
        title = 'New quotation created';
        description = `${data.customer?.name || 'Customer'} · ₹${(data.total || 0).toLocaleString('en-IN')}`;
      } else if (event === 'quotation.approved') {
        title = 'Quotation approved';
      } else if (event === 'quotation.submitted') {
        title = 'Quotation submitted for approval';
      } else if (event === 'negotiation.created') {
        title = 'Customer negotiation';
        description = 'Customer requested a change';
      } else if (event === 'payment.received') {
        title = 'Payment received';
        description = `₹${(data.amount || 0).toLocaleString('en-IN')}`;
      } else if (event === 'dealHealth.statusChanged') {
        title = `Health alert: ${data.status}`;
      } else if (event === 'fulfillment.created') {
        title = 'Warehouse allocation completed';
      } else if (event === 'invoice.created') {
        title = 'Invoice generated';
      }
      
      setActivities(prev => [{ id: Math.random().toString(), timestamp, title, description, event }, ...prev].slice(0, 30));
      
      if (event === 'quotation.created') {
        setSummary(prev => prev ? { ...prev, totalDeals: (prev.totalDeals || 0) + 1, activeDeals: (prev.activeDeals || 0) + 1 } : prev);
      } else if (event === 'quotation.submitted') {
        setSummary(prev => prev ? { ...prev, pendingApprovals: (prev.pendingApprovals || 0) + 1 } : prev);
      } else if (event === 'approval.approved' || event === 'approval.rejected') {
        setSummary(prev => prev ? { ...prev, pendingApprovals: Math.max(0, (prev.pendingApprovals || 0) - 1) } : prev);
      }
      
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        api.get('/dashboard/summary').then(res => setSummary(res.data)).catch(console.error);
        api.get('/dashboard/analytics').then(res => setAnalytics(res.data)).catch(console.error);
      }, 1500);
    };

    socket.on('realtime_event', handleEvent);
    return () => {
      socket.off('realtime_event', handleEvent);
      clearTimeout(debounceTimer);
    };
  }, [socket]);

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
          <div className="flex items-center gap-3">
            <RealtimeConnectionStatus />
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Revenue Velocity</h2>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 mt-1 uppercase">
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
                    stroke="#3b5fdf"
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    activeDot={{ r: 5, fill: '#3b5fdf', stroke: '#09090b', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Deal Health Distribution */}
        <div className="lg:col-span-4 card p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Deal Health Status</h2>
            <p className="text-[10px] font-bold tracking-widest text-slate-500 mt-1 uppercase">
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        {/* Live Activity Feed */}
        <div className="xl:col-span-1">
          <LiveActivityFeed activities={activities} />
        </div>

        {/* Deal Pipeline by Stage */}
        <div className="card p-5 xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Pipeline by Stage</h2>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 mt-1 uppercase">
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
                  <Bar dataKey="count" fill="#3b5fdf" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Margin Trend */}
        <div className="card p-5 xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Margin Integrity Trend</h2>
              <p className="text-[10px] font-bold tracking-widest text-slate-500 mt-1 uppercase">
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
                    strokeWidth={3}
                    dot={{ r: 0 }}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#09090b', strokeWidth: 2 }}
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
