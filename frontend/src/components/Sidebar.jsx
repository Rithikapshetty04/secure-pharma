import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import StatusBadge from './StatusBadge';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const role = user?.role || 'GUEST';
  const isRegulator = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'REGULATOR';
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
          <div style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#2563eb', letterSpacing: '0.05em', marginBottom: '4px' }}>
              AUTHENTICATED ENTITY
            </div>
            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.organization?.name || user.name}
            </div>
            <div style={{ marginTop: '6px' }}>
              <StatusBadge status={user.role} />
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em', padding: '8px 12px 4px' }}>
            CORE LEDGER
          </div>

          <NavLink to="/dashboard" style={linkStyle} onClick={onClose}>
            📊 <span>Dashboard</span>
          </NavLink>

          <NavLink to="/verify/BATCH-2026-TEST-001" style={linkStyle} onClick={onClose}>
            🔍 <span>Public Verifier</span>
          </NavLink>

          <NavLink to="/products" style={linkStyle} onClick={onClose}>
            💊 <span>Formulary Drugs</span>
          </NavLink>

          <NavLink to="/batches" style={linkStyle} onClick={onClose}>
            📦 <span>Batches & QR</span>
          </NavLink>

          <NavLink to="/supply-chain" style={linkStyle} onClick={onClose}>
            ⛓️ <span>Supply Chain</span>
          </NavLink>

          <NavLink to="/organizations" style={linkStyle} onClick={onClose}>
            🏢 <span>Organizations</span>
          </NavLink>

          {/* Role Specific Menus */}
          {isRegulator && (
            <>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#d97706', letterSpacing: '0.05em', padding: '14px 12px 4px' }}>
                REGULATORY OVERSIGHT
              </div>

              <NavLink to="/regulator/licenses" style={linkStyle} onClick={onClose}>
                📜 <span>License Approvals</span>
              </NavLink>

              <NavLink to="/regulator/organizations" style={linkStyle} onClick={onClose}>
                🛡️ <span>Entity Management</span>
              </NavLink>

              <NavLink to="/regulator/audit-logs" style={linkStyle} onClick={onClose}>
                📋 <span>21 CFR Audit Logs</span>
              </NavLink>
            </>
          )}

          {isMfg && (
            <>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#059669', letterSpacing: '0.05em', padding: '14px 12px 4px' }}>
                MANUFACTURER WORKSPACE
              </div>

              <NavLink to="/manufacturer/products" style={linkStyle} onClick={onClose}>
                🧪 <span>Register Drug</span>
              </NavLink>

              <NavLink to="/manufacturer/batches" style={linkStyle} onClick={onClose}>
                ⚙️ <span>Mint Production Batch</span>
              </NavLink>
            </>
          )}

          {isDist && (
            <>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#7c3aed', letterSpacing: '0.05em', padding: '14px 12px 4px' }}>
                DISTRIBUTION LOGISTICS
              </div>

              <NavLink to="/distributor/shipments" style={linkStyle} onClick={onClose}>
                🚚 <span>Transfer Custody</span>
              </NavLink>
            </>
          )}

          {isPharm && (
            <>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#0284c7', letterSpacing: '0.05em', padding: '14px 12px 4px' }}>
                PHARMACY DISPENSARY
              </div>

              <NavLink to="/pharmacy/products" style={linkStyle} onClick={onClose}>
                🏥 <span>Scan & Dispense</span>
              </NavLink>
            </>
          )}

          {/* Account */}
          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em', padding: '14px 12px 4px' }}>
            SYSTEM
          </div>

          <NavLink to="/notifications" style={linkStyle} onClick={onClose}>
            🔔 <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '0.7rem' }}>
                {unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/profile" style={linkStyle} onClick={onClose}>
            👤 <span>Organization Profile</span>
          </NavLink>
        </div>

        {/* Footer Security Badge */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f8fafc',
        }}>
          <span className="live-dot"></span>
          <span style={{ fontWeight: '600', color: '#1e40af' }}>Ledger Connected (v2.6)</span>
        </div>
      </aside>
    </>
  );
}
