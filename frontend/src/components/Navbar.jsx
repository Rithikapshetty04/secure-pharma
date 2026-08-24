import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import StatusBadge from './StatusBadge';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(10, 14, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: Mobile Toggle & Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="btn btn-outline btn-sm"
            style={{ padding: '6px 10px', color: '#fff' }}
          >
            ☰
          </button>
        )}

        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.5)',
              fontSize: '1.2rem',
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.02em' }}>
              SECURE<span style={{ color: 'var(--accent-cyan)' }}>PHARMA</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
              PHARMACEUTICAL SUPPLY TRUST
            </div>
          </div>
        </Link>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Public Verifier Link */}
        <Link
          to="/verify/BATCH-2026-TEST-001"
          className="btn btn-outline btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          🔍 <span>Verify Batch</span>
        </Link>

        {isAuthenticated ? (
          <>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="btn btn-outline btn-sm"
                style={{ position: 'relative', padding: '6px 12px' }}
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '50%',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '340px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '16px',
                    zIndex: 100,
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Notifications</div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>
                      No new alerts on ledger
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => markRead(n._id)}
                          style={{
                            padding: '10px',
                            background: n.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(0, 242, 254, 0.08)',
                            borderLeft: n.isRead ? '2px solid transparent' : '2px solid var(--accent-cyan)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff' }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{n.message}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifications(false)}
                      style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none' }}
                    >
                      View All Notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>{user.name?.split(' ')[0]}</span>
                <StatusBadge status={user.role} />
              </button>

              {showUserMenu && (
                <div
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '220px',
                    padding: '12px',
                    zIndex: 100,
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user.email}</div>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none' }}
                  >
                    📊 Dashboard
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none' }}
                  >
                    👤 Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none', color: '#f87171' }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="btn btn-outline btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register Entity
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}