import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, Feather } from 'lucide-react';
import api from '../services/api';

export default function VerificationPendingPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await api.post('/auth/resend-verification');
      setMessage('A new verification email has been sent.');
      setCooldown(45);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12 text-center">
        
        <div className="flex justify-center mb-8">
          <div className="bg-brand-600 text-white p-4 rounded-2xl shadow-md">
            <Mail className="w-10 h-10" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Check your email</h2>
        <p className="text-slate-500 text-base mb-8 leading-relaxed">
          We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.
        </p>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleResend}
            disabled={loading || cooldown > 0}
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-brand-600 text-white rounded-xl font-semibold shadow-md hover:bg-brand-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            <span>
              {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
            </span>
          </button>

          <Link 
            to="/login"
            className="w-full flex items-center justify-center space-x-2 py-3.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to login</span>
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-400">
          Didn't receive it? Check your spam folder.
        </p>
      </div>
    </div>
  );
}
