import React from 'react';

const STYLES = {
  draft: 'bg-slate-100 text-slate-600',
  pending_approval: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  sent: 'bg-sky-100 text-sky-700',
  under_negotiation: 'bg-purple-100 text-purple-700',
  confirmed: 'bg-emerald-600 text-white',
  rejected: 'bg-red-100 text-red-700'
};

export default function StageBadge({ stage }) {
  const label = (stage || '').replace('_', ' ');
  return <span className={`badge ${STYLES[stage] || 'bg-slate-100 text-slate-600'} capitalize`}>{label}</span>;
}
