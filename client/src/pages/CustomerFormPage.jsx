import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Power, Save, Building2, MapPin } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const TIERS = ['Bronze', 'Silver', 'Gold'];
const EMPTY_ADDRESS = { street: '', city: '', state: '', postalCode: '', country: '' };
const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  tier: 'Bronze',
  status: 'active',
  assignedRep: '',
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
    api.get('/customers/meta/sales-reps').then((r) => setReps(r.data || [])).catch(() => {});
    api.get('/discount-rules/tiers').then((r) => {
      setTierDiscounts(
        Object.fromEntries((r.data || []).map((row) => [row.tier, row.autonomousDiscount]))
      );
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get(`/customers/${id}`)
      .then((r) =>
        setForm({
          name: r.data.name,
          email: r.data.email || '',
          phone: r.data.phone || '',
          tier: r.data.tier,
          status: r.data.status,
          assignedRep: r.data.assignedRep?._id || r.data.assignedRep || '',
          billingAddress: addressOrEmpty(r.data.billingAddress),
          shippingAddress: addressOrEmpty(r.data.shippingAddress),
          shippingSameAsBilling: r.data.shippingSameAsBilling ?? true
        })
      )
      .catch(() => setError('Failed to load customer profile'))
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

  if (loading) {
    return (
      <Layout>
        <div className="p-12 text-center text-xs text-slate-400">Loading customer account…</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title={isEdit ? (form.name || 'Edit Customer') : 'Create Customer Account'}
        subtitle="Manage client corporate identity, governance tier, and geographical delivery endpoints."
        backTo={isEdit ? `/customers/${id}` : '/customers'}
        backLabel="Back to Customers"
        badge={
          isEdit && (
            <div className="flex items-center gap-2">
              <StatusBadge status={form.tier.toLowerCase()} size="xs" />
              <StatusBadge status={form.status} size="xs" />
            </div>
          )
        }
        actions={
          isEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleStatus}
                className="btn btn-outline text-xs flex items-center gap-1.5"
              >
                <Power size={13} />
                {form.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              {user?.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={removeCustomer}
                  className="btn btn-danger text-xs flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          )
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
        {/* Profile Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
            <Building2 size={15} className="text-brand-600" />
            Corporate Profile
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Company / Customer Name *</label>
              <input
                className="input text-xs"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Acme Technologies"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                className="input text-xs"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="procurement@company.com"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
              <input
                className="input text-xs"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+91-9800000000"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Customer Contract Tier</label>
              <select
                className="input text-xs"
                value={form.tier}
                onChange={(e) => update('tier', e.target.value)}
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                    {tierDiscounts[t] !== undefined ? ` — ${tierDiscounts[t]}% ceiling` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Controls autonomous discount limit and risk scoring for this customer's quotes.
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Account Status</label>
              <select
                className="input text-xs"
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Assigned Sales Representative</label>
              <select
                className="input text-xs"
                value={form.assignedRep}
                onChange={(e) => update('assignedRep', e.target.value)}
              >
                <option value="">Unassigned</option>
                {reps.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Billing Address Card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
            <MapPin size={15} className="text-brand-600" />
            Billing Address
          </div>
          <AddressFields
            value={form.billingAddress}
            onChange={(field, value) => updateAddress('billingAddress', field, value)}
          />
        </div>

        {/* Shipping Address Card */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
              <MapPin size={15} className="text-brand-600" />
              Shipping Address
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={form.shippingSameAsBilling}
                onChange={(e) => update('shippingSameAsBilling', e.target.checked)}
              />
              Same as billing
            </label>
          </div>

          {!form.shippingSameAsBilling && (
            <AddressFields
              value={form.shippingAddress}
              onChange={(field, value) => updateAddress('shippingAddress', field, value)}
            />
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <Save size={13} />
            {saving ? 'Saving account…' : isEdit ? 'Save Changes' : 'Create Customer'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost text-xs"
          >
            Cancel
          </button>
        </div>
      </form>
    </Layout>
  );
}

function AddressFields({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      <div className="sm:col-span-2">
        <label className="font-semibold text-slate-700 block mb-1">Street Address</label>
        <input
          className="input text-xs"
          value={value.street || ''}
          onChange={(e) => onChange('street', e.target.value)}
          placeholder="e.g. 221 MG Road, Suite 400"
        />
      </div>
      <div>
        <label className="font-semibold text-slate-700 block mb-1">City</label>
        <input
          className="input text-xs"
          value={value.city || ''}
          onChange={(e) => onChange('city', e.target.value)}
          placeholder="City"
        />
      </div>
      <div>
        <label className="font-semibold text-slate-700 block mb-1">State / Province</label>
        <input
          className="input text-xs"
          value={value.state || ''}
          onChange={(e) => onChange('state', e.target.value)}
          placeholder="State"
        />
      </div>
      <div>
        <label className="font-semibold text-slate-700 block mb-1">Postal Code</label>
        <input
          className="input text-xs"
          value={value.postalCode || ''}
          onChange={(e) => onChange('postalCode', e.target.value)}
          placeholder="Postal Code"
        />
      </div>
      <div>
        <label className="font-semibold text-slate-700 block mb-1">Country</label>
        <input
          className="input text-xs"
          value={value.country || ''}
          onChange={(e) => onChange('country', e.target.value)}
          placeholder="Country"
        />
      </div>
    </div>
  );
}
