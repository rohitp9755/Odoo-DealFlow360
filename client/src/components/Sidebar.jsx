import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  Boxes,
  Tags,
  Users,
  Package,
  Layers,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Structured sections by role
const NAV_SECTIONS_BY_ROLE = {
  SALES_REP: [
    {
      title: 'Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/quotes', label: 'Quotations', icon: FileText },
        { to: '/customers', label: 'Customers', icon: Users }
      ]
    }
  ],
  SALES_MANAGER: [
    {
      title: 'Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/customers', label: 'Customers', icon: Users }
      ]
    },
    {
      title: 'Governance',
      items: [
        { to: '/approvals', label: 'Approvals', icon: ShieldCheck }
      ]
    }
  ],
  FINANCE: [
    {
      title: 'Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/customers', label: 'Customers', icon: Users }
      ]
    },
    {
      title: 'Governance',
      items: [
        { to: '/approvals', label: 'Approvals', icon: ShieldCheck }
      ]
    }
  ],
  ADMIN: [
    {
      title: 'Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/quotes', label: 'Quotations', icon: FileText },
        { to: '/customers', label: 'Customers', icon: Users }
      ]
    },
    {
      title: 'Governance',
      items: [
        { to: '/approvals', label: 'Approvals', icon: ShieldCheck }
      ]
    },
    {
      title: 'Catalog & Rules',
      items: [
        { to: '/admin/products', label: 'Products', icon: Boxes },
        { to: '/admin/price-lists', label: 'Price Lists', icon: Tags },
        { to: '/admin', label: 'Discount & Rules', icon: Settings }
      ]
    }
  ],
  CUSTOMER: [
    {
      title: 'Portal',
      items: [
        { to: '/portal', label: 'My Quotations', icon: Package }
      ]
    }
  ]
};

export default function Sidebar({ mobileOpen = false, onCloseMobile }) {
  const { user, logout } = useAuth();
  const sections = NAV_SECTIONS_BY_ROLE[user?.role] || [];

  const userInitials = (user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d121f] text-slate-200 border-r border-slate-800/80 w-64 select-none">
      {/* Brand Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-base shadow-sm ring-1 ring-white/10">
            D
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              DealFlow<span className="text-brand-400">360</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide">
              Sales Operations
            </div>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Main Navigation">
        {sections.map((sec, secIdx) => (
          <div key={sec.title || secIdx} className="space-y-1">
            {sec.title && (
              <div className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {sec.title}
              </div>
            )}
            {sec.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    isActive
                      ? 'bg-brand-600/15 text-white font-semibold border border-brand-500/20 shadow-subtle'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User & Logout Footer */}
      <div className="px-3 py-3 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800/60 transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">
              {user?.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate capitalize">
              {(user?.role || '').replace('_', ' ').toLowerCase()}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop + Content */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200 shadow-popover">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
