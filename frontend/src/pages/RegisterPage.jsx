import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  ShieldCheck,
  Building2,
  Factory,
  Truck,
  Pill,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  FileCheck,
  UploadCloud,
  FileText,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react';

const STAKEHOLDER_ROLES = [
  {
    id: 'MANUFACTURER',
    label: 'Manufacturer',
    defaultLicenseType: 'MANUFACTURING',
    icon: Factory,
    badge: 'Pharma Plant',
  },
  {
    id: 'DISTRIBUTOR',
    label: 'Distributor',
    defaultLicenseType: 'WHOLESALE',
    icon: Truck,
    badge: 'Logistics',
  },
  {
    id: 'PHARMACY',
    label: 'Pharmacy',
    defaultLicenseType: 'PHARMACY',
    icon: Pill,
    badge: 'Dispenser',
  },
];

const LICENSE_CLASSIFICATIONS = [
  { value: 'MANUFACTURING', label: 'Manufacturing License (cGMP)' },
  { value: 'WHOLESALE', label: 'Wholesale Distribution License (GDP)' },
  { value: 'PHARMACY', label: 'State Pharmacy Dispensing License' },
  { value: 'IMPORT_EXPORT', label: 'International Trade Permit' },
];

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
  const [dragActive, setDragActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  const fileInputRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (roleId) => {
    const roleConfig = STAKEHOLDER_ROLES.find((r) => r.id === roleId);
    setFormData((prev) => ({
      ...prev,
      organizationType: roleId,
      licenseType: roleConfig ? roleConfig.defaultLicenseType : prev.licenseType,
    }));
    if (fieldErrors.organizationType) {
      setFieldErrors((prev) => ({ ...prev, organizationType: null }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const processFile = (file) => {
    if (!file) return;

    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const validMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(ext) && !validMimes.includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        licenseFile: 'Unsupported format. Please upload a valid PDF, JPG, or PNG document.',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        licenseFile: `File exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
      }));
      return;
    }

    setLicenseFile(file);
    setFieldErrors((prev) => ({ ...prev, licenseFile: null }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setLicenseFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required.';
    }

    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.licenseNumber.trim()) {
      errors.licenseNumber = 'License number is required.';
    }

    if (!licenseFile) {
      errors.licenseFile = 'License document is required.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreedToTerms) {
      errors.agreedToTerms = 'You must accept the authorization statement.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const payload = new FormData();
    payload.append('name', formData.name.trim());
    payload.append('email', formData.email.trim().toLowerCase());
    payload.append('password', formData.password);
    payload.append('confirmPassword', formData.confirmPassword);
    payload.append('organizationName', formData.organizationName.trim());
    payload.append('organizationType', formData.organizationType);
    payload.append('licenseNumber', formData.licenseNumber.trim().toUpperCase());
    payload.append('licenseType', formData.licenseType);
    if (formData.address.trim()) payload.append('address', formData.address.trim());
    if (formData.contactPhone.trim()) payload.append('contactPhone', formData.contactPhone.trim());
    payload.append('licenseDocument', licenseFile);

    try {
      const res = await register(payload);

      if (res && res.success) {
        setRegistrationSuccess({
          user: res.user,
          organizationName: formData.organizationName.trim(),
          organizationType: formData.organizationType,
          licenseNumber: formData.licenseNumber.trim().toUpperCase(),
          email: formData.email.trim().toLowerCase(),
        });
      } else {
        const backendMsg = res?.message || 'Registration failed.';
        if (backendMsg.includes('Email is already registered')) {
          setGeneralError('Email address is already registered. Please sign in.');
          setFieldErrors((prev) => ({ ...prev, email: 'Email already registered.' }));
        } else if (backendMsg.includes('License number is already registered')) {
          setGeneralError('License number is already registered under another account.');
          setFieldErrors((prev) => ({ ...prev, licenseNumber: 'License already registered.' }));
        } else {
          setGeneralError(backendMsg);
        }
      }
    } catch (err) {
      setGeneralError(err.message || 'Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValidLength = formData.password.length >= 6;
  const isPasswordMatch = Boolean(formData.password && formData.confirmPassword && formData.password === formData.confirmPassword);

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'stretch', background: '#f8fafc' }}>
      {/* Left Column: Branding Banner */}
      <div
        className="desktop-only-banner"
        style={{
          flex: '1 1 38%',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e3a8a 60%, #0369a1 100%)',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <ShieldCheck style={{ width: '24px', height: '24px', color: '#ffffff' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ffffff', display: 'block', letterSpacing: '-0.02em' }}>
                SecurePharma
              </span>
              <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: '600', letterSpacing: '0.04em' }}>
                Medical Supply Chain Network
              </span>
            </div>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', lineHeight: 1.3, marginBottom: '14px', color: '#ffffff' }}>
            Healthcare & Industry Portal Registration
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '32px' }}>
            Connect your pharmaceutical organization to verify authenticity and maintain secure chain of custody.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              'Verified Organization Licensing',
              'End-to-End Batch Tracking',
              'Real-Time Regulatory Compliance',
            ].map((text, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.25)',
                    border: '1px solid #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                  }}
                >
                  <Check style={{ width: '14px', height: '14px' }} />
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: '500', color: '#e2e8f0' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
          SecurePharma Medical Portal • Encrypted & Compliant
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div
        style={{
          flex: '1 1 62%',
          padding: '36px 32px',
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ maxWidth: '640px', width: '100%' }}>
          {registrationSuccess ? (
            /* Success Screen */
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '36px 32px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CheckCircle2 style={{ width: '36px', height: '36px', color: '#ffffff' }} />
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                Application Submitted Successfully
              </h2>

              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
                Your organization account has been submitted and is pending verification.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'left',
                  marginBottom: '24px',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{registrationSuccess.organizationName}</span>
                  <StatusBadge status={registrationSuccess.organizationType} />
                </div>
                <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>License No: <strong>{registrationSuccess.licenseNumber}</strong></div>
                  <div>Official Email: <strong>{registrationSuccess.email}</strong></div>
                  <div>Account Status: <StatusBadge status="PENDING" /></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  Sign In to Account
                </Link>
                <Link
                  to={`/pending-verification?email=${encodeURIComponent(registrationSuccess.email)}&registered=true`}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Track Status
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '32px 28px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  Register Account
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Select your organization role and fill in your registration details.
                </p>
              </div>

              {generalError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    marginBottom: '20px',
                  }}
                >
                  <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0, color: '#dc2626' }} />
                  <span>{generalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Role Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Organization Role *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {STAKEHOLDER_ROLES.map((role) => {
                      const IconComp = role.icon;
                      const isSelected = formData.organizationType === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleRoleSelect(role.id)}
                          style={{
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            border: `2px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`,
                            borderRadius: '10px',
                            padding: '12px 8px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <IconComp style={{ width: '22px', height: '22px', color: isSelected ? '#2563eb' : '#64748b' }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: isSelected ? '#1e40af' : '#334155' }}>
                            {role.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Organization Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="organizationName" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Organization Name *
                    </label>
                    <input
                      id="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => {
                        setFormData({ ...formData, organizationName: e.target.value });
                        if (fieldErrors.organizationName) setFieldErrors({ ...fieldErrors, organizationName: null });
                      }}
                      placeholder="e.g. Apex BioPharma"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${fieldErrors.organizationName ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                    {fieldErrors.organizationName && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.organizationName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Facility Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Address or City"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPhone" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Contact Phone
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* License Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label htmlFor="licenseNumber" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      License Number *
                    </label>
                    <input
                      id="licenseNumber"
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() });
                        if (fieldErrors.licenseNumber) setFieldErrors({ ...fieldErrors, licenseNumber: null });
                      }}
                      placeholder="e.g. MFG-2026-9042"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${fieldErrors.licenseNumber ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: '0.88rem',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                    {fieldErrors.licenseNumber && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.licenseNumber}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="licenseType" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      License Classification *
                    </label>
                    <select
                      id="licenseType"
                      value={formData.licenseType}
                      onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    >
                      {LICENSE_CLASSIFICATIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* File Upload Dropzone */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      License Certificate (PDF, JPG, PNG) *
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="licenseFileInput"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />

                    {!licenseFile ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        style={{
                          border: `2px dashed ${dragActive ? '#2563eb' : fieldErrors.licenseFile ? '#ef4444' : '#cbd5e1'}`,
                          borderRadius: '8px',
                          background: dragActive ? '#eff6ff' : '#f8fafc',
                          padding: '18px',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <UploadCloud style={{ width: '24px', height: '24px', color: '#64748b', margin: '0 auto 4px' }} />
                        <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                          Click to upload or drag & drop file
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PDF, JPG, PNG up to 5MB</div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: '#ecfdf5',
                          border: '1px solid #10b981',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText style={{ width: '18px', height: '18px', color: '#059669' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>{licenseFile.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({(licenseFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                        >
                          <X style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    )}

                    {fieldErrors.licenseFile && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.licenseFile}
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Credentials */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label htmlFor="representativeName" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Full Name *
                    </label>
                    <input
                      id="representativeName"
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                      }}
                      placeholder="Contact person name"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${fieldErrors.name ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                    {fieldErrors.name && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="officialEmail" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Email Address *
                    </label>
                    <input
                      id="officialEmail"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                      }}
                      placeholder="name@company.com"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${fieldErrors.email ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: '0.88rem',
                        outline: 'none',
                      }}
                    />
                    {fieldErrors.email && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                        }}
                        placeholder="Min. 6 characters"
                        style={{
                          width: '100%',
                          padding: '9px 36px 9px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.password ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.88rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '8px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                        }}
                      >
                        {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.password}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                      Confirm Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null });
                        }}
                        placeholder="Re-enter password"
                        style={{
                          width: '100%',
                          padding: '9px 36px 9px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.confirmPassword ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.88rem',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '8px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                        }}
                      >
                        {showConfirmPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                        {fieldErrors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>

                {/* Terms Agreement */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (fieldErrors.agreedToTerms) setFieldErrors({ ...fieldErrors, agreedToTerms: null });
                      }}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <span>
                      I certify that I am an authorized representative and all licensing details submitted are accurate.
                    </span>
                  </label>
                  {fieldErrors.agreedToTerms && (
                    <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                      {fieldErrors.agreedToTerms}
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      <span>Submitting Registration...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight style={{ width: '16px', height: '16px' }} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                  Already registered?{' '}
                  <Link to="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
                    Sign in here
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
