<<<<<<< HEAD
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PendingVerificationPage from './pages/PendingVerificationPage';
import VerificationPage from './pages/VerificationPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

// Common Authenticated Pages
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';

// Manufacturer Pages
import ManufacturerDashboardPage from './pages/manufacturer/ManufacturerDashboardPage';
import ManufacturerBatchesPage from './pages/manufacturer/ManufacturerBatchesPage';
import ManufacturerCreateBatchPage from './pages/manufacturer/ManufacturerCreateBatchPage';
import ManufacturerBatchDetailPage from './pages/manufacturer/ManufacturerBatchDetailPage';
import ManufacturerTransferPage from './pages/manufacturer/ManufacturerTransferPage';
import ManufacturerHistoryPage from './pages/manufacturer/ManufacturerHistoryPage';

// Distributor Pages
import DistributorDashboardPage from './pages/distributor/DistributorDashboardPage';
import DistributorBatchesPage from './pages/distributor/DistributorBatchesPage';
import DistributorBatchDetailPage from './pages/distributor/DistributorBatchDetailPage';
import DistributorInventoryPage from './pages/distributor/DistributorInventoryPage';
import DistributorTransferPage from './pages/distributor/DistributorTransferPage';
import DistributorOrdersPage from './pages/distributor/DistributorOrdersPage';
import DistributorHistoryPage from './pages/distributor/DistributorHistoryPage';

// Pharmacy Pages
import PharmacyDashboardPage from './pages/pharmacy/PharmacyDashboardPage';
import PharmacyMedicinesPage from './pages/pharmacy/PharmacyMedicinesPage';
import PharmacyCartPage from './pages/pharmacy/PharmacyCartPage';
import PharmacyOrdersPage from './pages/pharmacy/PharmacyOrdersPage';
import PharmacyOrderDetailPage from './pages/pharmacy/PharmacyOrderDetailPage';
import PharmacyReceivedPage from './pages/pharmacy/PharmacyReceivedPage';
import PharmacyBatchDetailPage from './pages/pharmacy/PharmacyBatchDetailPage';
import PharmacyHistoryPage from './pages/pharmacy/PharmacyHistoryPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminLicensesPage from './pages/admin/AdminLicensesPage';
import AdminBatchesPage from './pages/admin/AdminBatchesPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

function DashboardRedirector() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'MANUFACTURER':
      return <Navigate to="/manufacturer/dashboard" replace />;
    case 'DISTRIBUTOR':
      return <Navigate to="/distributor/dashboard" replace />;
    case 'PHARMACY':
      return <Navigate to="/pharmacy/dashboard" replace />;
    case 'ADMIN':
    case 'SUPER_ADMIN':
    case 'REGULATOR':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
}

