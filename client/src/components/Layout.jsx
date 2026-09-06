import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import NotificationsPanel from './NotificationsPanel';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-surface-subtle text-slate-900 font-sans antialiased">
      {/* Sidebar with mobile drawer capability */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-14 bg-white border-b-2 border-slate-900 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-900 hidden sm:block">
              DealFlow360 · Operations
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationsPanel />

            <div className="h-6 w-0.5 bg-slate-900" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 hidden sm:inline-block">
                {user?.name}
              </span>
              <span className="px-2 py-0.5 rounded-none text-[10px] font-bold bg-brand-500 text-white border-2 border-slate-900 uppercase tracking-widest">
                {(user?.role || '').replace('_', ' ')}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
