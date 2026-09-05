import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Power, Search, Boxes } from 'lucide-react';
import api from '../services/api';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';

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
    api.get('/product-categories?status=all').then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  function load() {
    setLoading(true);
    setError('');
    api.get('/products?status=all')
      .then((r) => setProducts(r.data || []))
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false));
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter === 'active' && !p.active) return false;
      if (statusFilter === 'inactive' && p.active) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) {
        return false;
      }
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

  const columns = [
    {
      header: 'Product Name',
      key: 'name',
      render: (p) => (
        <div>
          <div className="font-semibold text-slate-900">{p.name}</div>
          {p.description && (
            <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description}</div>
          )}
        </div>
      )
    },
    {
      header: 'Category',
      key: 'category',
      render: (p) => (
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {p.category}
        </span>
      )
    },
    {
      header: 'Base Price',
      key: 'price',
      align: 'right',
      render: (p) => (
        <span className="font-semibold text-slate-900 tabular-nums">
          ₹{p.price?.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: 'Unit',
      key: 'unit',
      align: 'center',
      render: (p) => <span className="text-xs text-slate-500">{p.unit || 'unit'}</span>
    },
    {
      header: 'Tax Rate',
      key: 'tax',
      align: 'center',
      render: (p) => <span className="text-xs text-slate-600 tabular-nums">{p.tax}%</span>
    },
    {
      header: 'Status',
      key: 'active',
      align: 'center',
      render: (p) => <StatusBadge status={p.active ? 'active' : 'inactive'} size="xs" />
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/admin/products/${p._id}`)}
            className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
            title="Edit Product"
            aria-label={`Edit ${p.name}`}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => toggleActive(p)}
            className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title={p.active ? 'Deactivate' : 'Activate'}
            aria-label={`Toggle active state for ${p.name}`}
          >
            <Power size={14} />
          </button>
          <button
            onClick={() => remove(p)}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Product"
            aria-label={`Delete ${p.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <Layout>
      <PageHeader
        title="Products"
        subtitle="Manage master catalog items, variant matrices, and base pricing structures."
        breadcrumb="Catalog"
        actions={
          <button
            onClick={() => navigate('/admin/products/new')}
            className="btn btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus size={15} /> New Product
          </button>
        }
      />

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            className="input !pl-9 text-xs"
            placeholder="Search products by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="input w-auto text-xs py-1.5"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="input w-auto text-xs py-1.5"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="active">Active products</option>
            <option value="inactive">Inactive products</option>
            <option value="all">All statuses</option>
          </select>

          {(search || categoryFilter || statusFilter !== 'active') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setStatusFilter('active');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyTitle="No products found"
        emptyDescription={
          search || categoryFilter
            ? 'No catalog items match your search filters.'
            : 'Add your first product to begin building sales quotes.'
        }
        emptyAction={
          <button onClick={() => navigate('/admin/products/new')} className="btn btn-primary text-xs">
            Add Product
          </button>
        }
        onRowClick={(p) => navigate(`/admin/products/${p._id}`)}
      />
    </Layout>
  );
}
