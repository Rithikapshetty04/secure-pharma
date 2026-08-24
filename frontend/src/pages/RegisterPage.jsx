import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationType: 'MANUFACTURER',
    licenseNumber: '',
    licenseType: 'MANUFACTURING',
    address: '',
    contactPhone: '',
  });

  const [licenseFile, setLicenseFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleOrgTypeChange = (type) => {
    let defaultLicenseType = 'MANUFACTURING';
    if (type === 'DISTRIBUTOR') defaultLicenseType = 'WHOLESALE';
    if (type === 'PHARMACY') defaultLicenseType = 'PHARMACY';

    setFormData({
      ...formData,
      organizationType: type,
      licenseType: defaultLicenseType,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!licenseFile) {
      setError('Official regulatory license document (.pdf, .jpg, .png) is required.');
      return;
    }

    const payload = new FormData();
    Object.keys(formData).forEach((key) => {
      payload.append(key, formData[key]);
    });
    payload.append('licenseDocument', licenseFile);

    setLoading(true);

    try {
      const res = await register(payload);
      if (res.success) {
        navigate(`/pending-verification?email=${encodeURIComponent(formData.email)}&registered=true`);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '740px',
      margin: '40px auto 60px',
      padding: '0 20px',
    }}>
      <div className="glass-card" style={{ padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              margin: '0 auto 12px',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)',
            }}
          >
            📜
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '6px' }}>
            Pharmaceutical Entity Registration
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Submit regulatory documentation for state & federal license verification
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '20px',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Organization */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', marginBottom: '14px', letterSpacing: '0.04em' }}>
              1. ORGANIZATION DETAILS
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  ORGANIZATION LEGAL NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder="e.g. BioGen Pharma Labs Ltd."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  ORGANIZATION TYPE *
                </label>
                <select
                  value={formData.organizationType}
                  onChange={(e) => handleOrgTypeChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="MANUFACTURER">Pharmaceutical Manufacturer</option>
                  <option value="DISTRIBUTOR">Wholesale Distributor</option>
                  <option value="PHARMACY">Retail / Hospital Pharmacy</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  HEADQUARTERS / FACILITY ADDRESS
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 500 Technology Way, Boston MA 02110"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Regulatory License */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#10b981', marginBottom: '14px', letterSpacing: '0.04em' }}>
              2. PHARMACEUTICAL LICENSE & PROOF
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  OFFICIAL LICENSE NUMBER *
                </label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="e.g. MFG-FDA-2026-991"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  LICENSE CLASSIFICATION *
                </label>
                <select
                  value={formData.licenseType}
                  onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="MANUFACTURING">Pharmaceutical Manufacturing License (cGMP)</option>
                  <option value="WHOLESALE">Wholesale Drug Distributor License (GDP)</option>
                  <option value="PHARMACY">State Pharmacy Dispensing License</option>
                  <option value="IMPORT_EXPORT">International Import / Export Permit</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  UPLOAD REGULATORY LICENSE DOCUMENT (PDF, JPG, PNG - MAX 5MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setLicenseFile(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px dashed var(--accent-cyan)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                />
                {licenseFile && (
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
                    ✓ Attached: {licenseFile.name} ({(licenseFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Authorized Administrator */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.9rem', color: '#a855f7', marginBottom: '14px', letterSpacing: '0.04em' }}>
              3. AUTHORIZED REPRESENTATIVE CREDENTIALS
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Doe"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  OFFICIAL EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. compliance@biogen.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  PASSWORD (MIN 6 CHARS) *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  CONFIRM PASSWORD *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          >
            {loading ? 'Submitting Registration to Regulatory Board...' : 'Submit Registration Application'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: '600', textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
