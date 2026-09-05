import React from 'react';

export default function KpiCard({
  label,
  value,
  context,
  icon: Icon,
  variant = 'default', // 'default' | 'warning' | 'danger' | 'success'
  loading = false,
  onClick
}) {
  const variantStyles = {
    default: 'text-slate-900',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    success: 'text-emerald-600'
  }[variant];

  const iconStyles = {
    default: 'bg-slate-100 text-slate-600',
    warning: 'bg-amber-50 text-amber-600 border border-amber-200/50',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200/50',
    success: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
  }[variant];

  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="w-7 h-7 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-6 w-24 bg-slate-200 rounded mb-1.5" />
        <div className="h-3 w-16 bg-slate-100 rounded" />
      </div>
    );
  }

  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`card p-4 transition-all duration-150 ${
        isClickable
          ? 'cursor-pointer hover:border-slate-300 hover:shadow-subtle active:bg-slate-50/50'
          : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
          {label}
        </span>
        {Icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconStyles}`}>
            <Icon size={15} />
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold tracking-tight mb-1 ${variantStyles}`}>
        {value}
      </div>
      {context && (
        <div className="text-xs text-slate-500 font-normal">
          {context}
        </div>
      )}
    </div>
  );
}
