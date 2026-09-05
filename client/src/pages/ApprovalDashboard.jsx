import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, ShieldCheck, AlertTriangle, MessageSquare, ArrowRight, UserCheck } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

export default function ApprovalDashboard() {
  const [approvals, setApprovals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const { user } = useAuth();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/approvals');
      setApprovals(data || []);
      if (data && data.length > 0 && !selected) {
        setSelected(data[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(action) {
    if (!selected) return;
    setActionBusy(true);
    try {
      await api.post(`/approvals/${selected._id}/${action}`, { comment });
      setComment('');
      await load();
      setSelected(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit approval decision');
    } finally {
      setActionBusy(false);
    }
  }

  const STEP_ROLE_BY_USER_ROLE = {
    SALES_MANAGER: 'manager',
    FINANCE: 'finance',
    ADMIN: 'escalation'
  };

  const userStepRole = STEP_ROLE_BY_USER_ROLE[user?.role];
  const myStepPending = (a) =>
    a?.steps?.find((s) => s.role === userStepRole && s.status === 'pending');

  return (
    <Layout>
      <PageHeader
        title="Approval Governance"
        subtitle="Review discount exception requests, audit trail reasoning, and multi-tier escalation chains."
        breadcrumb="Governance"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approvals Table List */}
        <div className="lg:col-span-7 card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Pending & Past Approvals
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {approvals.length} records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-th">Customer</th>
                  <th className="table-th text-center">Discount</th>
                  <th className="table-th text-center">Risk</th>
                  <th className="table-th text-right">Margin Leakage</th>
                  <th className="table-th text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading && (
                  <tr>
                    <td colSpan={5} className="table-td text-center text-slate-400 py-8">
                      Loading approvals…
                    </td>
                  </tr>
                )}

                {!loading && approvals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8">
                      <EmptyState
                        title="No approval requests"
                        description="There are currently no proposals requiring sign-off."
                      />
                    </td>
                  </tr>
                )}

                {!loading &&
                  approvals.map((a) => {
                    const isSelected = selected?._id === a._id;
                    return (
                      <tr
                        key={a._id}
                        onClick={() => setSelected(a)}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isSelected ? 'bg-brand-50/60 font-medium' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="table-td">
                          <div className="font-semibold text-slate-900">
                            {a.quote?.customer?.name || 'Customer'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Quote #{a.quote?._id?.slice(-6) || a.quote?.slice?.(-6) || ''}
                          </div>
                        </td>
                        <td className="table-td text-center font-bold text-slate-800 tabular-nums">
                          {a.requestedDiscount}%
                        </td>
                        <td className="table-td text-center">
                          <RiskBadge band={a.riskBand} />
                        </td>
                        <td className="table-td text-right tabular-nums text-slate-700">
                          ₹{(a.marginLeakage || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="table-td text-center">
                          <StatusBadge status={a.status} size="xs" />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Approval Decision Inspector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-5 sticky top-20">
            {!selected ? (
              <EmptyState
                icon={ShieldCheck}
                title="Select an approval"
                description="Click any deal in the table to review risk reasoning, sign-off chain, and take action."
              />
            ) : (
              <div>
                <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selected.quote?.customer?.name}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Requested Discount: <b className="text-slate-900">{selected.requestedDiscount}%</b>
                    </div>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                {/* What / Why Reason Trail */}
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Governance Reason Trail
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selected.reasons?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Sign-off Chain */}
                <div className="mb-5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Required Sign-off Chain
                  </span>
                  <div className="space-y-2">
                    {selected.steps?.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 bg-white text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck size={15} className="text-slate-500" />
                          <span className="font-semibold text-slate-800 capitalize">
                            {step.role} Sign-off
                          </span>
                        </div>
                        <StatusBadge status={step.status} size="xs" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Box */}
                {myStepPending(selected) && selected.status === 'pending' ? (
                  <div className="pt-4 border-t border-slate-100">
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Decision Note (Optional)
                    </label>
                    <textarea
                      className="input text-xs mb-3 h-20 resize-none"
                      placeholder="Add an explanation or guidance for the sales rep…"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => act('approve')}
                        disabled={actionBusy}
                        className="btn btn-primary text-xs py-2 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => act('reject')}
                        disabled={actionBusy}
                        className="btn btn-danger text-xs py-2 flex items-center justify-center gap-1"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => act('return')}
                        disabled={actionBusy}
                        className="btn btn-outline text-xs py-2 flex items-center justify-center gap-1"
                      >
                        <RotateCcw size={14} /> Return
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-400 text-center">
                    {selected.status === 'pending'
                      ? 'Waiting for other roles in the approval chain to sign off.'
                      : `This approval request was ${selected.status}.`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
