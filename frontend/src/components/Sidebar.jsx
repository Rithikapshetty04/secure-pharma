import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import StatusBadge from './StatusBadge';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const role = user?.role || 'GUEST';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'REGULATOR';
  const isMfg = role === 'MANUFACTURER';
  const isDist = role === 'DISTRIBUTOR';
  const isPharm = role === 'PHARMACY';

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    color: isActive ? '#1d4ed8' : 'var(--text-muted)',
    background: isActive ? '#eff6ff' : 'transparent',
    borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
    textDecoration: 'none',
    fontWeight: isActive ? '700' : '500',
    fontSize: '0.875rem',
    transition: 'all 0.15s ease',
  });

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            zIndex: 40,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      <aside
        style={{
          width: '260px',
          background: '#ffffff',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          boxShadow: '1px 0 3px rgba(15, 23, 42, 0.02)',
        }}
      >
        {/* Org Banner */}
        {user && (
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                color: '#2563eb',
                letterSpacing: '0.05em',
                marginBottom: '4px',
              }}
            >
              AUTHENTICATED ENTITY
            </div>
            <div
              style={{
                fontWeight: '700',
                fontSize: '0.95rem',
                color: 'var(--text-heading)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.organization?.name || user.name}
            </div>
            <div style={{ marginTop: '6px' }}>
              <StatusBadge status={user.role} />
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {/* MANUFACTURER NAVIGATION */}
          {isMfg && (
            <>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: '#059669',
                  letterSpacing: '0.05em',
                  padding: '8px 12px 4px',
                }}
              >
                MANUFACTURER WORKSPACE
              </div>

              <NavLink to="/manufacturer/dashboard" style={linkStyle} onClick={onClose}>
                📊 <span>Dashboard</span>
              </NavLink>

              <NavLink to="/manufacturer/batches" end style={linkStyle} onClick={onClose}>
                📦 <span>Medicines / Batches</span>
              </NavLink>

              <NavLink to="/manufacturer/batches/create" style={linkStyle} onClick={onClose}>
                ⚙️ <span>Create Batch</span>
              </NavLink>

              <NavLink to="/manufacturer/transfers" style={linkStyle} onClick={onClose}>
                🚚 <span>Transfers</span>
              </NavLink>

              <NavLink to="/verify" style={linkStyle} onClick={onClose}>
                🔍 <span>QR Verification</span>
              </NavLink>

              <NavLink to="/manufacturer/history" style={linkStyle} onClick={onClose}>
                ⛓️ <span>Supply Chain History</span>
              </NavLink>
            </>
          )}

          {/* DISTRIBUTOR NAVIGATION */}
          {isDist && (
            <>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: '#7c3aed',
                  letterSpacing: '0.05em',
                  padding: '8px 12px 4px',
                }}
              >
                DISTRIBUTOR WORKSPACE
              </div>

              <NavLink to="/distributor/dashboard" style={linkStyle} onClick={onClose}>
                📊 <span>Dashboard</span>
              </NavLink>

              <NavLink to="/distributor/batches" style={linkStyle} onClick={onClose}>
                📥 <span>Received Batches</span>
              </NavLink>

              <NavLink to="/distributor/inventory" style={linkStyle} onClick={onClose}>
                📦 <span>Inventory</span>
              </NavLink>

              <NavLink to="/distributor/transfers" style={linkStyle} onClick={onClose}>
                🚚 <span>Transfers</span>
              </NavLink>

              <NavLink to="/distributor/orders" style={linkStyle} onClick={onClose}>
                📋 <span>Orders</span>
              </NavLink>

              <NavLink to="/verify" style={linkStyle} onClick={onClose}>
                🔍 <span>QR Verification</span>
              </NavLink>

              <NavLink to="/distributor/history" style={linkStyle} onClick={onClose}>
                ⛓️ <span>Supply Chain History</span>
              </NavLink>
            </>
          )}

          {/* PHARMACY NAVIGATION */}
          {isPharm && (
            <>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: '#0284c7',
                  letterSpacing: '0.05em',
                  padding: '8px 12px 4px',
                }}
              >
                PHARMACY DISPENSARY
              </div>

              <NavLink to="/pharmacy/dashboard" style={linkStyle} onClick={onClose}>
                📊 <span>Dashboard</span>
              </NavLink>

              <NavLink to="/pharmacy/medicines" style={linkStyle} onClick={onClose}>
                💊 <span>Medicines</span>
              </NavLink>

              <NavLink to="/pharmacy/cart" style={linkStyle} onClick={onClose}>
                🛒 <span>Cart</span>
                {cartCount > 0 && (
                  <span
                    className="badge badge-info"
                    style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '0.7rem' }}
                  >
                    {cartCount}
                  </span>
                )}
              </NavLink>

              <NavLink to="/pharmacy/orders" style={linkStyle} onClick={onClose}>
                📋 <span>Orders</span>
              </NavLink>

              <NavLink to="/pharmacy/received" style={linkStyle} onClick={onClose}>
                📥 <span>Received Medicines</span>
              </NavLink>

              <NavLink to="/verify" style={linkStyle} onClick={onClose}>
                🔍 <span>QR Verification</span>
              </NavLink>

              <NavLink to="/pharmacy/history" style={linkStyle} onClick={onClose}>
                ⛓️ <span>Supply Chain History</span>
              </NavLink>
            </>
          )}

          {/* ADMIN NAVIGATION */}
          {isAdmin && (
            <>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: '#d97706',
                  letterSpacing: '0.05em',
                  padding: '8px 12px 4px',
                }}
              >
                ADMINISTRATIVE OVERSIGHT
              </div>

              <NavLink to="/admin/dashboard" style={linkStyle} onClick={onClose}>
                📊 <span>Dashboard</span>
              </NavLink>

              <NavLink to="/admin/users" style={linkStyle} onClick={onClose}>
                👥 <span>Users</span>
              </NavLink>

              <NavLink to="/admin/licenses" style={linkStyle} onClick={onClose}>
                📜 <span>License Verification</span>
              </NavLink>

              <NavLink to="/admin/batches" style={linkStyle} onClick={onClose}>
                📦 <span>Batches / Monitoring</span>
              </NavLink>

              <NavLink to="/admin/audit" style={linkStyle} onClick={onClose}>
                📋 <span>Audit / Traceability</span>
              </NavLink>

              <NavLink to="/verify" style={linkStyle} onClick={onClose}>
                🔍 <span>QR Verification</span>
              </NavLink>
            </>
          )}

          {/* SYSTEM & ACCOUNT */}
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              color: '#64748b',
              letterSpacing: '0.05em',
              padding: '16px 12px 4px',
            }}
          >
            ACCOUNT
          </div>

          <NavLink to="/notifications" style={linkStyle} onClick={onClose}>
            🔔 <span>Notifications</span>
            {unreadCount > 0 && (
              <span
                className="badge badge-danger"
                style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '0.7rem' }}
              >
                {unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/profile" style={linkStyle} onClick={onClose}>
            👤 <span>Profile</span>
          </NavLink>

          <button
            onClick={handleLogout}
            style={{
              ...linkStyle({ isActive: false }),
              width: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#dc2626',
              textAlign: 'left',
              marginTop: '4px',
            }}
          >
            🚪 <span>Logout</span>
          </button>
        </div>

        {/* Footer Security Badge */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
          }}
        >
          <span className="live-dot"></span>
          <span style={{ fontWeight: '600', color: '#1e40af' }}>Secure Pharma Ledger (Active)</span>
        </div>
      </aside>
    </>
  );
}
