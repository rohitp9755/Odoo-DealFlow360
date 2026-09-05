import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const navigate = useNavigate();

  useEffect(() => {
    load();
    api.get('/product-categories?status=all').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  function load() {
    setLoading(true);
    setError('');
    api.get('/products?status=all')
      .then((r) => setProducts(r.data))
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter === 'active' && !p.active) return false;
      if (statusFilter === 'inactive' && p.active) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  async function toggleActive(p) {
    try {
      const { data } = await api.put(`/products/${p._id}`, { active: !p.active });
      setProducts((prev) => prev.map((x) => (x._id === p._id ? data : x)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update product');
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}"? This also removes its variants.`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      setProducts((prev) => prev.filter((x) => x._id !== p._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500">Manage your product catalog</p>
        </div>
        <button onClick={() => navigate('/admin/products/new')} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={16} /> New Product
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by name or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All statuses</option>
        </select>
      </div>

      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Price</th>
              <th className="text-left px-4 py-3">Unit</th>
              <th className="text-left px-4 py-3">Tax</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No products match your filters.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p._id} onClick={() => navigate(`/admin/products/${p._id}`)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                <td className="px-4 py-3 text-slate-500">{p.category}</td>
                <td className="px-4 py-3">₹{p.price?.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-slate-500">{p.unit}</td>
                <td className="px-4 py-3 text-slate-500">{p.tax}%</td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => navigate(`/admin/products/${p._id}`)} className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100" title="Edit">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => toggleActive(p)} className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-slate-100" title={p.active ? 'Deactivate' : 'Activate'}>
                      <Power size={15} />
                    </button>
                    <button onClick={() => remove(p)} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
