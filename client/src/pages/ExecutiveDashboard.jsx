import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShieldAlert, Handshake, Wallet } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

const COLORS = ['#2b58f5', '#84a9ff', '#f59e0b', '#ef4444', '#10b981'];

export default function ExecutiveDashboard() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get('/dashboard/summary').then((res) => setSummary(res.data));
    api.get('/dashboard/analytics').then((res) => setAnalytics(res.data));
  }, []);

  if (!summary || !analytics) return <Layout><div className="text-slate-400">Loading…</div></Layout>;

  const kpis = [
    { label: 'Total Deals', value: summary.totalDeals, icon: Handshake },
    { label: 'Active Deals', value: summary.activeDeals, icon: TrendingUp },
    { label: 'Revenue', value: `₹${summary.revenue.toLocaleString('en-IN')}`, icon: Wallet },
    { label: 'Pending Approvals', value: summary.pendingApprovals, icon: ShieldAlert },
    { label: 'Deals At Risk', value: summary.dealsAtRisk, icon: ShieldAlert },
    { label: 'Negotiations', value: summary.negotiations, icon: Handshake }
  ];

  return (
    <Layout>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Executive Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4">
            <Icon size={16} className="text-brand-500 mb-2" />
            <div className="text-lg font-bold text-slate-800">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-4">
          <div className="font-semibold text-sm text-slate-700 mb-3">Revenue Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#2b58f5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <div className="font-semibold text-sm text-slate-700 mb-3">Deal Pipeline by Stage</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.pipeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2b58f5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <div className="font-semibold text-sm text-slate-700 mb-3">Deal Health Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={analytics.dealHealthDist} dataKey="count" nameKey="_id" outerRadius={80} label>
                {analytics.dealHealthDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <div className="font-semibold text-sm text-slate-700 mb-3">Margin Trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.marginTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgMargin" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
