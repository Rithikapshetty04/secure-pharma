import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function PendingVerificationPage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const registered = searchParams.get('registered') === 'true';

  const [emailInput, setEmailInput] = useState(emailParam);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async (emailToFetch) => {
    if (!emailToFetch) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getVerificationStatus({ email: emailToFetch });
      if (res.success) {
        setStatusData(res);
      } else {
        setError(res.message || 'Status query failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to check verification status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (emailParam) {
      fetchStatus(emailParam);
    }
  }, [emailParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStatus(emailInput);
  };

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div className="glass-card" style={{ maxWidth: '640px', width: '100%', padding: '40px', textAlign: 'center', background: '#ffffff' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          margin: '0 auto 16px',
          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
        }}>
          ⏳
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '8px', color: '#1e293b' }}>
          {registered ? 'Registration Submitted Successfully' : 'Verification Under Review'}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
          Your pharmaceutical organization credentials and uploaded regulatory license are currently being audited by regulatory authorities.
        </p>

        {/* Live Status Card */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '24px',
            fontSize: '0.85rem',
          }}>
            <strong>Notice:</strong> {error}
          </div>
        )}

        {statusData && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            textAlign: 'left',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1e3a8a' }}>
                {statusData.organizationName || 'Registered Entity'}
              </span>
              <StatusBadge status={statusData.accountStatus} />
            </div>

            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>License Status: </span>
                <StatusBadge status={statusData.licenseStatus || 'PENDING'} />
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Authorized User: </span>
                <strong style={{ color: 'var(--text-heading)' }}>{statusData.name} ({statusData.email})</strong>
              </div>
              {statusData.rejectionReason && (
                <div style={{ color: '#dc2626', marginTop: '6px', background: '#fef2f2', padding: '8px', borderRadius: '4px' }}>
                  <strong>Rejection Reason:</strong> {statusData.rejectionReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search for status */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input
            type="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="Enter registered email to check status..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
            }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
            {loading ? 'Checking...' : 'Refresh Status'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-outline btn-sm">
            ← Return to Sign In
          </Link>
          <Link to="/" className="btn btn-outline btn-sm">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
