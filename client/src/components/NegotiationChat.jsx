import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function NegotiationChat({ messages, offer, onSend, onOfferAction, sending }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  }

  return (
    <div className="card flex flex-col h-[520px]">
      <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-slate-700">
        Deal Negotiation Assistant
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {(messages || []).map((m) => (
          <div key={m._id} className={`flex ${m.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm flex gap-2 items-start ${
              m.role === 'customer' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              {m.role !== 'customer' && <Bot size={15} className="mt-0.5 shrink-0 text-brand-500" />}
              <span>{m.content}</span>
              {m.role === 'customer' && <User size={15} className="mt-0.5 shrink-0" />}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {offer && offer.status === 'proposed' && (
        <div className="mx-4 mb-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs">
          <div className="grid grid-cols-2 gap-1 mb-2">
            <div>Requested: <b>{offer.requestedDiscount}%</b></div>
            <div>Recommended: <b>{offer.recommendedDiscount}%</b></div>
            <div className="col-span-2">Approval needed: <b>{offer.requiresApproval ? 'Yes' : 'No'}</b></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onOfferAction(offer, 'accept')} className="btn btn-primary text-xs py-1">
              Accept {offer.recommendedDiscount}%
            </button>
            {offer.requiresApproval && (
              <button onClick={() => onOfferAction(offer, 'request_approval')} className="btn btn-secondary text-xs py-1">
                Request {offer.requestedDiscount}% Approval
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="p-3 border-t border-slate-100 flex gap-2">
        <input
          className="input"
          placeholder="e.g. Can you give me 15% discount if I confirm today?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn btn-primary px-3" disabled={sending}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
