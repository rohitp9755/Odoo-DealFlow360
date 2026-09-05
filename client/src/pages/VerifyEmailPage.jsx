import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setUser } = useAuth();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    api.post('/auth/verify-email', { token })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
        if (res.data.user) {
          setUser(res.data.user);
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be expired.');
      });
  }, [token, setUser]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12 text-center">
        
        <div className="flex justify-center mb-6">
          {status === 'loading' && <Loader2 className="w-16 h-16 text-brand-600 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500" />}
          {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">
          {status === 'loading' && 'Verifying Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h2>
        
        <p className="text-slate-500 text-base mb-8 leading-relaxed">
          {status === 'loading' && 'Please wait while we verify your email address.'}
          {status === 'success' && message}
          {status === 'error' && message}
        </p>

        {status === 'success' && (
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-brand-600 text-white rounded-xl font-semibold shadow-md hover:bg-brand-700 hover:shadow-lg transition-all"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <Link 
              to="/verification-pending"
              className="w-full flex items-center justify-center space-x-2 py-3.5 bg-brand-600 text-white rounded-xl font-semibold shadow-md hover:bg-brand-700 hover:shadow-lg transition-all"
            >
              <span>Request New Link</span>
            </Link>
            <Link 
              to="/login"
              className="w-full flex items-center justify-center space-x-2 py-3.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
            >
              <span>Back to login</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
