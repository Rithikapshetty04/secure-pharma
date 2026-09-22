import React, { useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  KeyRound,
  ArrowLeft,
  Check,
} from 'lucide-react';

export default function ResetPasswordPage() {
  const { tokenParam } = useParams();
  const [searchParams] = useSearchParams();
  const urlToken = tokenParam || searchParams.get('token') || '';

  const [tokenInput, setTokenInput] = useState(urlToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isTokenExpiredError, setIsTokenExpiredError] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const navigate = useNavigate();

  const isPasswordValidLength = newPassword.length >= 6;
  const isPasswordMatch = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  const validateForm = () => {
    const errors = {};

    if (!tokenInput.trim()) {
      errors.token = 'Reset authorization token is required.';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setIsTokenExpiredError(false);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await api.resetPassword(tokenInput.trim(), newPassword);
      if (res && res.success) {
        setResetSuccess(true);
      } else {
        const errMsg = res?.message || 'Password reset failed.';
        setGeneralError(errMsg);
        if (errMsg.toLowerCase().includes('invalid') || errMsg.toLowerCase().includes('expired')) {
          setIsTokenExpiredError(true);
        }
      }
    } catch (err) {
      const errMsg = err.message || 'Unable to process request.';
      setGeneralError(errMsg);
      if (errMsg.toLowerCase().includes('invalid') || errMsg.toLowerCase().includes('expired')) {
        setIsTokenExpiredError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'stretch', background: '#f8fafc' }}>
      {/* Left Column: Branding Banner */}
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
            Set New Account Password
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '32px' }}>
            Update your access credentials using your verified password reset authorization token.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'SHA-256 Hashing Verification',
              'Immediate Session Invalidation',
              'Secure Account Credential Update',
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
          SecurePharma Medical Portal • Credential Management
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
            {resetSuccess ? (
              /* Success View */
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
                  Password Updated Successfully
                </h2>

                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  Your password has been changed. You can now sign in using your new password.
                </p>

                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '12px 18px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                  }}
                >
                  <span>Sign In to Account</span>
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </Link>
              </div>
            ) : isTokenExpiredError ? (
              /* Token Expired / Invalid View */
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <AlertCircle style={{ width: '36px', height: '36px' }} />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  Reset link unavailable
                </h2>

                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  This password reset link is invalid or has expired. Please request a new link to continue.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link
                    to="/forgot-password"
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px 18px',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                    }}
                  >
                    <span>Request New Reset Link</span>
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </Link>

                  <Link
                    to="/login"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: '#64748b',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      marginTop: '4px',
                    }}
                  >
                    <ArrowLeft style={{ width: '16px', height: '16px' }} />
                    Return to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              /* Reset Password Form */
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
                    <KeyRound style={{ width: '22px', height: '22px' }} />
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    Reset your password
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                    Create a new password for your SecurePharma account.
                  </p>
                </div>

                {generalError && (
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
                    <div>{generalError}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Reset Token Input (Hidden/Read-only if passed in URL, or editable if manually entered) */}
                  {!urlToken && (
                    <div>
                      <label
                        htmlFor="tokenInput"
                        style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}
                      >
                        Reset Authorization Token *
                      </label>
                      <input
                        id="tokenInput"
                        type="text"
                        value={tokenInput}
                        onChange={(e) => {
                          setTokenInput(e.target.value);
                          if (fieldErrors.token) setFieldErrors({ ...fieldErrors, token: null });
                        }}
                        placeholder="Paste security reset token"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.token ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.85rem',
                          fontFamily: 'monospace',
                          color: '#0f172a',
                          outline: 'none',
                        }}
                      />
                      {fieldErrors.token && (
                        <div style={{ fontSize: '0.775rem', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>
                          {fieldErrors.token}
                        </div>
                      )}
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}
                    >
                      New password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: fieldErrors.newPassword ? '#ef4444' : '#94a3b8',
                          pointerEvents: 'none',
                          display: 'flex',
                        }}
                      >
                        <Lock style={{ width: '18px', height: '18px' }} />
                      </div>
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: null });
                        }}
                        placeholder="Min. 6 characters"
                        style={{
                          width: '100%',
                          padding: '11px 40px 11px 40px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.newPassword ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.9rem',
                          color: '#0f172a',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                      >
                        {showNewPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                      </button>
                    </div>
                    {fieldErrors.newPassword && (
                      <div style={{ fontSize: '0.775rem', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>
                        {fieldErrors.newPassword}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}
                    >
                      Confirm password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: fieldErrors.confirmPassword ? '#ef4444' : '#94a3b8',
                          pointerEvents: 'none',
                          display: 'flex',
                        }}
                      >
                        <Lock style={{ width: '18px', height: '18px' }} />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null });
                        }}
                        placeholder="Re-enter password"
                        style={{
                          width: '100%',
                          padding: '11px 40px 11px 40px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.confirmPassword ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.9rem',
                          color: '#0f172a',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                        }}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <div style={{ fontSize: '0.775rem', color: '#dc2626', marginTop: '4px', fontWeight: '500' }}>
                        {fieldErrors.confirmPassword}
                      </div>
                    )}
                  </div>

                  {/* Password Checklist */}
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isPasswordValidLength ? '#059669' : '#64748b' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: isPasswordValidLength ? '#059669' : '#cbd5e1' }} />
                      <span>Minimum 6 characters</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isPasswordMatch ? '#059669' : '#64748b' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: isPasswordMatch ? '#059669' : '#cbd5e1' }} />
                      <span>Passwords match</span>
                    </div>
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
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight style={{ width: '16px', height: '16px' }} />
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
                    <Link to="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
                      ← Back to Sign In
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
