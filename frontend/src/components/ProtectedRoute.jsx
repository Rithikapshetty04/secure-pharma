import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getRoleDashboardPath } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div className="live-dot" style={{ width: '20px', height: '20px' }}></div>
        <div style={{ color: '#2563eb', fontWeight: '600', fontSize: '0.95rem' }}>
          Verifying credentials & role authorization...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If pending approval and not an admin
  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'REGULATOR';
  if (!isAdmin && (user.accountStatus === 'PENDING' || user.accountStatus === 'UNDER_REVIEW' || user.accountStatus === 'REJECTED')) {
    return <Navigate to={`/pending-verification?email=${encodeURIComponent(user.email || '')}`} replace />;
  }

  if (allowedRoles.length > 0) {
    const userRole = (user.role || '').toUpperCase();
    const normalizedRoles = allowedRoles.map((r) => r.toUpperCase());

    const isMatch =
      normalizedRoles.includes(userRole) ||
      (userRole === 'SUPER_ADMIN' && normalizedRoles.includes('ADMIN')) ||
      (userRole === 'ADMIN' && normalizedRoles.includes('SUPER_ADMIN'));

    if (!isMatch) {
      // Redirect to their own dashboard
      const userDashboard = getRoleDashboardPath(user.role);
      return <Navigate to={userDashboard} replace />;
    }
  }

  return children;
}