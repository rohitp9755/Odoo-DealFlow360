import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, FilePlus2, Mail, Phone, User as UserIcon } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import StageBadge from '../components/StageBadge';
import { useAuth } from '../context/AuthContext';

const TIER_STYLES = {
  Gold: 'bg-amber-100 text-amber-700',
  Silver: 'bg-slate-200 text-slate-700',
  Bronze: 'bg-orange-100 text-orange-700'
};

function formatAddress(a) {
  if (!a) return null;
  const parts = [a.street, a.city, a.state, a.postalCode, a.country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['ADMIN', 'SALES_REP'].includes(user?.role);
  const canDelete = user?.role === 'ADMIN';

  const [customer, setCustomer] = useState(null);
  const [tierDiscounts, setTierDiscounts] = useState({});
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get(`/customers/${id}`),
      api.get('/discount-rules/tiers').catch(() => ({ data: [] })),
      api.get('/quotes').catch(() => ({ data: [] }))
    ])
      .then(([c, tiers, q]) => {
        setCustomer(c.data);
        setTierDiscounts(Object.fromEntries(tiers.data.map((row) => [row.tier, row.autonomousDiscount])));
        setQuotes(q.data.filter((quote) => String(quote.customer?._id || quote.customer) === id));
      })
      .catch(() => setError('Failed to load customer'))
      .finally(() => setLoading(false));
  }, [id]);

  const autonomousDiscount = useMemo(
    () => (customer ? tierDiscounts[customer.tier] : undefined),
    [customer, tierDiscounts]
  );

  async function removeCustomer() {
    if (!window.confirm(`Delete "${customer.name}"? This only works if the customer has no quotes.`)) return;
    try {
      await api.delete(`/customers/${id}`);
      navigate('/customers');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  }

  if (loading) return <Layout><div className="text-slate-400">Loading…</div></Layout>;
  if (error || !customer) return <Layout><div className="text-red-600 text-sm">{error || 'Customer not found'}</div></Layout>;

  const billing = formatAddress(customer.billingAddress);
  const shipping = customer.shippingSameAsBilling ? billing : formatAddress(customer.shippingAddress);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/customers" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-1">
            <ArrowLeft size={13} /> Back to customers
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">{customer.name}</h1>
            <span className={`badge ${TIER_STYLES[customer.tier] || 'bg-slate-100 text-slate-600'}`}>{customer.tier}</span>
            <span className={`badge ${customer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {customer.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button onClick={() => navigate(`/quotes/new?customer=${customer._id}`)} className="btn btn-secondary flex items-center gap-1.5 text-xs">
              <FilePlus2 size={14} /> New Quote
            </button>
          )}
          {canEdit && (
            <button onClick={() => navigate(`/customers/${id}/edit`)} className="btn btn-secondary flex items-center gap-1.5 text-xs">
              <Pencil size={14} /> Edit
            </button>
          )}
          {canDelete && (
            <button onClick={removeCustomer} className="btn btn-danger flex items-center gap-1.5 text-xs">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 text-sm mb-4">Contact</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} className="text-slate-400" /> {customer.email || '—'}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} className="text-slate-400" /> {customer.phone || '—'}
              </div>
              <div className="flex items-center gap-2 text-slate-600 col-span-2">
                <UserIcon size={14} className="text-slate-400" />
                Assigned rep: {customer.assignedRep?.name || 'Unassigned'}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 text-sm mb-4">Billing & Shipping</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Billing address</div>
                <div className="text-slate-700">{billing || '—'}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">
                  Shipping address {customer.shippingSameAsBilling && <span className="text-slate-400">(same as billing)</span>}
                </div>
                <div className="text-slate-700">{shipping || '—'}</div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 text-sm mb-4">Quotes</h2>
            {quotes.length === 0 ? (
              <div className="text-sm text-slate-400">No quotes yet for this customer.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-400 uppercase">
                  <tr>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Stage</th>
                    <th className="text-left py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q) => (
                    <tr key={q._id} onClick={() => navigate(`/quotes/${q._id}`)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <td className="py-2">₹{q.total?.toLocaleString('en-IN')}</td>
                      <td className="py-2"><StageBadge stage={q.stage} /></td>
                      <td className="py-2 text-slate-500">{new Date(q.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 text-sm mb-3">Tier Governance</h2>
            <p className="text-xs text-slate-500 mb-3">
              This customer's <span className="font-medium text-slate-700">{customer.tier}</span> tier is applied automatically to every quote:
            </p>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
              <li>
                <span className="font-medium">Price calculation</span> — tier-specific price list overrides apply where configured.
              </li>
              <li>
                <span className="font-medium">Discount governance</span> — reps can apply up to{' '}
                <span className="font-semibold">{autonomousDiscount ?? '—'}%</span> autonomously before it's flagged.
              </li>
              <li>
                <span className="font-medium">Approval routing</span> — discounts above that autonomous limit are routed to manager/finance approval.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
