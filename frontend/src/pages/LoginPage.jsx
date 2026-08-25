import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const roleCredentials = {
    Admin: { email: 'superadmin@securepharma.gov', pass: 'SuperAdmin@123456' },
    Manufacturer: { email: 'mfg@apexbiopharma.com', pass: 'Mfg@123456' },
    Distributor: { email: 'logistics@novalog.com', pass: 'Dist@123456' },
    Pharmacy: { email: 'care@medlifepharma.com', pass: 'Pharm@123456' },
    Customer: { email: 'regulator@securepharma.gov', pass: 'Regulator@123456' },
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        if (res.accountStatus === 'PENDING' || res.accountStatus === 'UNDER_REVIEW') {
          navigate(`/pending-verification?userId=${res.userId || ''}&email=${encodeURIComponent(email)}`);
        } else {
          setError(res.message || 'Authentication failed. Please check credentials.');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
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
      {/* Background Isometric Wireframe Hexagons / Blockchain Cubes */}
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
        <path d="M120,215 L120,320 M120,268 L60,233 M120,268 L180,233" stroke="#bfdbfe" strokeWidth="1" strokeDasharray="3 3" />
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
        <path d="M130,85 L130,155 M130,120 L100,102 M130,120 L160,102" stroke="#2563eb" strokeWidth="1.2" />
        <polygon points="130,210 200,250 200,330 130,370 60,330 60,250" stroke="#bfdbfe" strokeWidth="1.5" />
      </svg>

      {/* Main Login Card */}
      <div
        style={{
          maxWidth: '400px',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '28px' }}>
          {/* Green & Blue Hexagon Logo */}
          <div
            style={{
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Green top hexagon half */}
              <path
                d="M20 4L34 12V22L20 14L6 22V12L20 4Z"
                fill="#10b981"
              />
              {/* Blue bottom hexagon half */}
              <path
                d="M20 26L6 18V28L20 36L34 28V18L20 26Z"
                fill="#1d4ed8"
              />
              {/* Inner geometric cube knot */}
              <circle cx="20" cy="20" r="4.5" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
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
          {/* Email Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '6px',
                color: '#1e293b',
              }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                color: '#0f172a',
                outline: 'none',
              }}
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
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
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  outline: 'none',
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
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Select Role Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '6px',
                color: '#1e293b',
              }}
            >
              Select Role
            </label>
            <div style={{ position: 'relative' }}>
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
                  appearance: 'none',
                  background: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <option value="Admin">Admin</option>
                <option value="Manufacturer">Manufacturer</option>
                <option value="Distributor">Distributor</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Customer">Customer</option>
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b',
                  fontSize: '0.75rem',
                }}
              >
                ▼
              </div>
            </div>
          </div>

          {/* Action Buttons: Login & Register */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 0',
                background: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e40af')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{
                padding: '10px 0',
                background: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e40af')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            >
              Register
            </button>
          </div>
        </form>

        {/* Forgot Password Link */}
        <div style={{ textAlign: 'center', marginTop: '22px' }}>
          <Link
            to="/forgot-password"
            style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#059669',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#047857')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#059669')}
          >
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}
