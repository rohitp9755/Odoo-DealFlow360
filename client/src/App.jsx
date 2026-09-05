import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import QuoteListPage from './pages/QuoteListPage';
import NewQuotePage from './pages/NewQuotePage';
import QuoteDetailPage from './pages/QuoteDetailPage';
import ApprovalDashboard from './pages/ApprovalDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import AdminSettingsPage from './pages/AdminSettingsPage';
import CustomerPortalPage from './pages/CustomerPortalPage';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute roles={['rep', 'manager', 'finance', 'admin']}>
          <ExecutiveDashboard />
        </ProtectedRoute>
      } />

      <Route path="/quotes" element={
        <ProtectedRoute roles={['rep', 'admin']}>
          <QuoteListPage />
        </ProtectedRoute>
      } />
      <Route path="/quotes/new" element={
        <ProtectedRoute roles={['rep', 'admin']}>
          <NewQuotePage />
        </ProtectedRoute>
      } />
      <Route path="/quotes/:id" element={
        <ProtectedRoute roles={['rep', 'manager', 'finance', 'admin']}>
          <QuoteDetailPage />
        </ProtectedRoute>
      } />

      <Route path="/approvals" element={
        <ProtectedRoute roles={['manager', 'finance', 'admin']}>
          <ApprovalDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <AdminSettingsPage />
        </ProtectedRoute>
      } />

      <Route path="/portal" element={
        <ProtectedRoute roles={['customer']}>
          <CustomerPortalPage />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to={user ? (user.role === 'customer' ? '/portal' : '/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
