import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
        <div style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>
          Verifying cryptographic credentials...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If pending approval and not an admin/regulator
  const isAdminOrRegulator = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'REGULATOR';
  if (!isAdminOrRegulator && user.accountStatus === 'PENDING') {
    return <Navigate to="/pending-verification" replace />;
  }

  if (allowedRoles.length > 0) {
    const normalizedUserRole = user.role === 'ADMIN' ? 'SUPER_ADMIN' : user.role;
    const hasRole = allowedRoles.includes(user.role) || allowedRoles.includes(normalizedUserRole);

    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}