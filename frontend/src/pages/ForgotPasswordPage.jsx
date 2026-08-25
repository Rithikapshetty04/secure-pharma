import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [resetToken, setResetToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setSuccessMsg(res.message);
        if (res.resetToken) {
          setResetToken(res.resetToken);
        }
      } else {
        setErrorMsg(res.message || 'Password reset request failed.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '36px', textAlign: 'center', background: '#ffffff' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔐</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '6px', color: '#1e293b' }}>
          Reset Account Password
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Enter your authorized organization email to generate a secure reset token.
        </p>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: 'var(--radius-sm)', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: 'var(--radius-sm)', color: '#047857', fontSize: '0.85rem', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontWeight: '600' }}>{successMsg}</p>
            {resetToken && (
              <div style={{ marginTop: '10px', textAlign: 'left', background: '#ffffff', padding: '8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Demo Direct Link:</span>
                <div style={{ marginTop: '4px' }}>
                  <Link to={`/reset-password?token=${resetToken}`} style={{ color: '#2563eb', fontWeight: '700', fontSize: '0.8rem' }}>
                    Click here to set new password →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
              OFFICIAL EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mfg@apexbiopharma.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px' }}>
            {loading ? 'Generating Token...' : 'Send Password Reset Request'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.85rem' }}>
          <Link to="/login" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
