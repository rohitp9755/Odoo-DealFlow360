import React from 'react';
import { Sparkles, Plus, X, CheckCircle2 } from 'lucide-react';

export default function RecommendationPanel({ recommendations, onAdd, onDismiss, loading }) {
  if (loading) {
    return <div className="card p-4 text-sm text-slate-500">Analyzing purchase patterns…</div>;
  }
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="card p-4 text-sm text-slate-500 flex items-center gap-2">
        <Sparkles size={16} className="text-brand-500" /> No recommendations yet — add products and generate.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <div key={rec._id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-brand-500" />
                <span className="font-semibold text-sm text-slate-800">{rec.product?.name}</span>
                <span className="badge bg-brand-50 text-brand-700">{rec.score}% match</span>
              </div>
              <ul className="mt-1.5 text-xs text-slate-500 list-disc list-inside space-y-0.5">
                {(rec.reasons || []).slice(0, 2).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
              <div className="mt-2 flex gap-4 text-xs text-slate-600">
                <span>+ Revenue: <b>₹{rec.expectedRevenue?.toLocaleString('en-IN')}</b></span>
                <span>+ Margin: <b>₹{rec.expectedMargin?.toLocaleString('en-IN')}</b></span>
                <span className={rec.inStock === false ? 'text-red-500' : 'text-emerald-600'}>
                  {rec.inStock === false ? 'Out of stock' : 'In stock'}
                </span>
              </div>
            </div>
          </div>
          {rec.status === 'added' ? (
            <div className="mt-3 flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
              <CheckCircle2 size={14} /> Added to quote
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <button onClick={() => onAdd(rec)} className="btn btn-primary text-xs py-1.5 flex items-center gap-1">
                <Plus size={13} /> Add to Quote
              </button>
              <button onClick={() => onDismiss(rec)} className="btn btn-secondary text-xs py-1.5 flex items-center gap-1">
                <X size={13} /> Dismiss
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
