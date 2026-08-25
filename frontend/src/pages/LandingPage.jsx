import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import QRCodeScanner from '../components/QRCodeScanner';

export default function LandingPage() {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    orgType: 'MANUFACTURER',
    message: '',
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', orgType: 'MANUFACTURER', message: '' });
    }, 4000);
  };

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'radial-gradient(ellipse at 85% 20%, rgba(219, 234, 254, 0.45) 0%, rgba(248, 250, 252, 0.6) 50%, #ffffff 100%)',
          borderBottom: '1px solid #f1f5f9',
          paddingTop: '20px',
        }}
      >
        <div className="hero-wrapper">
          {/* Left Column: Headline, Description, Features & CTAs */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '9999px',
                padding: '6px 16px',
                fontSize: '0.8rem',
                color: '#1d4ed8',
                fontWeight: '700',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)',
              }}
            >
              <span className="live-dot"></span>
              <span>21 CFR PART 11 COMPLIANT TRUST PLATFORM</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 4.5vw, 3.5rem)',
                lineHeight: 1.12,
                fontWeight: '900',
                marginBottom: '20px',
                letterSpacing: '-0.035em',
                color: '#0f172a',
              }}
            >
              Building a Safer<br />
              Pharmaceutical<br />
              Supply Chain
            </h1>

            <p
              style={{
                fontSize: '1.05rem',
                color: '#475569',
                lineHeight: 1.6,
                maxWidth: '540px',
                marginBottom: '32px',
              }}
            >
              Secure Pharma uses advanced technology to verify licenses, track medicines, and ensure transparency at every step.
            </p>

            {/* Three Feature Highlight Badges */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '24px',
                flexWrap: 'wrap',
                marginBottom: '38px',
              }}
            >
              <div className="hero-feature-item">
                <div className="hero-icon-box">
                  {/* License Verification Icon */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>
                  License Verification
                </span>
              </div>

              <div className="hero-feature-item">
                <div className="hero-icon-box">
                  {/* Supply Chain Tracking Icon */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                    <circle cx="6" cy="15" r="1.5" />
                    <circle cx="12" cy="15" r="1.5" />
                    <circle cx="18" cy="15" r="1.5" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>
                  Supply Chain Tracking
                </span>
              </div>

              <div className="hero-feature-item">
                <div className="hero-icon-box">
                  {/* Tamper Proof Records Icon */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>
                  Tamper Proof Records
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/login"
                className="btn btn-pill btn-pill-outline"
                style={{
                  padding: '12px 32px',
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-pill btn-pill-primary"
                style={{
                  padding: '12px 32px',
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                }}
              >
                Register Your Organization
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Illustration matching design */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* Ambient Glow */}
            <div
              style={{
                position: 'absolute',
                width: '95%',
                height: '95%',
                background: 'radial-gradient(circle, rgba(147, 197, 253, 0.4) 0%, rgba(219, 234, 254, 0.2) 60%, transparent 80%)',
                filter: 'blur(32px)',
                zIndex: 0,
              }}
            />

            <div
              className="hero-image-container"
              style={{
                position: 'relative',
                zIndex: 1,
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px -12px rgba(37, 99, 235, 0.18), 0 10px 20px -5px rgba(15, 23, 42, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                background: '#ffffff',
                maxWidth: '560px',
                width: '100%',
              }}
            >
              <img
                src="/hero-shield.jpg"
                alt="Secure Pharma 3D Security Shield and Medicine Verification Illustration"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Public Verifier Module */}
      <section style={{ maxWidth: '900px', margin: '70px auto 0', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span className="badge badge-info" style={{ marginBottom: '10px' }}>Instant Verification Tool</span>
          <h2 style={{ fontSize: '2rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Verify Any Pharmaceutical Batch in Real Time
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px', maxWidth: '600px', margin: '6px auto 0' }}>
            Scan a box QR code or enter a production batch identifier to inspect verified credentials, temperature compliance, and custodial history.
          </p>
        </div>
        <QRCodeScanner />
      </section>

      {/* Features Section */}
      <section id="features" style={{ maxWidth: '1200px', margin: '90px auto 0', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="badge badge-info" style={{ marginBottom: '10px' }}>Core Capabilities</span>
          <h2 style={{ fontSize: '2.2rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.02em' }}>
            End-to-End Digital Trust Architecture
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '8px', maxWidth: '650px', margin: '8px auto 0' }}>
            Built specifically to eliminate counterfeit medicines and unauthorized distribution channels with cryptographic certainty.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          <div className="glass-card" style={{ padding: '28px', background: '#ffffff', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px', color: '#2563eb' }}>
              📜
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#1e3a8a' }}>Mandatory License Verification</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              Organizations cannot mint or transfer pharmaceuticals without verified state and federal regulatory licenses and authenticated document hashing.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px', background: '#ffffff', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px', color: '#2563eb' }}>
              🔒
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#1e3a8a' }}>Unique QR Serialization</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              Every production batch is assigned a tamper-evident cryptographic QR identifier. Public scanning verifies legitimacy without leaking sensitive credentials.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px', background: '#ffffff', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px', color: '#2563eb' }}>
              ⛓️
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#1e3a8a' }}>Immutable Custodial Handovers</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              Track shipments from cleanroom manufacturing to wholesale distributors and final dispensing pharmacies with geo-located, timestamped proofs.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px', background: '#ffffff', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px', color: '#059669' }}>
              ❄️
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#065f46' }}>Cold Chain & IoT Telemetry</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              Integrate IoT sensor data for sensitive biologics and vaccines. Any temperature breach triggers immediate alerts before dispensing.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px', background: '#ffffff', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px', color: '#7c3aed' }}>
              📋
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#5b21b6' }}>21 CFR Part 11 Audit Trail</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              Complete regulatory audit logs with SHA-256 cryptographic chaining, ensuring zero unauthorized retrospective modifications.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '28px', background: '#ffffff', borderRadius: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '16px', color: '#dc2626' }}>
              🚨
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#991b1b' }}>Instant Counterfeit Interception</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              Automated anomaly algorithms flag duplicate scans, out-of-sequence handoffs, and expired license attempts in milliseconds.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        style={{
          maxWidth: '1200px',
          margin: '100px auto 0',
          padding: '40px 24px',
          background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '12px' }}>About Secure Pharma</span>
            <h2 style={{ fontSize: '2.2rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '20px' }}>
              Pioneering Integrity in Global Medicine Supply
            </h2>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.7, marginBottom: '16px' }}>
              According to the World Health Organization, 1 in 10 medical products in developing nations is substandard or falsified. Secure Pharma bridges the gap between pharmaceutical manufacturers, logistics providers, pharmacies, and regulatory authorities.
            </p>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: 1.7, marginBottom: '24px' }}>
              By embedding cryptographic proofs into everyday workflows, we make it impossible for illicit products to enter legitimate commercial streams without detection.
            </p>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ borderLeft: '3px solid #2563eb', paddingLeft: '14px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a8a' }}>FDA DSCSA</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Interoperable Tracing Compliant</div>
              </div>
              <div style={{ borderLeft: '3px solid #059669', paddingLeft: '14px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#065f46' }}>EU FMD</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Unique Identifier Verification</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px', background: '#ffffff' }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e3a8a', marginBottom: '6px' }}>
                🛡️ For Regulatory Authorities
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Instant real-time audits, license issuance controls, batch recall broadcasting, and automated non-compliance investigations.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '20px', background: '#ffffff' }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e3a8a', marginBottom: '6px' }}>
                🏭 For Pharmaceutical Manufacturers
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Cryptographic batch minting, automated GS1 QR code generation, direct digital chain-of-custody transfer to approved distributors.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '20px', background: '#ffffff' }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e3a8a', marginBottom: '6px' }}>
                🏥 For Pharmacies & Patients
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Simple barcode / QR scanning at point-of-sale to assure patients with unforgeable digital certificates of authenticity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ maxWidth: '850px', margin: '90px auto 0', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="badge badge-info" style={{ marginBottom: '10px' }}>Get In Touch</span>
          <h2 style={{ fontSize: '2.2rem', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.02em' }}>
            Connect Your Organization
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '8px' }}>
            Ready to integrate your enterprise ERP/WMS with Secure Pharma? Request an onboarding consultation.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '36px', background: '#ffffff', borderRadius: '20px' }}>
          {contactSubmitted ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
              <h3 style={{ fontSize: '1.4rem', color: '#059669', marginBottom: '8px' }}>Inquiry Received Successfully</h3>
              <p style={{ color: '#475569', fontSize: '0.95rem' }}>
                A Secure Pharma solutions specialist will reach out to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@pharmaceuticals.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Organization Type
                </label>
                <select
                  value={contactForm.orgType}
                  onChange={(e) => setContactForm({ ...contactForm, orgType: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '0.9rem' }}
                >
                  <option value="MANUFACTURER">Pharmaceutical Manufacturer</option>
                  <option value="DISTRIBUTOR">Wholesale Distributor / 3PL Logistics</option>
                  <option value="PHARMACY">Hospital / Retail Pharmacy Dispensary</option>
                  <option value="REGULATOR">FDA / State Health Regulatory Agency</option>
                  <option value="OTHER">Healthcare Technology Partner</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Message / Integration Requirements
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your batch tracking volumes or compliance timeline..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-pill btn-pill-primary"
                style={{ padding: '14px 28px', fontSize: '1rem', marginTop: '8px' }}
              >
                Send Partnership Request
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: '100px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: '50px 24px 40px',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L4 5.5V11.5C4 16.5 7.5 21.1 12 22.5C16.5 21.1 20 16.5 20 11.5V5.5L12 2Z"
                  fill="white"
                  fillOpacity="0.25"
                  stroke="white"
                  strokeWidth="2"
                />
                <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2.5" />
              </svg>
            </div>
            <span style={{ fontWeight: '800', fontSize: '1.15rem', color: '#1e3a8a' }}>
              Secure Pharma
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <a href="#features" className="nav-link-custom" style={{ fontSize: '0.85rem' }}>Features</a>
            <a href="#about" className="nav-link-custom" style={{ fontSize: '0.85rem' }}>About</a>
            <a href="#contact" className="nav-link-custom" style={{ fontSize: '0.85rem' }}>Contact</a>
            <Link to="/login" className="nav-link-custom" style={{ fontSize: '0.85rem' }}>Sign In</Link>
            <Link to="/register" className="nav-link-custom" style={{ fontSize: '0.85rem' }}>Register</Link>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            © {new Date().getFullYear()} Secure Pharma. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
