import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Feather, Mail, Lock, User as UserIcon } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'SALES_REP', label: 'Sales Rep' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'ADMIN', label: 'Admin' }
];

const MIN_PASSWORD_LENGTH = 8;

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(ROLE_OPTIONS[0].value);
  const [error, setError] = useState('');
  const { register, googleLogin, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const user = await register({ name, email, password, role });
      // If unverified, they are redirected by App.jsx or API interceptor
      navigate(user.role === 'CUSTOMER' ? '/portal' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans overflow-hidden items-center justify-center p-4">
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12">
        
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-slate-500 mt-2 text-sm">Join the platform to manage deals intelligently.</p>
        </div>

        <div className="mb-8 flex justify-center w-full">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setError('');
              try {
                const user = await googleLogin(credentialResponse.credential, role);
                navigate(user.role === 'CUSTOMER' ? '/portal' : '/dashboard');
              } catch (err) {
                setError(err.response?.data?.message || 'Google signup failed');
              }
            }}
            onError={() => setError('Google sign-in could not be completed')}
            useOneTap
            shape="rectangular"
            theme="outline"
            size="large"
            text="signup_with"
            width="100%"
          />
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-slate-500 font-medium">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input type="text" required className="input !pl-10 py-2.5 bg-white" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input type="email" required className="input !pl-10 py-2.5 bg-white" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role (Internal)</label>
            <select className="input py-2.5 bg-white" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input type="password" required className="input !pl-10 py-2.5 bg-white" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ chars" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input type="password" required className="input !pl-10 py-2.5 bg-white" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
