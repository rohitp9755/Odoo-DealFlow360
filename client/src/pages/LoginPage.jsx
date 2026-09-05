import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Feather, ShoppingCart, BarChart2, Settings, Users, Globe, FileText, ShoppingBag, Cpu, Box, File, Monitor, MessageSquare } from 'lucide-react';

const OdooBackground = () => {
  const icons = [
    { icon: FileText, color: 'text-red-500', bg: 'bg-white', border: 'border-red-500', name: 'Accounting' },
    { icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-white', border: 'border-orange-500', name: 'Purchase' },
    { icon: Cpu, color: 'text-amber-500', bg: 'bg-white', border: 'border-amber-500', name: 'Manufacturing' },
    { icon: Box, color: 'text-yellow-500', bg: 'bg-white', border: 'border-yellow-500', name: 'Inventory' },
    { icon: File, color: 'text-lime-500', bg: 'bg-white', border: 'border-lime-500', name: 'Document' },
    { icon: Monitor, color: 'text-green-500', bg: 'bg-white', border: 'border-green-500', name: 'POS' },
    { icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-white', border: 'border-emerald-500', name: 'Live Chat' },
    { icon: BarChart2, color: 'text-cyan-500', bg: 'bg-white', border: 'border-cyan-500', name: 'CRM' },
    { icon: Settings, color: 'text-blue-500', bg: 'bg-white', border: 'border-blue-500', name: 'Project' },
    { icon: ShoppingCart, color: 'text-indigo-500', bg: 'bg-white', border: 'border-indigo-500', name: 'Sales' },
    { icon: Users, color: 'text-purple-500', bg: 'bg-white', border: 'border-purple-500', name: 'HR' },
    { icon: Globe, color: 'text-fuchsia-500', bg: 'bg-white', border: 'border-fuchsia-500', name: 'Website' },
  ];

  const radius = 280; // Scaled down slightly to fit well in half-screen

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      
      {/* Central Odoo Text / Circle */}
      <div className="absolute z-10 bg-white rounded-full w-64 h-64 flex items-center justify-center border-[3px] border-slate-300 shadow-md">
        <span className="text-6xl font-bold text-slate-500 tracking-tighter" style={{ fontFamily: 'sans-serif' }}>odoo</span>
      </div>

      {/* Rotating Container */}
      <div className="absolute animate-spin-slow w-[560px] h-[560px] flex items-center justify-center rounded-full border border-slate-200 border-dashed">
        {icons.map((item, index) => {
          const angle = (index / icons.length) * 360;
          return (
            <div 
              key={index} 
              className="absolute flex flex-col items-center justify-center"
              style={{
                transform: `rotate(${angle}deg) translateY(-${radius}px)`,
              }}
            >
              {/* Counter rotate to keep icons upright */}
              <div className="animate-spin-slow-reverse flex flex-col items-center">
                <div className={`w-[64px] h-[64px] rounded-full border-[3px] ${item.bg} ${item.border} flex items-center justify-center shadow-sm mb-2`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <span className="text-xs font-semibold text-slate-700 bg-white/95 px-2.5 py-0.5 rounded-full shadow-sm">{item.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'CUSTOMER' ? '/portal' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
      
      {/* Left Column - Branding & Animation (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col relative bg-slate-50 border-r border-slate-200">
        
        {/* Top Header */}
        <div className="absolute top-12 left-12 z-20">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-brand-600 text-white p-3 rounded-2xl shadow-md">
              <Feather className="w-7 h-7" />
            </div>
            <div className="text-4xl font-black tracking-tight text-slate-900 uppercase">
              INK THE <span className="text-brand-600">DEAL</span>
            </div>
          </div>
          <div className="text-slate-600 text-lg font-medium pl-2">
            Intelligent, self-governing sales operations
          </div>
        </div>

        {/* Animation Container */}
        <div className="flex-1 flex items-center justify-center mt-20 relative">
          <OdooBackground />
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[420px]">
          
          {/* Mobile Header (Only visible on small screens) */}
          <div className="lg:hidden mb-12 text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="bg-brand-600 text-white p-2.5 rounded-xl shadow-md">
                <Feather className="w-6 h-6" />
              </div>
              <div className="text-3xl font-black tracking-tight text-slate-900 uppercase">
                INK THE <span className="text-brand-600">DEAL</span>
              </div>
            </div>
            <div className="text-slate-500 text-sm font-medium">
              Intelligent, self-governing sales operations
            </div>
          </div>

          <div className="mb-10 lg:mb-12">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 mt-2 text-base">Sign in to your account to continue</p>
          </div>

          {/* SSO Options */}
          <div className="mb-8">
            <button 
              type="button" 
              className="w-full flex items-center justify-center space-x-3 py-3 border border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition-colors text-base font-medium text-slate-700 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  required
                  className="input !pl-11 py-3 text-base shadow-sm bg-white" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@company.com"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  required
                  className="input !pl-11 py-3 text-base shadow-sm bg-white" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-600 text-center font-medium">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary w-full py-3.5 mt-2 flex justify-center text-base font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
