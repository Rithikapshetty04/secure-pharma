import React, { useState } from 'react';
import { api } from '../api';

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onLoginSuccess,
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'status'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    organizationType: 'MANUFACTURER',
    licenseNumber: '',
    licenseType: 'MANUFACTURING',
    address: '',
  });
  const [licenseFile, setLicenseFile] = useState(null);

  // Status check state
  const [statusEmail, setStatusEmail] = useState('');
  const [statusResult, setStatusResult] = useState(null);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(loginEmail, loginPassword);
      if (data.success && data.token) {
        localStorage.setItem('securepharma_token', data.token);
        onLoginSuccess(data.user);
        onClose();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    let email = '';
    let pass = 'Admin@123456';

    if (role === 'ADMIN') {
      email = 'admin@securepharma.gov';
      pass = 'Admin@123456';
    } else if (role === 'MANUFACTURER') {
      email = 'mfg@apexbiopharma.com';
      pass = 'Mfg@123456';
    } else if (role === 'DISTRIBUTOR') {
      email = 'logistics@novalog.com';
      pass = 'Dist@123456';
    } else if (role === 'PHARMACY') {
      email = 'care@medlifepharma.com';
      pass = 'Pharm@123456';
    }

    setLoginEmail(email);
    setLoginPassword(pass);

    setLoading(true);
    setError('');
    try {
      const data = await api.login(email, pass);
      if (data.success && data.token) {
        localStorage.setItem('securepharma_token', data.token);
        onLoginSuccess(data.user);
        onClose();
      } else {
        setError(data.message || 'Demo account not seeded yet. Register a new entity or seed admin.');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!licenseFile) {
      setError('Please upload your official regulatory license document (.pdf, .png, or .jpg)');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', regForm.name);
      formData.append('email', regForm.email);
      formData.append('password', regForm.password);
      formData.append('organizationName', regForm.organizationName);
      formData.append('organizationType', regForm.organizationType);
      formData.append('licenseNumber', regForm.licenseNumber);
      formData.append('licenseType', regForm.licenseType);
      formData.append('address', regForm.address);
      formData.append('licenseDocument', licenseFile);

      const res = await api.register(formData);
      if (res.success) {
        setSuccessMsg('Registration submitted! Your license is pending regulatory verification.');
        setTimeout(() => {
          setMode('status');
          setStatusEmail(regForm.email);
          handleCheckStatus(regForm.email);
        }, 1500);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Network error while submitting registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (emailToCheck) => {
    const queryEmail = emailToCheck || statusEmail;
    if (!queryEmail) return;

    setLoading(true);
    setError('');
    setStatusResult(null);

    try {
      const res = await api.getVerificationStatus({ email: queryEmail });
      if (res.success) {
        setStatusResult(res);
      } else {
        setError(res.message || 'No verification records found.');
      }
    } catch (err) {
      setError('Failed to query status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>
              {mode === 'login' && 'Entity Access Portal'}
              {mode === 'register' && 'Register Pharmaceutical Entity'}
              {mode === 'status' && 'License Verification Tracker'}
            </h2>
            <p style={{ fontSize: '0.85rem' }}>Secure Pharma Regulatory Supply Ledger</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
        }}>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`btn btn-sm ${mode === 'register' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
          >
            Register Entity
          </button>
          <button
            onClick={() => { setMode('status'); setError(''); }}
            className={`btn btn-sm ${mode === 'status' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1 }}
          >
            Check Status
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}>
            {successMsg}
          </div>
        )}

        {/* Mode: LOGIN */}
        {mode === 'login' && (
          <div>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Work / Officer Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@securepharma.gov"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Ledger'}
              </button>
            </form>

            {/* Quick Demo Fill Buttons */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '10px', textAlign: 'center' }}>
                QUICK ACCESS DEMO ROLES (1-CLICK SIGN IN)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('ADMIN')}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}
                >
                  🛡️ Regulatory Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('MANUFACTURER')}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                >
                  🏭 Manufacturer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('DISTRIBUTOR')}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc' }}
                >
                  🚚 Distributor
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('PHARMACY')}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: 'rgba(14, 165, 233, 0.4)', color: '#38bdf8' }}
                >
                  🏥 Pharmacy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mode: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.organizationName}
                  onChange={(e) => setRegForm({ ...regForm, organizationName: e.target.value })}
                  placeholder="e.g. Apex BioPharma Inc."
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Organization Type *
                </label>
                <select
                  value={regForm.organizationType}
                  onChange={(e) => {
                    const orgType = e.target.value;
                    let licType = 'MANUFACTURING';
                    if (orgType === 'DISTRIBUTOR') licType = 'WHOLESALE';
                    if (orgType === 'PHARMACY') licType = 'PHARMACY';
                    setRegForm({ ...regForm, organizationType: orgType, licenseType: licType });
                  }}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                >
                  <option value="MANUFACTURER">Manufacturer</option>
                  <option value="DISTRIBUTOR">Distributor / Wholesaler</option>
                  <option value="PHARMACY">Pharmacy / Dispenser</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Regulatory License Number *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.licenseNumber}
                  onChange={(e) => setRegForm({ ...regForm, licenseNumber: e.target.value })}
                  placeholder="e.g. MFG-FDA-99201"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  License Type *
                </label>
                <select
                  value={regForm.licenseType}
                  onChange={(e) => setRegForm({ ...regForm, licenseType: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                >
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="PHARMACY">Pharmacy</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Facility Physical Address
              </label>
              <input
                type="text"
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                placeholder="100 Pharma Blvd, Boston MA"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>

            {/* Officer Credentials */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Representative Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="Dr. Sarah Jenkins"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="sarah@apexbiopharma.com"
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Account Password *
              </label>
              <input
                type="password"
                required
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                placeholder="At least 6 characters"
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>

            {/* License File Upload Dropzone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Upload Regulatory License Certificate (PDF, PNG, JPG) *
              </label>
              <div style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                position: 'relative',
              }}>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => setLicenseFile(e.target.files[0])}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />
                {licenseFile ? (
                  <div style={{ color: '#34d399', fontWeight: '600', fontSize: '0.85rem' }}>
                    📄 {licenseFile.name} ({(licenseFile.size / 1024).toFixed(1)} KB)
                  </div>
                ) : (
                  <div>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" style={{ margin: '0 auto 6px' }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Click or drag & drop license document here
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Submitting Application...' : 'Submit License for Verification'}
            </button>
          </form>
        )}

        {/* Mode: STATUS TRACKER */}
        {mode === 'status' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="email"
                value={statusEmail}
                onChange={(e) => setStatusEmail(e.target.value)}
                placeholder="Enter registration email..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                }}
              />
              <button
                onClick={() => handleCheckStatus()}
                disabled={loading}
                className="btn btn-primary"
              >
                Check Status
              </button>
            </div>

            {statusResult && (
              <div className="glass-card" style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1rem' }}>{statusResult.name}</h3>
                  <span className={`badge ${
                    statusResult.accountStatus === 'APPROVED' ? 'badge-success' :
                    statusResult.accountStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {statusResult.accountStatus}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  Organization: <strong>{statusResult.organization?.name}</strong> ({statusResult.role})
                </p>
                <p style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                  License #: <code style={{ color: 'var(--accent-cyan)' }}>{statusResult.license?.licenseNumber}</code>
                </p>
                {statusResult.verificationRemarks && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '8px' }}>
                    Remarks: "{statusResult.verificationRemarks}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
