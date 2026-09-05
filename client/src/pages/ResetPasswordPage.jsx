import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Feather } from 'lucide-react';
import api from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="p-8 bg-white rounded-2xl shadow-xl text-center max-w-sm">
          <p className="text-red-500 font-medium mb-4">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="text-brand-600 hover:underline">Request a new one</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/reset-password', { token, password });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans overflow-hidden items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12">
        
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 text-white p-2.5 rounded-xl shadow-md">
              <Feather className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              INK THE <span className="text-brand-600">DEAL</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h2>
          <p className="text-slate-500 mt-2 text-sm">Create a strong password for your account.</p>
        </div>

        {message ? (
          <div className="text-center">
            <div className="mb-8 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
              {message}
            </div>
            <p className="text-slate-500 text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
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
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  required
                  className="input !pl-11 py-3 text-base shadow-sm bg-white" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Must match password"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-600 text-center font-medium">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary w-full py-3.5 mt-2 flex justify-center text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
