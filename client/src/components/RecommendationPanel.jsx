import React from 'react';
import { Sparkles, Plus, X, CheckCircle2, PackageCheck, AlertCircle } from 'lucide-react';

export default function RecommendationPanel({ recommendations, onAdd, onDismiss, loading }) {
  if (loading) {
    return (
      <div className="p-6 rounded-xl bg-slate-50/60 border border-slate-200/80 text-center animate-pulse">
        <Sparkles size={18} className="text-brand-500 mx-auto mb-2 animate-spin" />
        <div className="text-xs font-medium text-slate-600">Analyzing customer purchase patterns…</div>
        <div className="text-[11px] text-slate-400 mt-1">Evaluating co-purchase probability, margins, and inventory availability</div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-slate-50/50 border border-dashed border-slate-200 text-center">
        <Sparkles size={18} className="text-slate-400 mx-auto mb-1.5" />
        <div className="text-xs font-semibold text-slate-700">No active recommendations</div>
        <div className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
          Add line items to this quotation and click Generate to evaluate smart up-sell and cross-sell bundles.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <div
          key={rec._id}
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-subtle hover:border-slate-300 transition-all duration-150"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm text-slate-900 truncate">
                  {rec.product?.name}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/50">
                  <Sparkles size={11} className="text-brand-600" />
                  {rec.score}% match
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-medium border ${
                    rec.inStock === false
                      ? 'bg-rose-50 text-rose-700 border-rose-200/50'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                  }`}
                >
                  {rec.inStock === false ? 'Backorder' : 'In stock'}
                </span>
              </div>

              <ul className="text-xs text-slate-500 space-y-0.5 my-1.5">
                {(rec.reasons || []).slice(0, 2).map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-2.5 flex items-center gap-4 text-xs">
                <div className="text-slate-600">
                  Revenue:{' '}
                  <b className="text-slate-900 font-semibold tabular-nums">
                    +₹{rec.expectedRevenue?.toLocaleString('en-IN')}
                  </b>
                </div>
                <div className="text-slate-600">
                  Margin:{' '}
                  <b className="text-emerald-700 font-semibold tabular-nums">
                    +₹{rec.expectedMargin?.toLocaleString('en-IN')}
                  </b>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
            {rec.status === 'added' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={15} /> Added to proposal
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAdd(rec)}
                  className="btn btn-primary text-xs py-1.5 flex items-center gap-1"
                >
                  <Plus size={13} /> Add to quote
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(rec)}
                  className="btn btn-ghost text-xs py-1.5 flex items-center gap-1"
                >
                  <X size={13} /> Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
