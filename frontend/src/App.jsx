import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PendingVerificationPage from './pages/PendingVerificationPage';
import VerificationPage from './pages/VerificationPage';

import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import OrganizationsPage from './pages/OrganizationsPage';
import LicensesPage from './pages/LicensesPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import BatchesPage from './pages/BatchesPage';
import SupplyChainPage from './pages/SupplyChainPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

function AppLayout({ children, hideSidebar = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/pending-verification'].includes(location.pathname);
  const shouldShowSidebar = !isLanding && !isAuthPage && !hideSidebar;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onToggleSidebar={shouldShowSidebar ? () => setSidebarOpen(!sidebarOpen) : null} isLanding={isLanding} />
      <div style={{ display: 'flex', flex: 1 }}>
        {shouldShowSidebar && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main style={{ flex: 1, minWidth: 0, width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Standalone Pages */}
            <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
            <Route path="/login" element={<AppLayout><LoginPage /></AppLayout>} />
            <Route path="/register" element={<AppLayout><RegisterPage /></AppLayout>} />
            <Route path="/forgot-password" element={<AppLayout><ForgotPasswordPage /></AppLayout>} />
            <Route path="/reset-password" element={<AppLayout><ResetPasswordPage /></AppLayout>} />
            <Route path="/pending-verification" element={<AppLayout><PendingVerificationPage /></AppLayout>} />
            <Route path="/verify/:identifier" element={<AppLayout><VerificationPage /></AppLayout>} />

            {/* Authenticated Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout><ProfilePage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AppLayout><NotificationsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/organizations"
              element={
                <ProtectedRoute>
                  <AppLayout><OrganizationsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/licenses"
              element={
                <ProtectedRoute>
                  <AppLayout><LicensesPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AppLayout><ProductsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/products/:id"
              element={
                <ProtectedRoute>
                  <AppLayout><ProductDetailPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/batches"
              element={
                <ProtectedRoute>
                  <AppLayout><BatchesPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/batches/:id"
              element={
                <ProtectedRoute>
                  <AppLayout><BatchesPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/supply-chain"
              element={
                <ProtectedRoute>
                  <AppLayout><SupplyChainPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Role Dedicated Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/regulator/dashboard"
              element={
                <ProtectedRoute allowedRoles={['REGULATOR', 'SUPER_ADMIN', 'ADMIN']}>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/regulator/licenses"
              element={
                <ProtectedRoute allowedRoles={['REGULATOR', 'SUPER_ADMIN', 'ADMIN']}>
                  <AppLayout><LicensesPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/regulator/organizations"
              element={
                <ProtectedRoute allowedRoles={['REGULATOR', 'SUPER_ADMIN', 'ADMIN']}>
                  <AppLayout><OrganizationsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/regulator/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['REGULATOR', 'SUPER_ADMIN', 'ADMIN']}>
                  <AppLayout><AuditLogsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/manufacturer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['MANUFACTURER']}>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/manufacturer/products"
              element={
                <ProtectedRoute allowedRoles={['MANUFACTURER', 'SUPER_ADMIN', 'ADMIN']}>
                  <AppLayout><ProductsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/manufacturer/batches"
              element={
                <ProtectedRoute allowedRoles={['MANUFACTURER', 'SUPER_ADMIN', 'ADMIN']}>
                  <AppLayout><BatchesPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/distributor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/distributor/shipments"
              element={
                <ProtectedRoute allowedRoles={['DISTRIBUTOR', 'SUPER_ADMIN', 'ADMIN']}>
                  <AppLayout><SupplyChainPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy/dashboard"
              element={
                <ProtectedRoute allowedRoles={['PHARMACY']}>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy/products"
              element={
                <ProtectedRoute allowedRoles={['PHARMACY', 'SUPER_ADMIN', 'ADMIN']}>
                  <AppLayout><ProductsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Errors */}
            <Route path="/unauthorized" element={<AppLayout><UnauthorizedPage /></AppLayout>} />
            <Route path="/404" element={<AppLayout><NotFoundPage /></AppLayout>} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}