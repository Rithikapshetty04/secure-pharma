import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  Lock,
  ArrowLeft,
  Check,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [emailError, setEmailError] = useState(null);

  const validateEmail = (val) => {
    if (!val.trim()) {
      return 'Email address is required.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
      return 'Please enter a valid email address.';
    }
    return null;
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (emailError) {
      setEmailError(null);
    }
    if (errorMsg) {
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessState(null);

    const validationErr = validateEmail(email);
    if (validationErr) {
      setEmailError(validationErr);
      return;
    }

    setLoading(true);

    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      if (res && res.success) {
        setSuccessState({
          message: res.message || 'If an account is associated with this email address, password-reset instructions will be sent.',
          resetToken: res.resetToken || null,
          email: email.trim().toLowerCase(),
        });
      } else {
        setErrorMsg(res?.message || 'Unable to process password reset request. Please check your network connection.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to SecurePharma servers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'stretch', background: '#f8fafc' }}>
      {/* Left Column: Branding Banner (Desktop Only) */}
      <div
        className="desktop-only-banner"
        style={{
          flex: '1 1 40%',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e3a8a 60%, #0369a1 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        <div>
          {/* Logo Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <ShieldCheck style={{ width: '24px', height: '24px', color: '#ffffff' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ffffff', display: 'block', letterSpacing: '-0.02em' }}>
                SecurePharma
              </span>
              <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: '600', letterSpacing: '0.04em' }}>
                Medical Supply Chain Network
              </span>
            </div>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', lineHeight: 1.3, marginBottom: '14px', color: '#ffffff' }}>
            Account Password Recovery
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '32px' }}>
            Request secure reset authorization for your credentialed pharmaceutical account.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Timed Security Reset Tokens',
              'Privacy-Protected Email Dispatch',
              'Audit-Logged Security Verification',
            ].map((text, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.25)',
                    border: '1px solid #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                  }}
                >
                  <Check style={{ width: '14px', height: '14px' }} />
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: '500', color: '#e2e8f0' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
          SecurePharma Medical Portal • Account Security Policy
        </div>
      </div>

      {/* Right Column: Main Content Container */}
      <div
        style={{
          flex: '1 1 60%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: '460px', width: '100%' }}>
          {/* Mobile Header Branding */}
          <div className="mobile-only-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck style={{ width: '20px', height: '20px', color: '#ffffff' }} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                SecurePharma
              </span>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '36px 32px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            {successState ? (
              /* Success State View */
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <CheckCircle2 style={{ width: '36px', height: '36px', color: '#ffffff' }} />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  Password Reset Request Submitted
                </h2>

                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  If an account is associated with <strong>{successState.email}</strong>, you will receive instructions to reset your password.
                </p>

                {/* Development Mode Direct Token Action Card */}
                {successState.resetToken && (
                  <div
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '24px',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px' }}>
                      <KeyRound style={{ width: '16px', height: '16px' }} />
                      Development Mode Authorization Link
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#1e3a8a', lineHeight: 1.5, marginBottom: '12px' }}>
                      A secure token has been generated. Use the link below to set your new account password:
                    </p>
                    <Link
                      to={`/reset-password?token=${successState.resetToken}`}
                      className="btn btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                      }}
                    >
                      <span>Proceed to Set New Password</span>
                      <ArrowRight style={{ width: '16px', height: '16px' }} />
                    </Link>
                  </div>
                )}

                <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <Link
                    to="/login"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#2563eb',
                      fontWeight: '700',
                      fontSize: '0.88rem',
                      textDecoration: 'none',
                    }}
                  >
                    <ArrowLeft style={{ width: '16px', height: '16px' }} />
                    Return to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              /* Request Form View */
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Lock style={{ width: '22px', height: '22px' }} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    Forgot your password?
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                    Enter the email address associated with your SecurePharma account to receive password reset instructions.
                  </p>
                </div>

                {errorMsg && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px 14px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      color: '#991b1b',
                      fontSize: '0.85rem',
                      marginBottom: '20px',
                      lineHeight: 1.4,
                    }}
                    role="alert"
                  >
                    <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                    <div>{errorMsg}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label
                      htmlFor="forgotEmail"
                      style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}
                    >
                      Email address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: emailError ? '#ef4444' : '#94a3b8',
                          pointerEvents: 'none',
                          display: 'flex',
                        }}
                      >
                        <Mail style={{ width: '18px', height: '18px' }} />
                      </div>
                      <input
                        id="forgotEmail"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        onBlur={() => {
                          if (email) setEmailError(validateEmail(email));
                        }}
                        placeholder="name@organization.com"
                        aria-invalid={Boolean(emailError)}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '8px',
                          border: `1px solid ${emailError ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.9rem',
                          color: '#0f172a',
                          background: emailError ? '#fef2f2' : '#ffffff',
                          outline: 'none',
                          boxShadow: emailError ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
                        }}
                      />
                    </div>
                    {emailError && (
                      <div style={{ fontSize: '0.775rem', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>
                        {emailError}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.8 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        <span>Sending Reset Instructions...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Instructions</span>
                        <ArrowRight style={{ width: '16px', height: '16px' }} />
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
                    Remember your password?{' '}
                    <Link to="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
                      Sign in
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
