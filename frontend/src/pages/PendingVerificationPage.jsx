import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function PendingVerificationPage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const userIdParam = searchParams.get('userId') || '';
  const registeredFlag = searchParams.get('registered') === 'true';

  const [emailInput, setEmailInput] = useState(emailParam);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async (targetEmail, targetId) => {
    if (!targetEmail && !targetId) return;
    setLoading(true);
    setError(null);

    try {
      const query = targetId ? { userId: targetId } : { email: targetEmail };
      const res = await api.getVerificationStatus(query);
      if (res.success) {
        setStatusData(res);
      } else {
        setError(res.message || 'Status query failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to fetch verification status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (emailParam || userIdParam) {
      fetchStatus(emailParam, userIdParam);
    }
  }, [emailParam, userIdParam]);

  return (
    <div style={{ maxWidth: '680px', margin: '40px auto 60px', padding: '0 20px' }}>
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 16px',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)',
          }}
        >
          ⏳
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>
          Registration Awaiting Regulatory Verification
        </h2>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '28px' }}>
          {registeredFlag
            ? 'Your registration has been submitted successfully and is awaiting license verification by authorized pharmaceutical regulators.'
            : 'Your organization account is currently undergoing compliance review.'}
        </p>

        {/* Lookup Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
            CHECK LIVE APPLICATION STATUS
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchStatus(emailInput, null);
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your registered email address..."
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                fontSize: '0.85rem',
              }}
            />
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </form>
        </div>

        {error && (
          <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Live Status Result */}
        {statusData && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            textAlign: 'left',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{statusData.organization?.name || statusData.name}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{statusData.email}</div>
              </div>
              <StatusBadge status={statusData.accountStatus} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '12px',
              fontSize: '0.85rem',
            }}>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>ORGANIZATION TYPE</span>
                <strong>{statusData.organization?.type || statusData.role}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>LICENSE NUMBER</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{statusData.license?.licenseNumber || 'Submitted'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'block' }}>LICENSE STATUS</span>
                <StatusBadge status={statusData.license?.verificationStatus || statusData.accountStatus} />
              </div>
            </div>

            {statusData.rejectionReason && (
              <div style={{
                marginTop: '14px',
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderLeft: '3px solid #ef4444',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}>
                <strong>Rejection Reason:</strong> {statusData.rejectionReason}
              </div>
            )}

            {statusData.accountStatus === 'APPROVED' && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
              }}>
                <div style={{ color: '#10b981', fontWeight: '700', marginBottom: '8px' }}>
                  🎉 Your organization and license have been APPROVED!
                </div>
                <Link to="/login" className="btn btn-primary btn-sm">
                  Sign In to Your Dashboard
                </Link>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-outline btn-sm">
            ← Return to Home
          </Link>
          <Link to="/login" className="btn btn-outline btn-sm">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
