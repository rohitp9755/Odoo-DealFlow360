import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { role: 'Rep', email: 'rep@dealflow360.com' },
  { role: 'Manager', email: 'manager@dealflow360.com' },
  { role: 'Finance', email: 'finance@dealflow360.com' },
  { role: 'Admin', email: 'admin@dealflow360.com' },
  { role: 'Customer', email: 'customer@dealflow360.com' }
];

export default function LoginPage() {
  const [email, setEmail] = useState('rep@dealflow360.com');
  const [password, setPassword] = useState('password123');
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
    <div className="min-h-screen flex items-center justify-center bg-brand-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-white">DealFlow<span className="text-brand-300">360</span></div>
          <div className="text-brand-200 text-sm mt-1">Intelligent, self-governing sales operations</div>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Email</label>
              <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Password</label>
              <input type="password" className="input mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 mb-2">Demo accounts (password: password123)</div>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  onClick={() => setEmail(a.email)}
                  className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  {a.role}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-600 font-medium hover:underline">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
