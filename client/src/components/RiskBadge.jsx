import React from 'react';

const BANDS = {
  LOW: { label: 'Low Risk', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', dot: 'bg-emerald-500' },
  MEDIUM: { label: 'Medium Risk', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', dot: 'bg-amber-500' },
  HIGH: { label: 'High Risk', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200/60', dot: 'bg-orange-500' },
  VERY_HIGH: { label: 'Critical Risk', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/60', dot: 'bg-rose-500' }
};

export default function RiskBadge({ band }) {
  const b = BANDS[band] || BANDS.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-subtle ${b.bg} ${b.text} ${b.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.dot}`} />
      <span>{b.label}</span>
    </span>
  );
}
