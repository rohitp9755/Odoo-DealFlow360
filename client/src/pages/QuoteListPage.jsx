import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import StageBadge from '../components/StageBadge';
import RiskBadge from '../components/RiskBadge';

export default function QuoteListPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/quotes').then((res) => setQuotes(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Quotations</h1>
          <p className="text-sm text-slate-500">All quotes you're working on</p>
        </div>
        <button onClick={() => navigate('/quotes/new')} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={16} /> New Quote
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Discount</th>
              <th className="text-left px-4 py-3">Margin</th>
              <th className="text-left px-4 py-3">Risk</th>
              <th className="text-left px-4 py-3">Stage</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && quotes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No quotes yet. Create one to get started.</td></tr>
            )}
            {quotes.map((q) => (
              <tr key={q._id} onClick={() => navigate(`/quotes/${q._id}`)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-3 font-medium text-slate-800">{q.customer?.name}</td>
                <td className="px-4 py-3">₹{q.total?.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">{q.subtotal > 0 ? Math.round((q.discountAmount / q.subtotal) * 100) : 0}%</td>
                <td className="px-4 py-3">{q.marginPercent?.toFixed(1)}%</td>
                <td className="px-4 py-3"><RiskBadge band={q.riskBand} /></td>
                <td className="px-4 py-3"><StageBadge stage={q.stage} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
