import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('df360_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistSession(token, user) {
  localStorage.setItem('df360_token', token);
  localStorage.setItem('df360_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('df360_token');
  localStorage.removeItem('df360_user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(false);
  // True only while the initial session check (validating any stored token
  // against the server) is in flight. Consumers use this to avoid flashing
  // the login page or a protected page before that check resolves.
  const [initializing, setInitializing] = useState(true);

  // On mount, re-validate any stored token against the server rather than
  // trusting the cached user forever — the token may have expired or the
  // account may have been deactivated since the last visit.
  useEffect(() => {
    const token = localStorage.getItem('df360_token');
    if (!token) {
      setInitializing(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        localStorage.setItem('df360_user', JSON.stringify(data.user));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persistSession(data.token, data.user);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  // Signup for internal staff roles only (SALES_REP, SALES_MANAGER, FINANCE, ADMIN).
  // Customer accounts must be linked to an existing Customer record and are
  // provisioned by staff, not self-service, so that flow is out of scope here.
  async function register({ name, email, password, role }) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      persistSession(data.token, data.user);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
