import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(email);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.message || 'Request failed.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔑</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Reset Password</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enter your authorized email to generate a password reset authorization
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        {result ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: 'var(--radius-sm)', padding: '16px', color: '#6ee7b7', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontWeight: '700', marginBottom: '6px' }}>✓ Password Reset Generated</div>
            <p style={{ color: '#fff', fontSize: '0.8rem', marginBottom: '10px' }}>
              In this environment, use the reset token below to configure a new password:
            </p>
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', wordBreak: 'break-all', marginBottom: '12px' }}>
              {result.resetToken || 'TOKEN_SENT'}
            </div>
            {result.resetToken && (
              <Link to={`/reset-password?token=${result.resetToken}`} className="btn btn-primary btn-sm">
                Proceed to Reset Password →
              </Link>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                ACCOUNT EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. mfg@apexbiopharma.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              {loading ? 'Processing...' : 'Request Password Reset'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
          <Link to="/login" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
