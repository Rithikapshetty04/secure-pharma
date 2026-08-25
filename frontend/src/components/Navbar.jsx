import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import StatusBadge from './StatusBadge';

export default function Navbar({ onToggleSidebar, isLanding = false }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        padding: '0 32px',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
      }}
    >
      {/* Left: Mobile Toggle & Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="btn btn-outline btn-sm"
            style={{ padding: '6px 10px', color: 'var(--text-heading)' }}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        )}

        <Link
          to="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {/* Blue Shield Icon */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(29, 78, 216, 0.28)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L4 5.5V11.5C4 16.5 7.5 21.1 12 22.5C16.5 21.1 20 16.5 20 11.5V5.5L12 2Z"
                fill="white"
                fillOpacity="0.25"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <span
            style={{
              fontWeight: '800',
              fontSize: '1.28rem',
              color: '#1e3a8a',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Secure Pharma
          </span>
        </Link>
      </div>

      {/* Middle: Public Navigation Links */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
        }}
        className="desktop-nav"
      >
        <a
          href="#features"
          onClick={(e) => scrollToSection(e, 'features')}
          className="nav-link-custom"
          style={{ color: '#475569', fontWeight: '500', fontSize: '0.95rem' }}
        >
          Features
        </a>
        <a
          href="#about"
          onClick={(e) => scrollToSection(e, 'about')}
          className="nav-link-custom"
          style={{ color: '#475569', fontWeight: '500', fontSize: '0.95rem' }}
        >
          About
        </a>
        <a
          href="#contact"
          onClick={(e) => scrollToSection(e, 'contact')}
          className="nav-link-custom"
          style={{ color: '#475569', fontWeight: '500', fontSize: '0.95rem' }}
        >
          Contact
        </a>
      </nav>

      {/* Right: Auth / Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {isAuthenticated ? (
          <>
            <Link
              to="/dashboard"
              className="btn btn-pill btn-pill-outline btn-sm"
              style={{ padding: '8px 18px', fontSize: '0.875rem' }}
            >
              📊 Dashboard
            </Link>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="btn btn-outline btn-sm"
                style={{ position: 'relative', padding: '7px 12px', borderRadius: '9999px' }}
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
                      boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
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
                    top: '48px',
                    right: 0,
                    width: '340px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '16px',
                    zIndex: 100,
                    background: '#ffffff',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-heading)' }}>Notifications</div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
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
                            background: n.isRead ? '#f8fafc' : '#eff6ff',
                            borderLeft: n.isRead ? '2px solid transparent' : '3px solid #2563eb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-heading)' }}>{n.title}</div>
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
                      style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}
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
                style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '9999px', padding: '6px 14px' }}
              >
                <span style={{ fontWeight: '600' }}>{user.name?.split(' ')[0]}</span>
                <StatusBadge status={user.role} />
              </button>

              {showUserMenu && (
                <div
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: '48px',
                    right: 0,
                    width: '220px',
                    padding: '12px',
                    zIndex: 100,
                    background: '#ffffff',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-heading)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user.email}</div>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                  >
                    📊 Dashboard
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent' }}
                  >
                    👤 Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', color: '#dc2626' }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/login"
              className="btn btn-pill btn-pill-outline"
              style={{
                padding: '8px 22px',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn-pill btn-pill-primary"
              style={{
                padding: '8px 24px',
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}