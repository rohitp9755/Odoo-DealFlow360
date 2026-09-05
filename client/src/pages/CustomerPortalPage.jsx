import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import StageBadge from '../components/StageBadge';
import NegotiationChat from '../components/NegotiationChat';
import api from '../services/api';

export default function CustomerPortalPage() {
  const [quotes, setQuotes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [negotiation, setNegotiation] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => { api.get('/portal/quotes').then((r) => setQuotes(r.data)); }, []);

  async function open(q) {
    const { data } = await api.get(`/portal/quotes/${q._id}`);
    setSelected(data);
    const neg = await api.get(`/negotiations/${q._id}`);
    setNegotiation(neg.data);
  }

  async function sendChat(text) {
    setSending(true);
    try {
      const { data } = await api.post(`/negotiations/${selected._id}/message`, { message: text });
      setNegotiation(data.negotiation);
    } finally { setSending(false); }
  }

  async function offerAction(offer, action) {
    const { data } = await api.post(`/negotiations/${selected._id}/counter-offer`, { offerId: offer._id, action });
    if (data.quote) {
      const refreshedQuote = await api.get(`/portal/quotes/${selected._id}`);
      setSelected(refreshedQuote.data);
    }
    const refreshed = await api.get(`/negotiations/${selected._id}`);
    setNegotiation(refreshed.data);
  }

  async function confirmQuote() {
    const { data } = await api.post(`/portal/quotes/${selected._id}/confirm`);
    setSelected(data);
  }

  const lastOffer = negotiation?.offers?.[negotiation.offers.length - 1];

  return (
    <Layout>
      <h1 className="text-xl font-bold text-slate-800 mb-6">My Quotations</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card overflow-hidden h-fit">
          {quotes.map((q) => (
            <div key={q._id} onClick={() => open(q)}
              className={`px-4 py-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${selected?._id === q._id ? 'bg-brand-50' : ''}`}>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">₹{q.total?.toLocaleString('en-IN')}</span>
                <StageBadge stage={q.stage} />
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{new Date(q.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
          {quotes.length === 0 && <div className="p-4 text-sm text-slate-400">No quotations yet.</div>}
        </div>

        {selected && (
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="font-semibold text-sm">Quote Details</div>
                {['sent', 'under_negotiation', 'approved'].includes(selected.stage) && (
                  <button onClick={confirmQuote} className="btn btn-primary text-xs">Confirm Quotation</button>
                )}
              </div>
              <table className="w-full text-sm mb-3">
                <thead className="text-xs text-slate-400 uppercase">
                  <tr><th className="text-left py-1">Product</th><th className="text-left py-1">Qty</th><th className="text-left py-1">Price</th><th className="text-left py-1">Discount</th><th className="text-left py-1">Total</th></tr>
                </thead>
                <tbody>
                  {selected.lines.map((l, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1.5">{l.product?.name}</td>
                      <td className="py-1.5">{l.quantity}</td>
                      <td className="py-1.5">₹{l.unitPrice?.toLocaleString('en-IN')}</td>
                      <td className="py-1.5">{l.lineDiscount}%</td>
                      <td className="py-1.5">₹{l.total?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between text-sm font-semibold border-t border-slate-100 pt-2">
                <span>Total</span><span>₹{selected.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <NegotiationChat
              messages={negotiation?.messages}
              offer={lastOffer}
              onSend={sendChat}
              onOfferAction={offerAction}
              sending={sending}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
