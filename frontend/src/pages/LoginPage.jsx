import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
  KeyRound,
  FileCheck,
  Loader2,
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('mfg@apexbiopharma.com');
  const [password, setPassword] = useState('Mfg@123456');
  const [selectedRole, setSelectedRole] = useState('MANUFACTURER');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const demoAccounts = [
    { role: 'MANUFACTURER', label: 'Manufacturer', email: 'mfg@apexbiopharma.com', pass: 'Mfg@123456', icon: '🏭' },
    { role: 'DISTRIBUTOR', label: 'Distributor', email: 'logistics@novalog.com', pass: 'Dist@123456', icon: '🚚' },
    { role: 'PHARMACY', label: 'Pharmacy', email: 'care@medlifepharma.com', pass: 'Pharm@123456', icon: '💊' },
    { role: 'ADMIN', label: 'Admin', email: 'superadmin@securepharma.gov', pass: 'SuperAdmin@123456', icon: '🛡️' },
  ];

  const handleSelectDemo = (account) => {
    setSelectedRole(account.role);
    setEmail(account.email);
    setPassword(account.pass);
    setError(null);
    setFieldErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        const targetPath = (from && from !== '/dashboard') ? from : (res.dashboardPath || '/manufacturer/dashboard');
        navigate(targetPath, { replace: true });
      } else {
        if (res.accountStatus === 'PENDING' || res.accountStatus === 'UNDER_REVIEW') {
          navigate(`/pending-verification?userId=${res.userId || ''}&email=${encodeURIComponent(email)}`);
        } else if (res.accountStatus === 'REJECTED') {
          setError('Your organization account registration was rejected by regulatory authorities. Please contact support.');
        } else {
          setError(res.message || 'Invalid credentials. Please verify your email and password.');
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to Secure Pharma authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      alignItems: 'stretch',
      background: '#f8fafc',
    }}>
      {/* Left Column: Enterprise Branding & Trust Messaging (Desktop Only) */}
      <div
        style={{
          flex: '1 1 50%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="desktop-only-banner"
      >
        {/* Subtle Background Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
        }} />

        {/* Top Brand Info */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
            }}>
              <ShieldCheck style={{ width: '26px', height: '26px', color: '#ffffff' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff', display: 'block' }}>
                Secure Pharma
              </span>
              <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: '600', letterSpacing: '0.05em' }}>
                FEDERAL SUPPLY CHAIN REGISTRY
              </span>
            </div>
          </div>
        </div>

        {/* Hero Copy & Core Pillars */}
        <div style={{ position: 'relative', zIndex: 2, margin: '40px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(147, 197, 253, 0.3)',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#60a5fa',
            marginBottom: '20px',
          }}>
            <Sparkles style={{ width: '14px', height: '14px' }} />
            21 CFR Part 11 & DSCSA Compliant Provenance
          </div>

          <h1 style={{
            fontSize: '2.4rem',
            fontWeight: '900',
            lineHeight: 1.2,
            marginBottom: '16px',
            letterSpacing: '-0.02em',
            color: '#ffffff',
          }}>
            Protecting Pharmaceutical Integrity from Lab to Patient
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            maxWidth: '520px',
            marginBottom: '36px',
          }}>
            Integrated custodial traceability system connecting licensed Manufacturers, Distributors, and Pharmacies with end-to-end audit verification.
          </p>

          {/* Key Pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#34d399',
              }}>
                <CheckCircle2 style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Regulatory License Verification
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0' }}>
                  Audited onboarding for state-licensed pharmaceutical stakeholders.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#60a5fa',
              }}>
                <Layers style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Cryptographic Batch Provenance
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0' }}>
                  Serialized batch tracking with immutable transfer signatures.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f59e0b',
              }}>
                <FileCheck style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Instant QR Authenticity Scan
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0' }}>
                  Real-time verification against counterfeit or recalled medicine lots.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          Secure Pharma Infrastructure v2.4 • Authorized Personnel Only
        </div>
      </div>

      {/* Right Column: Modern Enterprise Login Form */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: '#ffffff',
      }}>
        <div style={{ maxWidth: '440px', width: '100%' }}>
          {/* Mobile Header Branding */}
          <div className="mobile-only-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              boxShadow: '0 4px 15px rgba(29, 78, 216, 0.3)',
            }}>
              <ShieldCheck style={{ width: '28px', height: '28px', color: '#ffffff' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Secure Pharma
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
              Pharmaceutical Traceability Portal
            </p>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Sign in to Portal
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Enter your corporate credentials to access your entity dashboard
            </p>
          </div>

          {/* Quick Demo Role Selector Pills */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb', letterSpacing: '0.05em' }}>
                DEMO ROLE SHORTCUTS
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Select to fill credentials</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
            }}>
              {demoAccounts.map((acc) => {
                const isSelected = selectedRole === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      color: isSelected ? '#1e40af' : '#475569',
                      fontWeight: isSelected ? '700' : '600',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{acc.icon}</span>
                    <span>{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Error Alert Banner */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.875rem',
              marginBottom: '20px',
              lineHeight: 1.4,
            }}>
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#334155',
                marginBottom: '6px',
              }}>
                Corporate Email Address
              </label>

              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: fieldErrors.email ? '#ef4444' : '#94a3b8',
                  pointerEvents: 'none',
                  display: 'flex',
                }}>
                  <Mail style={{ width: '18px', height: '18px' }} />
                </div>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                  }}
                  placeholder="name@organization.com"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '8px',
                    border: `1px solid ${fieldErrors.email ? '#f87171' : '#cbd5e1'}`,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    background: fieldErrors.email ? '#fef2f2' : '#ffffff',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: fieldErrors.email ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
                  }}
                />
              </div>

              {fieldErrors.email && (
                <div style={{ fontSize: '0.775rem', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#334155',
                }}>
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: '#2563eb',
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </Link>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: fieldErrors.password ? '#ef4444' : '#94a3b8',
                  pointerEvents: 'none',
                  display: 'flex',
                }}>
                  <Lock style={{ width: '18px', height: '18px' }} />
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                  }}
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '11px 40px 11px 40px',
                    borderRadius: '8px',
                    border: `1px solid ${fieldErrors.password ? '#f87171' : '#cbd5e1'}`,
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    background: fieldErrors.password ? '#fef2f2' : '#ffffff',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: fieldErrors.password ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff style={{ width: '18px', height: '18px' }} />
                  ) : (
                    <Eye style={{ width: '18px', height: '18px' }} />
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <div style={{ fontSize: '0.775rem', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* Remember Me Option */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  accentColor: '#2563eb',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                Remember session on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '8px',
                background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.15s ease',
                marginTop: '4px',
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                  <span>Authenticating credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </>
              )}
            </button>
          </form>

          {/* Registration Footer */}
          <div style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#64748b',
          }}>
            Don't have a registered pharmaceutical account?{' '}
            <Link
              to="/register"
              style={{
                color: '#2563eb',
                fontWeight: '700',
                textDecoration: 'none',
              }}
            >
              Register Entity →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

