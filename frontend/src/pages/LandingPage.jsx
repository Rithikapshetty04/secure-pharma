import React from 'react';
import { Link } from 'react-router-dom';
import QRCodeScanner from '../components/QRCodeScanner';

export default function LandingPage() {
  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Hero Section */}
      <section style={{
        padding: '60px 20px 40px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at top, rgba(0, 242, 254, 0.12), transparent 70%)',
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '999px',
            padding: '6px 16px',
            fontSize: '0.8rem',
            color: 'var(--accent-cyan)',
            fontWeight: '600',
            marginBottom: '24px',
          }}>
            <span className="live-dot"></span>
            <span>21 CFR PART 11 COMPLIANT TRUST PLATFORM</span>
          </div>

          <h1 style={{
            fontSize: '2.8rem',
            lineHeight: 1.15,
            fontWeight: '900',
            marginBottom: '20px',
            letterSpacing: '-0.03em',
          }}>
            Immutable Pharmaceutical <br />
            <span style={{
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Supply Chain & License Verification
            </span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            maxWidth: '650px',
            margin: '0 auto 36px',
          }}>
            Eliminating counterfeit medicines, unauthorized distribution, and fake licenses through cryptographic batch serialization, QR-code authentication, and regulatory digital trust.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              🛡️ Register Pharmaceutical Entity
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Public Verifier Module */}
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <QRCodeScanner />
        </div>
      </section>

      {/* Network Live Stats */}
      <section style={{ maxWidth: '1100px', margin: '40px auto 0', padding: '0 20px' }}>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>100%</div>
            <div className="stat-label">Cryptographic Provenance</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>SHA-256 Chain-of-Custody</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#10b981' }}>9-Point</div>
            <div className="stat-label">Authenticity Verification</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Real-time FDA/State Validation</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f59e0b' }}>0 Delay</div>
            <div className="stat-label">Digital License Review</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Automated Expiry & Status Tracking</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#a855f7' }}>21 CFR</div>
            <div className="stat-label">Part 11 Audit Trail</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>Append-only Immutable Logs</div>
          </div>
        </div>
      </section>

      {/* Architecture Pillars */}
      <section style={{ maxWidth: '1100px', margin: '60px auto 0', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>End-to-End Digital Trust Architecture</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>
            Empowering regulatory authorities, manufacturers, wholesalers, and pharmacies.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📜</div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Mandatory License Verification</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Organizations cannot mint or transfer pharmaceuticals without verified state and federal regulatory licenses and authenticated document hashing.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Unique QR Serialization</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Every production batch is assigned a tamper-evident cryptographic QR identifier. Public scanning verifies legitimacy without leaking sensitive credentials.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⛓️</div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Immutable Custodial Handovers</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Track shipments from cleanroom manufacturing to wholesale distributors and final dispensing pharmacies with geo-located time-stamped proofs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
