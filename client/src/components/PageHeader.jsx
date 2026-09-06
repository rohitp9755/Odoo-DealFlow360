import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
  backTo,
  backLabel,
  actions,
  badge
}) {
  return (
    <div className="mb-6 pb-4 border-b-2 border-slate-900">
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors mb-2 group"
        >
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
          {backLabel || 'Back'}
        </Link>
      )}

      {breadcrumb && !backTo && (
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          {breadcrumb}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase text-slate-900">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-sm font-medium text-slate-600 mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
