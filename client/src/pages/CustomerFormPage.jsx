import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Power } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const TIERS = ['Bronze', 'Silver', 'Gold'];
const EMPTY_ADDRESS = { street: '', city: '', state: '', postalCode: '', country: '' };
const EMPTY_FORM = {
  name: '', email: '', phone: '', tier: 'Bronze', status: 'active', assignedRep: '',
  billingAddress: { ...EMPTY_ADDRESS },
  shippingAddress: { ...EMPTY_ADDRESS },
  shippingSameAsBilling: true
};

function addressOrEmpty(a) {
  return { ...EMPTY_ADDRESS, ...(a || {}) };
}

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [reps, setReps] = useState([]);
  const [tierDiscounts, setTierDiscounts] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/customers/meta/sales-reps').then((r) => setReps(r.data)).catch(() => {});
    // Autonomous discount % per tier — shown inline so whoever sets the tier
    // sees the discount governance/approval-routing consequence immediately.
    api.get('/discount-rules/tiers').then((r) => {
      setTierDiscounts(Object.fromEntries(r.data.map((row) => [row.tier, row.autonomousDiscount])));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get(`/customers/${id}`)
      .then((r) => setForm({
        name: r.data.name,
        email: r.data.email || '',
        phone: r.data.phone || '',
        tier: r.data.tier,
        status: r.data.status,
        assignedRep: r.data.assignedRep?._id || r.data.assignedRep || '',
        billingAddress: addressOrEmpty(r.data.billingAddress),
        shippingAddress: addressOrEmpty(r.data.shippingAddress),
        shippingSameAsBilling: r.data.shippingSameAsBilling ?? true
      }))
      .catch(() => setError('Failed to load customer'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }
  function updateAddress(kind, field, value) {
    setForm((prev) => ({ ...prev, [kind]: { ...prev[kind], [field]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Company / customer name is required');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      tier: form.tier,
      status: form.status,
      assignedRep: form.assignedRep || null,
      shippingSameAsBilling: form.shippingSameAsBilling,
      billingAddress: form.billingAddress,
      shippingAddress: form.shippingSameAsBilling ? form.billingAddress : form.shippingAddress
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/customers/${id}`, payload);
        navigate(`/customers/${id}`);
      } else {
        const { data } = await api.post('/customers', payload);
        navigate(`/customers/${data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    const nextStatus = form.status === 'active' ? 'inactive' : 'active';
    try {
      const { data } = await api.put(`/customers/${id}`, { status: nextStatus });
      setForm((prev) => ({ ...prev, status: data.status }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update customer status');
    }
  }

  async function removeCustomer() {
    if (!window.confirm(`Delete "${form.name}"? This only works if the customer has no quotes.`)) return;
    try {
      await api.delete(`/customers/${id}`);
      navigate('/customers');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete customer');
    }
  }

  if (loading) return <Layout><div className="text-slate-400">Loading…</div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/customers" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-1">
            <ArrowLeft size={13} /> Back to customers
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">{isEdit ? (form.name || 'Customer') : 'New Customer'}</h1>
            {isEdit && (
              <span className={`badge ${form.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {form.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>
        {isEdit && (
          <div className="flex gap-2">
            <button onClick={toggleStatus} className="btn btn-secondary flex items-center gap-1.5 text-xs">
              <Power size={14} /> {form.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            {user?.role === 'ADMIN' && (
              <button onClick={removeCustomer} className="btn btn-danger flex items-center gap-1.5 text-xs">
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm">Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600">Company / Customer Name</label>
              <input className="input mt-1" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Email</label>
              <input type="email" className="input mt-1" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Phone</label>
              <input className="input mt-1" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Customer Tier</label>
              <select className="input mt-1" value={form.tier} onChange={(e) => update('tier', e.target.value)}>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}{tierDiscounts[t] !== undefined ? ` — ${tierDiscounts[t]}% autonomous discount` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Drives price calculation, discount governance, and approval routing for this customer's quotes.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Status</label>
              <select className="input mt-1" value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600">Assigned Sales Representative</label>
              <select className="input mt-1" value={form.assignedRep} onChange={(e) => update('assignedRep', e.target.value)}>
                <option value="">Unassigned</option>
                {reps.map((r) => (
                  <option key={r._id} value={r._id}>{r.name} ({r.role.replace('_', ' ')})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm">Billing Information</h2>
          <AddressFields value={form.billingAddress} onChange={(field, value) => updateAddress('billingAddress', field, value)} />
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">Shipping Information</h2>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.shippingSameAsBilling}
                onChange={(e) => update('shippingSameAsBilling', e.target.checked)}
              />
              Same as billing
            </label>
          </div>
          {!form.shippingSameAsBilling && (
            <AddressFields value={form.shippingAddress} onChange={(field, value) => updateAddress('shippingAddress', field, value)} />
          )}
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Customer'}
        </button>
      </form>
    </Layout>
  );
}

function AddressFields({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label className="text-xs font-medium text-slate-600">Street</label>
        <input className="input mt-1" value={value.street} onChange={(e) => onChange('street', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">City</label>
        <input className="input mt-1" value={value.city} onChange={(e) => onChange('city', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">State</label>
        <input className="input mt-1" value={value.state} onChange={(e) => onChange('state', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">Postal Code</label>
        <input className="input mt-1" value={value.postalCode} onChange={(e) => onChange('postalCode', e.target.value)} />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">Country</label>
        <input className="input mt-1" value={value.country} onChange={(e) => onChange('country', e.target.value)} />
      </div>
    </div>
  );
}
