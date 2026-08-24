import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
      <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔍</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
          404 - Page Not Found
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
          The requested pharmaceutical route or resource does not exist on the platform ledger.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-primary btn-sm">
            ← Return to Home
          </Link>
          <Link to="/dashboard" className="btn btn-outline btn-sm">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
