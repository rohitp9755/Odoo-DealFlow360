import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Validate session on load
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setInitializing(false));
  }, []);

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function register({ name, email, password, role }) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role });
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin(credential, defaultRole) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google-login', { credential, defaultRole });
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, googleLogin, logout, loading, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
