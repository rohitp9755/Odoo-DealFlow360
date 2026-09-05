import React from 'react';

const STATUS_CONFIGS = {
  // Quote Stages
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
  pending_approval: { label: 'Pending Approval', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200/60', dot: 'bg-amber-500' },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200/60', dot: 'bg-emerald-500' },
  sent: { label: 'Sent', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200/60', dot: 'bg-sky-500' },
  under_negotiation: { label: 'In Negotiation', bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200/60', dot: 'bg-indigo-500' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', dot: 'bg-white' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200/60', dot: 'bg-rose-500' },
  returned: { label: 'Returned', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200/60', dot: 'bg-orange-500' },

  // Generic / Lifecycle
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', dot: 'bg-emerald-500' },
  inactive: { label: 'Inactive', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },

  // Invoices & Payments
  issued: { label: 'Issued', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/60', dot: 'bg-sky-500' },
  paid: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', dot: 'bg-emerald-500' },
  partially_paid: { label: 'Partially Paid', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', dot: 'bg-amber-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/60', dot: 'bg-rose-400' },

  // Deal Health
  healthy: { label: 'Healthy', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', dot: 'bg-emerald-500' },
  watch: { label: 'Watch', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200/60', dot: 'bg-sky-500' },
  at_risk: { label: 'At Risk', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', dot: 'bg-amber-500' },
  'at risk': { label: 'At Risk', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', dot: 'bg-amber-500' },
  critical: { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/60', dot: 'bg-rose-500' },

  // Approval step statuses
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', dot: 'bg-amber-500' },

  // Tiers
  gold: { label: 'Gold Tier', bg: 'bg-amber-50 text-amber-800 border-amber-300/80', dot: 'bg-amber-500' },
  silver: { label: 'Silver Tier', bg: 'bg-slate-100 text-slate-700 border-slate-300/80', dot: 'bg-slate-400' },
  bronze: { label: 'Bronze Tier', bg: 'bg-orange-50 text-orange-800 border-orange-200/80', dot: 'bg-orange-500' }
};

export default function StatusBadge({ status, customLabel, size = 'sm', showDot = true }) {
  const key = String(status || '').toLowerCase().trim();
  const config = STATUS_CONFIGS[key] || {
    label: (status || 'Unknown').replace(/_/g, ' '),
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  const label = customLabel || config.label;

  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-[11px]'
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-subtle ${config.bg} ${config.text} ${config.border} ${sizeClasses} tracking-tight`}
    >
      {showDot && config.dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      )}
      <span className="capitalize">{label}</span>
    </span>
  );
}