function AppLayout({ children, hideSidebar = false }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuthPage = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/pending-verification',
    '/unauthorized',
    '/404',
  ].includes(location.pathname);

  const shouldShowSidebar = !isLanding && !isAuthPage && !hideSidebar;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onToggleSidebar={shouldShowSidebar ? () => setSidebarOpen(!sidebarOpen) : null} isLanding={isLanding} />
      <div style={{ display: 'flex', flex: 1 }}>
        {shouldShowSidebar && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main style={{ flex: 1, minWidth: 0, width: '100%' }}>{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* ==================================================== */}
              {/* PUBLIC ROUTES */}
              {/* ==================================================== */}
              <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
              <Route path="/login" element={<AppLayout><LoginPage /></AppLayout>} />
              <Route path="/register" element={<AppLayout><RegisterPage /></AppLayout>} />
              <Route path="/forgot-password" element={<AppLayout><ForgotPasswordPage /></AppLayout>} />
              <Route path="/reset-password" element={<AppLayout><ResetPasswordPage /></AppLayout>} />
              <Route path="/pending-verification" element={<AppLayout><PendingVerificationPage /></AppLayout>} />
              <Route path="/verify" element={<AppLayout><VerificationPage /></AppLayout>} />
              <Route path="/verify/:identifier" element={<AppLayout><VerificationPage /></AppLayout>} />
              <Route path="/verify/batch/:batchId" element={<AppLayout><VerificationPage /></AppLayout>} />

              {/* Universal redirector from /dashboard to role-based dashboard */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRedirector />
                  </ProtectedRoute>
                }
              />

              {/* Common Profile & Notifications */}
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

              {/* ==================================================== */}
              {/* MANUFACTURER ROUTES */}
              {/* ==================================================== */}
              <Route
                path="/manufacturer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><ManufacturerDashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/batches"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><ManufacturerBatchesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/batches/create"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><ManufacturerCreateBatchPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/batches/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><ManufacturerBatchDetailPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/transfers"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><ManufacturerTransferPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/transfers/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><ManufacturerTransferPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/history"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><ManufacturerHistoryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* ==================================================== */}
              {/* DISTRIBUTOR ROUTES */}
              {/* ==================================================== */}
              <Route
                path="/distributor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><DistributorDashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/batches"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><DistributorBatchesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/batches/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><DistributorBatchDetailPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/inventory"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><DistributorInventoryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/transfers"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><DistributorTransferPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/transfers/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><DistributorTransferPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/orders"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><DistributorOrdersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/history"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><DistributorHistoryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* ==================================================== */}
              {/* PHARMACY ROUTES */}
              {/* ==================================================== */}
              <Route
                path="/pharmacy/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><PharmacyDashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/medicines"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><PharmacyMedicinesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/cart"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><PharmacyCartPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/orders"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><PharmacyOrdersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/orders/:orderId"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><PharmacyOrderDetailPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/received"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><PharmacyReceivedPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/batches/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><PharmacyBatchDetailPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/history"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY', 'SUPER_ADMIN', 'ADMIN']}>
                    <AppLayout><PharmacyHistoryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* ==================================================== */}
              {/* ADMIN ROUTES */}
              {/* ==================================================== */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminDashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminUsersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/licenses"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminLicensesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/batches"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminBatchesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminAuditPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Errors & Fallbacks */}
              <Route path="/unauthorized" element={<AppLayout><UnauthorizedPage /></AppLayout>} />
              <Route path="/404" element={<AppLayout><NotFoundPage /></AppLayout>} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
=======
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, getRoleDashboardPath } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PendingVerificationPage from './pages/PendingVerificationPage';
import VerificationPage from './pages/VerificationPage';

// Shared Authenticated Pages
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

// Manufacturer Pages
import ManufacturerDashboardPage from './pages/manufacturer/ManufacturerDashboardPage';
import ManufacturerBatchesPage from './pages/manufacturer/ManufacturerBatchesPage';
import ManufacturerCreateBatchPage from './pages/manufacturer/ManufacturerCreateBatchPage';
import ManufacturerBatchDetailsPage from './pages/manufacturer/ManufacturerBatchDetailsPage';
import ManufacturerTransfersPage from './pages/manufacturer/ManufacturerTransfersPage';
import ManufacturerHistoryPage from './pages/manufacturer/ManufacturerHistoryPage';

// Distributor Pages
import DistributorDashboardPage from './pages/distributor/DistributorDashboardPage';
import DistributorBatchesPage from './pages/distributor/DistributorBatchesPage';
import DistributorBatchDetailsPage from './pages/distributor/DistributorBatchDetailsPage';
import DistributorInventoryPage from './pages/distributor/DistributorInventoryPage';
import DistributorTransfersPage from './pages/distributor/DistributorTransfersPage';
import DistributorOrdersPage from './pages/distributor/DistributorOrdersPage';
import DistributorHistoryPage from './pages/distributor/DistributorHistoryPage';

