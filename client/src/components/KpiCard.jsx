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
    default: 'bg-slate-900 text-white',
    warning: 'bg-amber-500 text-slate-900',
    danger: 'bg-rose-500 text-white',
    success: 'bg-emerald-500 text-white'
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
      className={`card p-4 transition-all duration-200 ${
        isClickable
          ? 'cursor-pointer hover:bg-slate-50'
          : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
          {label}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-none border-2 border-slate-900 flex items-center justify-center shrink-0 ${iconStyles}`}>
            <Icon size={16} strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className={`text-2xl font-black tracking-tighter mb-1 ${variantStyles}`}>
        {value}
      </div>
      {context && (
        <div className="text-[11px] text-slate-600 font-bold uppercase tracking-wide">
          {context}
        </div>
      )}
    </div>
  );
}
