import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.resetPassword(token, newPassword);
      if (res.success) {
        alert('✓ Password reset successfully. Please sign in with your new credentials.');
        navigate('/login');
      } else {
        setErrorMsg(res.message || 'Reset failed.');
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
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔒</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '6px', color: '#1e293b' }}>
          Set New Password
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Enter the security authorization token and your new account password.
        </p>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: 'var(--radius-sm)', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
              RESET AUTHORIZATION TOKEN *
            </label>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste security reset token..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
              NEW PASSWORD (MIN 6 CHARS) *
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dim)' }}>
              CONFIRM NEW PASSWORD *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '12px' }}>
            {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
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
