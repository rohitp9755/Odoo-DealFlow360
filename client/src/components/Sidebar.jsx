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
        { to: '/admin', label: 'Discount & Rules', icon: Settings, end: true }
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
    <div className="flex flex-col h-full bg-slate-900 text-white border-r-2 border-slate-900 w-64 select-none">
      {/* Brand Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b-2 border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-none bg-brand-500 border-2 border-slate-900 shadow-brutal flex items-center justify-center text-white font-bold text-base">
            D
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 uppercase">
              DealFlow<span className="text-brand-400">360</span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
              Operations
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
            {sec.items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 px-3 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 border-2 ${
                    isActive
                      ? 'bg-brand-500 text-white border-slate-900 shadow-brutal'
                      : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-none bg-white shrink-0 border border-slate-900" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User & Logout Footer */}
      <div className="px-3 py-3 border-t-2 border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2.5 p-2 rounded-none hover:bg-slate-800 transition-colors border-2 border-transparent hover:border-slate-700">
          <div className="w-8 h-8 rounded-none bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {user?.name}
            </div>
            <div className="text-[10px] text-slate-400 font-bold tracking-widest truncate uppercase">
              {(user?.role || '').replace('_', ' ')}
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
