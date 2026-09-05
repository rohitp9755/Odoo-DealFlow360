import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ShieldCheck, Settings, LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LINKS_BY_ROLE = {
  SALES_REP: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/quotes', label: 'Quotes', icon: FileText }
  ],
  SALES_MANAGER: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/approvals', label: 'Approvals', icon: ShieldCheck }
  ],
  FINANCE: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/approvals', label: 'Approvals', icon: ShieldCheck }
  ],
  ADMIN: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/quotes', label: 'Quotes', icon: FileText },
    { to: '/approvals', label: 'Approvals', icon: ShieldCheck },
    { to: '/admin', label: 'Admin Settings', icon: Settings }
  ],
  CUSTOMER: [
    { to: '/portal', label: 'My Quotes', icon: Package }
  ]
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const links = LINKS_BY_ROLE[user?.role] || [];

  return (
    <aside className="w-60 shrink-0 bg-brand-900 text-white flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="text-lg font-bold tracking-tight">DealFlow<span className="text-brand-300">360</span></div>
        <div className="text-xs text-brand-200 mt-0.5">Self-governing sales ops</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-brand-200 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 mb-2 text-xs text-brand-200">
          {user?.name} · <span className="capitalize">{user?.role}</span>
        </div>
        <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-brand-200 hover:bg-white/5 hover:text-white w-full">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}
