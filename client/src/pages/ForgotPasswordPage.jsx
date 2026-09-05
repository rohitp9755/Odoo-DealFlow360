import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Feather } from 'lucide-react';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forgot Password</h2>
          <p className="text-slate-500 mt-2 text-sm">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        {message ? (
          <div className="text-center">
            <div className="mb-8 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
              {message}
            </div>
            <Link 
              to="/login"
              className="w-full flex items-center justify-center space-x-2 py-3.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to login</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
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
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors flex justify-center items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
