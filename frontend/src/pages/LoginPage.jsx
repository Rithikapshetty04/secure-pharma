import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('mfg@apexbiopharma.com');
  const [password, setPassword] = useState('Mfg@123456');
  const [selectedRole, setSelectedRole] = useState('Manufacturer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const roleCredentials = {
    Admin: { email: 'superadmin@securepharma.gov', pass: 'SuperAdmin@123456' },
    Manufacturer: { email: 'mfg@apexbiopharma.com', pass: 'Mfg@123456' },
    Distributor: { email: 'logistics@novalog.com', pass: 'Dist@123456' },
    Pharmacy: { email: 'care@medlifepharma.com', pass: 'Pharm@123456' },
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    if (roleCredentials[role]) {
      setEmail(roleCredentials[role].email);
      setPassword(roleCredentials[role].pass);
      setError(null);
    }
  };

  const getRoleDestination = (role) => {
    switch (role) {
      case 'MANUFACTURER':
        return '/manufacturer/dashboard';
      case 'DISTRIBUTOR':
        return '/distributor/dashboard';
      case 'PHARMACY':
        return '/pharmacy/dashboard';
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'REGULATOR':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success && res.user) {
        const dest = getRoleDestination(res.user.role);
        navigate(dest, { replace: true });
      } else {
        if (res.accountStatus === 'PENDING' || res.accountStatus === 'UNDER_REVIEW') {
          navigate(`/pending-verification?userId=${res.userId || ''}&email=${encodeURIComponent(email)}`);
        } else if (res.accountStatus === 'REJECTED') {
          setError('Your registration application has been rejected by the regulatory administrator.');
        } else {
          setError(res.message || 'Authentication failed. Please check credentials.');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'linear-gradient(135deg, #e8f3fb 0%, #f0f7fe 50%, #e2effa 100%)',
        padding: '40px 20px',
        overflow: 'hidden',
      }}
    >
      {/* Background Decorative SVG Graphic */}
      <svg
        style={{
          position: 'absolute',
          left: '2%',
          top: '20%',
          width: '320px',
          height: '420px',
          opacity: 0.45,
          pointerEvents: 'none',
        }}
        viewBox="0 0 240 320"
        fill="none"
      >
        <polygon points="120,20 190,60 190,140 120,180 50,140 50,60" stroke="#93c5fd" strokeWidth="2" />
        <polygon points="120,50 165,75 165,125 120,150 75,125 75,75" stroke="#60a5fa" strokeWidth="1.5" />
        <path d="M120,50 L120,150 M120,150 L75,125 M120,150 L165,125" stroke="#93c5fd" strokeWidth="1.5" />
        <polygon points="120,180 180,215 180,285 120,320 60,285 60,215" stroke="#bfdbfe" strokeWidth="1.5" />
      </svg>

      <svg
        style={{
          position: 'absolute',
          right: '3%',
          top: '10%',
          width: '360px',
          height: '480px',
          opacity: 0.45,
          pointerEvents: 'none',
        }}
        viewBox="0 0 260 360"
        fill="none"
      >
        <polygon points="130,25 210,70 210,160 130,205 50,160 50,70" stroke="#93c5fd" strokeWidth="2" />
        <polygon points="130,60 185,90 185,150 130,180 75,150 75,90" stroke="#3b82f6" strokeWidth="1.8" />
        <polygon points="130,85 160,102 160,138 130,155 100,138 100,102" fill="#dbeafe" fillOpacity="0.5" stroke="#2563eb" strokeWidth="1.5" />
      </svg>

      {/* Main Login Card */}
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '36px 32px 30px',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 35px -5px rgba(15, 23, 42, 0.08), 0 2px 10px rgba(15, 23, 42, 0.03)',
          border: '1px solid #f1f5f9',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
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

          <h2
            style={{
              fontSize: '1.45rem',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Secure Pharma
          </h2>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '20px' }}>
          Sign in to your authenticated stakeholder portal
        </p>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '10px 12px',
              color: '#b91c1c',
              fontSize: '0.825rem',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Demo Role Selector */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '700',
                marginBottom: '6px',
                color: '#1e293b',
              }}
            >
              Portal Role (Quick Select)
            </label>
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                color: '#0f172a',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <option value="Manufacturer">Manufacturer</option>
              <option value="Distributor">Distributor</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Email Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '700',
                marginBottom: '6px',
                color: '#1e293b',
              }}
            >
              Official Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                color: '#0f172a',
              }}
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '700',
                marginBottom: '6px',
                color: '#1e293b',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '12px 0',
              fontWeight: '700',
              fontSize: '0.95rem',
              marginTop: '4px',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
          <Link to="/forgot-password" style={{ color: '#059669', fontWeight: '600', textDecoration: 'none' }}>
            Forgot Password?
          </Link>
          <Link to="/register" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
            Register Entity →
          </Link>
        </div>
      </div>
    </div>
  );
}
