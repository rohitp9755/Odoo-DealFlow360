import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error loading this information. Please try again.',
  onRetry
}) {
  return (
    <div className="p-4 sm:p-5 rounded-xl bg-rose-50/70 border border-rose-200/60 flex items-start gap-3.5">
      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-rose-900 mb-0.5">{title}</h3>
        <p className="text-xs text-rose-700">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:text-rose-950 bg-rose-100/80 hover:bg-rose-100 px-2.5 py-1 rounded-md transition-colors"
          >
            <RotateCcw size={13} />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
