import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';

export default function ApprovalDashboard() {
  const [approvals, setApprovals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  async function load() {
    const { data } = await api.get('/approvals');
    setApprovals(data);
  }
  useEffect(() => { load(); }, []);

  async function act(action) {
    await api.post(`/approvals/${selected._id}/${action}`, { comment });
    setSelected(null);
    setComment('');
    load();
  }

  // Approval.steps.role uses its own vocabulary ('manager' | 'finance' | 'escalation'),
  // separate from the User role enum — translate at this boundary only.
  const STEP_ROLE_BY_USER_ROLE = { SALES_MANAGER: 'manager', FINANCE: 'finance' };
  const myStepPending = (a) => a.steps.find((s) => s.role === STEP_ROLE_BY_USER_ROLE[user.role] && s.status === 'pending');

  return (
    <Layout>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Approval Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Discount</th>
                <th className="text-left px-4 py-3">Risk</th>
                <th className="text-left px-4 py-3">Money at Risk</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => (
                <tr key={a._id} onClick={() => setSelected(a)} className={`border-t border-slate-100 cursor-pointer hover:bg-slate-50 ${selected?._id === a._id ? 'bg-brand-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{a.quote?.customer?.name}</td>
                  <td className="px-4 py-3">{a.requestedDiscount}%</td>
                  <td className="px-4 py-3"><RiskBadge band={a.riskBand} /></td>
                  <td className="px-4 py-3">₹{a.marginLeakage?.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 capitalize">{a.status}</td>
                </tr>
              ))}
              {approvals.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No approvals to review.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-4">
          {!selected ? (
            <div className="text-sm text-slate-400">Select an approval to review its explanation and audit trail.</div>
          ) : (
            <div>
              <div className="font-semibold text-sm mb-2">{selected.quote?.customer?.name}</div>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 mb-3">
                {selected.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
              <div className="text-xs text-slate-500 mb-3">
                Steps: {selected.steps.map((s) => `${s.role} (${s.status})`).join(', ')}
              </div>
              {myStepPending(selected) && selected.status === 'pending' ? (
                <>
                  <textarea className="input mb-2" placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => act('approve')} className="btn btn-primary text-xs flex items-center gap-1"><CheckCircle2 size={14} /> Approve</button>
                    <button onClick={() => act('reject')} className="btn btn-danger text-xs flex items-center gap-1"><XCircle size={14} /> Reject</button>
                    <button onClick={() => act('return')} className="btn btn-secondary text-xs flex items-center gap-1"><RotateCcw size={14} /> Return</button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">No pending action for your role on this approval.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
