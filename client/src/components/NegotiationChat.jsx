import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Check, ShieldAlert, Sparkles } from 'lucide-react';

export default function NegotiationChat({ messages, offer, onSend, onOfferAction, sending }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function submit(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <div className="card flex flex-col h-[520px] overflow-hidden border border-slate-200/80 shadow-subtle">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600">
            <Bot size={14} />
          </div>
          <div>
            <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider block">
              AI Negotiation Assistant
            </span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Autonomous governance limits & deal guardrails
            </span>
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded-full border border-slate-200/60">
          Guardrailed AI
        </span>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {(messages || []).map((m) => {
          const isCustomer = m.role === 'customer';
          const isSystem = m.role === 'system';

          if (isSystem) {
            return (
              <div key={m._id} className="flex justify-center my-2">
                <div className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60 text-center max-w-sm">
                  {m.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={m._id}
              className={`flex items-end gap-2 ${
                isCustomer ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isCustomer && (
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-brand-600 shrink-0 mb-0.5">
                  <Bot size={13} />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-subtle ${
                  isCustomer
                    ? 'bg-brand-600 text-white rounded-br-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-none'
                }`}
              >
                {m.content}
              </div>

              {isCustomer && (
                <div className="w-6 h-6 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0 mb-0.5">
                  <User size={13} />
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Interactive Offer Callout */}
      {offer && offer.status === 'proposed' && (
        <div className="m-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs shadow-subtle animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-2">
            <ShieldAlert size={14} className="text-amber-600" />
            Active Negotiation Terms
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-slate-700 bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
            <div>
              <span className="text-slate-500 block text-[10px]">Requested Discount:</span>
              <span className="font-bold text-slate-900">{offer.requestedDiscount}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Autonomous Offer:</span>
              <span className="font-bold text-brand-700">{offer.recommendedDiscount}%</span>
            </div>
            <div className="col-span-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
              Approval required for requested terms:{' '}
              <b>{offer.requiresApproval ? 'Yes (Manager/Finance)' : 'No (Approved automatically)'}</b>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOfferAction(offer, 'accept')}
              className="btn btn-primary text-xs py-1.5 flex-1 flex justify-center items-center gap-1"
            >
              <Check size={13} />
              Accept {offer.recommendedDiscount}%
            </button>
            {offer.requiresApproval && (
              <button
                type="button"
                onClick={() => onOfferAction(offer, 'request_approval')}
                className="btn btn-outline text-xs py-1.5 flex-1 flex justify-center items-center gap-1"
              >
                Request {offer.requestedDiscount}% Approval
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={submit} className="p-3 border-t border-slate-200/80 bg-slate-50/50 flex gap-2">
        <input
          className="input text-xs"
          placeholder="Type message, e.g. 'Can you offer 15% if we confirm today?'…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="btn btn-primary px-3 text-xs shrink-0"
          aria-label="Send negotiation message"
        >
          <Send size={14} className={sending ? 'animate-spin' : ''} />
        </button>
      </form>
    </div>
  );
}
