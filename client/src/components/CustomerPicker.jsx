import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const TIER_STYLES = {
  Gold: 'bg-amber-100 text-amber-700',
  Silver: 'bg-slate-200 text-slate-700',
  Bronze: 'bg-orange-100 text-orange-700'
};

// Searchable customer combobox — used wherever a customer must be selected
// (e.g. quote creation) instead of a plain <select>, so reps can find a
// customer by name or email without scrolling a long list.
export default function CustomerPicker({ customers, value, onChange, placeholder = 'Search by name or email…' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  const selected = customers.find((c) => c._id === value) || null;

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, query]);

  function select(c) {
    onChange(c._id);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      {selected && !open ? (
        <button type="button" onClick={() => setOpen(true)} className="input flex items-center justify-between text-left">
          <span className="flex items-center gap-2 truncate">
            <span className="font-medium text-slate-800 truncate">{selected.name}</span>
            <span className={`badge ${TIER_STYLES[selected.tier] || 'bg-slate-100 text-slate-600'} shrink-0`}>{selected.tier}</span>
            {selected.status === 'inactive' && <span className="badge bg-slate-100 text-slate-500 shrink-0">Inactive</span>}
          </span>
          <ChevronDown size={14} className="text-slate-400 shrink-0" />
        </button>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-8"
            placeholder={placeholder}
            value={query}
            autoFocus={open}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-64 overflow-auto card shadow-lg py-1">
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-slate-400">No customers match.</div>}
          {filtered.map((c) => (
            <button
              type="button"
              key={c._id}
              onClick={() => select(c)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between gap-2"
            >
              <span className="truncate">
                <span className="font-medium text-slate-800">{c.name}</span>
                {c.email && <span className="ml-2 text-xs text-slate-400">{c.email}</span>}
              </span>
              <span className={`badge ${TIER_STYLES[c.tier] || 'bg-slate-100 text-slate-600'} shrink-0`}>{c.tier}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
