import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Reusable modal component.
 * Props:
 *  - isOpen: boolean – controls visibility
 *  - onClose: function – called when backdrop clicked or ESC pressed
 *  - title: node – optional header title
 *  - children: node – modal body/content
 *  - footer: node – optional footer (e.g., action buttons)
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      {/* Stop propagation to prevent backdrop click when interacting inside modal */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {title && (
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-slate-800">{title}</h2>
            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
