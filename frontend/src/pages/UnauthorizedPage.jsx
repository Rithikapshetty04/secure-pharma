import React from 'react';
import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🚫</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>
          403 - Access Forbidden
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
          You do not have the required regulatory or organizational role permissions to access this pharmaceutical ledger workspace.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/dashboard" className="btn btn-primary btn-sm">
            ← Return to Dashboard
          </Link>
          <Link to="/" className="btn btn-outline btn-sm">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
