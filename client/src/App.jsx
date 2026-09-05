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
import ProductListPage from './pages/ProductListPage';
import ProductFormPage from './pages/ProductFormPage';
import PriceListPage from './pages/PriceListPage';

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

      <Route path="/admin/products" element={
        <ProtectedRoute roles={['ADMIN']}>
          <ProductListPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/products/new" element={
        <ProtectedRoute roles={['ADMIN']}>
          <ProductFormPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/products/:id" element={
        <ProtectedRoute roles={['ADMIN']}>
          <ProductFormPage />
        </ProtectedRoute>
      } />

      <Route path="/admin/price-lists" element={
        <ProtectedRoute roles={['ADMIN']}>
          <PriceListPage />
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
