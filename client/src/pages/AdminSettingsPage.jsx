import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const TABS = ['Discount Tiers', 'Category Ceilings', 'Approval Rules', 'Warehouses'];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState(TABS[0]);
  return (
    <Layout>
      <h1 className="text-xl font-bold text-slate-800 mb-6">Admin Settings</h1>
      <div className="flex gap-1.5 mb-6">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Discount Tiers' && <DiscountTiersTab />}
      {tab === 'Category Ceilings' && <CategoryCeilingsTab />}
      {tab === 'Approval Rules' && <ApprovalRulesTab />}
      {tab === 'Warehouses' && <WarehousesTab />}
    </Layout>
  );
}

function DiscountTiersTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/discount-rules/tiers').then((r) => setRows(r.data)); }, []);
  async function save(tier, autonomousDiscount) {
    const { data } = await api.put('/discount-rules/tiers', { tier, autonomousDiscount });
    setRows((prev) => prev.map((r) => (r.tier === tier ? data : r)));
  }
  return (
    <div className="card p-4 max-w-xl">
      <div className="text-sm text-slate-500 mb-3">Autonomous discount % a rep can apply without approval, by customer tier.</div>
      {rows.map((r) => (
        <div key={r.tier} className="flex items-center gap-3 mb-2">
          <span className="w-20 text-sm font-medium">{r.tier}</span>
          <input type="number" defaultValue={r.autonomousDiscount} className="input w-24"
            onBlur={(e) => save(r.tier, Number(e.target.value))} />
          <span className="text-xs text-slate-400">%</span>
        </div>
      ))}
    </div>
  );
}

function CategoryCeilingsTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/discount-rules').then((r) => setRows(r.data)); }, []);
  async function save(category, ceilingDiscount) {
    const { data } = await api.put('/discount-rules', { category, ceilingDiscount });
    setRows((prev) => prev.map((r) => (r.category === category ? data : r)));
  }
  return (
    <div className="card p-4 max-w-xl">
      <div className="text-sm text-slate-500 mb-3">Maximum discount % allowed per product category.</div>
      {rows.map((r) => (
        <div key={r.category} className="flex items-center gap-3 mb-2">
          <span className="w-24 text-sm font-medium">{r.category}</span>
          <input type="number" defaultValue={r.ceilingDiscount} className="input w-24"
            onBlur={(e) => save(r.category, Number(e.target.value))} />
          <span className="text-xs text-slate-400">%</span>
        </div>
      ))}
    </div>
  );
}

function ApprovalRulesTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/admin/approval-rules').then((r) => setRows(r.data)); }, []);
  return (
    <div className="card p-4 max-w-2xl">
      <div className="text-sm text-slate-500 mb-3">Approval chain thresholds (configured, read-only preview here).</div>
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-400 uppercase">
          <tr><th className="text-left py-2">Range</th><th className="text-left py-2">Approvers</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id} className="border-t border-slate-100">
              <td className="py-2">{r.minDiscount}% – {r.maxDiscount >= 9999 ? '∞' : `${r.maxDiscount}%`}</td>
              <td className="py-2">{r.approversRequired.join(' + ') || 'None'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WarehousesTab() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/admin/warehouses').then((r) => setRows(r.data)); }, []);
  return (
    <div className="card p-4 max-w-2xl">
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-400 uppercase">
          <tr><th className="text-left py-2">Name</th><th className="text-left py-2">Location</th><th className="text-left py-2">Shipping/unit</th></tr>
        </thead>
        <tbody>
          {rows.map((w) => (
            <tr key={w._id} className="border-t border-slate-100">
              <td className="py-2">{w.name}</td><td className="py-2">{w.location}</td><td className="py-2">₹{w.shippingCostPerUnit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