// Pharmacy Pages
import PharmacyDashboardPage from './pages/pharmacy/PharmacyDashboardPage';
import PharmacyMedicinesPage from './pages/pharmacy/PharmacyMedicinesPage';
import PharmacyCartPage from './pages/pharmacy/PharmacyCartPage';
import PharmacyOrdersPage from './pages/pharmacy/PharmacyOrdersPage';
import PharmacyOrderDetailsPage from './pages/pharmacy/PharmacyOrderDetailsPage';
import PharmacyReceivedPage from './pages/pharmacy/PharmacyReceivedPage';
import PharmacyBatchDetailsPage from './pages/pharmacy/PharmacyBatchDetailsPage';
import PharmacyHistoryPage from './pages/pharmacy/PharmacyHistoryPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminLicensesPage from './pages/admin/AdminLicensesPage';
import AdminBatchesPage from './pages/admin/AdminBatchesPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

function DashboardRedirect() {
  const { user } = useAuth();
  const targetPath = getRoleDashboardPath(user?.role);
  return <Navigate to={targetPath} replace />;
}

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
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
              <Route path="/login" element={<AppLayout><LoginPage /></AppLayout>} />
              <Route path="/register" element={<AppLayout><RegisterPage /></AppLayout>} />
              <Route path="/forgot-password" element={<AppLayout><ForgotPasswordPage /></AppLayout>} />
              <Route path="/reset-password" element={<AppLayout><ResetPasswordPage /></AppLayout>} />
              <Route path="/pending-verification" element={<AppLayout><PendingVerificationPage /></AppLayout>} />
              <Route path="/verify" element={<AppLayout><VerificationPage /></AppLayout>} />
              <Route path="/verify/:identifier" element={<AppLayout><VerificationPage /></AppLayout>} />

              {/* Shared Authenticated Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
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

              {/* Manufacturer Routes */}
              <Route
                path="/manufacturer/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER']}>
                    <AppLayout><ManufacturerDashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/batches"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER']}>
                    <AppLayout><ManufacturerBatchesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/batches/create"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER']}>
                    <AppLayout><ManufacturerCreateBatchPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/batches/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER']}>
                    <AppLayout><ManufacturerBatchDetailsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/transfers"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER']}>
                    <AppLayout><ManufacturerTransfersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/transfers/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER']}>
                    <AppLayout><ManufacturerTransfersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manufacturer/history"
                element={
                  <ProtectedRoute allowedRoles={['MANUFACTURER']}>
                    <AppLayout><ManufacturerHistoryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Distributor Routes */}
              <Route
                path="/distributor/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                    <AppLayout><DistributorDashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/batches"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                    <AppLayout><DistributorBatchesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/batches/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                    <AppLayout><DistributorBatchDetailsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/inventory"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                    <AppLayout><DistributorInventoryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/transfers"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                    <AppLayout><DistributorTransfersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/transfers/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                    <AppLayout><DistributorTransfersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/orders"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                    <AppLayout><DistributorOrdersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/distributor/history"
                element={
                  <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                    <AppLayout><DistributorHistoryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Pharmacy Routes */}
              <Route
                path="/pharmacy/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY']}>
                    <AppLayout><PharmacyDashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/medicines"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY']}>
                    <AppLayout><PharmacyMedicinesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/cart"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY']}>
                    <AppLayout><PharmacyCartPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/orders"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY']}>
                    <AppLayout><PharmacyOrdersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/orders/:orderId"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY']}>
                    <AppLayout><PharmacyOrderDetailsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/received"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY']}>
                    <AppLayout><PharmacyReceivedPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/batches/:batchId"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY']}>
                    <AppLayout><PharmacyBatchDetailsPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy/history"
                element={
                  <ProtectedRoute allowedRoles={['PHARMACY']}>
                    <AppLayout><PharmacyHistoryPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminDashboardPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminUsersPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/licenses"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminLicensesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/batches"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminBatchesPage /></AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'REGULATOR']}>
                    <AppLayout><AdminAuditPage /></AppLayout>
                  </ProtectedRoute>
                }
              />

              {/* Error Handling */}
              <Route path="/unauthorized" element={<AppLayout><UnauthorizedPage /></AppLayout>} />
              <Route path="/404" element={<AppLayout><NotFoundPage /></AppLayout>} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
>>>>>>> origin/main
