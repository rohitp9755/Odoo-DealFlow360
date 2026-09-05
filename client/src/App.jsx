import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
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
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

      <Route path="/dashboard" element={
        <ProtectedRoute roles={['SALES_REP', 'SALES_MANAGER', 'FINANCE', 'ADMIN']}>
          <ExecutiveDashboard />
        </ProtectedRoute>
      } />

      <Route path="/quotes" element={
        <ProtectedRoute roles={['SALES_REP', 'ADMIN']}>
          <QuoteListPage />
        </ProtectedRoute>
      } />
      <Route path="/quotes/new" element={
        <ProtectedRoute roles={['SALES_REP', 'ADMIN']}>
          <NewQuotePage />
        </ProtectedRoute>
      } />
      <Route path="/quotes/:id" element={
        <ProtectedRoute roles={['SALES_REP', 'SALES_MANAGER', 'FINANCE', 'ADMIN']}>
          <QuoteDetailPage />
        </ProtectedRoute>
      } />

      <Route path="/approvals" element={
        <ProtectedRoute roles={['SALES_MANAGER', 'FINANCE', 'ADMIN']}>
          <ApprovalDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute roles={['ADMIN']}>
          <AdminSettingsPage />
        </ProtectedRoute>
      } />

      <Route path="/portal" element={
        <ProtectedRoute roles={['CUSTOMER']}>
          <CustomerPortalPage />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to={user ? (user.role === 'CUSTOMER' ? '/portal' : '/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
