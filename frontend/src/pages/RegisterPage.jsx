import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const STAKEHOLDER_ROLES = [
  {
    id: 'MANUFACTURER',
    title: 'Pharmaceutical Manufacturer',
    subtitle: 'cGMP-certified drug manufacturers, batch producers, and packaging facilities',
    icon: '🏭',
    defaultLicenseType: 'MANUFACTURING',
    licenseOptions: [
      { value: 'MANUFACTURING', label: 'Pharmaceutical Manufacturing License (cGMP)' },
      { value: 'IMPORT_EXPORT', label: 'International Import / Export Permit' },
    ],
    placeholderOrg: 'e.g. Apex BioPharma Industries Inc.',
    placeholderLicense: 'e.g. FDA-MFG-2026-8821',
  },
  {
    id: 'DISTRIBUTOR',
    title: 'Verified Distributor',
    subtitle: 'Authorized wholesale drug distributors, logistics handlers, and central depots',
    icon: '🚚',
    defaultLicenseType: 'WHOLESALE',
    licenseOptions: [
      { value: 'WHOLESALE', label: 'Wholesale Drug Distributor License (GDP)' },
      { value: 'IMPORT_EXPORT', label: 'International Import / Export Permit' },
    ],
    placeholderOrg: 'e.g. NovaLog Pharma Distribution Hub',
    placeholderLicense: 'e.g. WDL-FED-2026-4402',
  },
  {
    id: 'PHARMACY',
    title: 'Licensed Pharmacy',
    subtitle: 'Hospital health systems, retail community pharmacies, and clinical dispensing entities',
    icon: '🏥',
    defaultLicenseType: 'PHARMACY',
    licenseOptions: [
      { value: 'PHARMACY', label: 'State Pharmacy Dispensing License' },
    ],
    placeholderOrg: 'e.g. MedLife Clinical Health Network',
    placeholderLicense: 'e.g. PHARM-ST-2026-1193',
  },
];

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form State
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
    agreeTerms: false,
  });

  const [licenseFile, setLicenseFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Validation & UI State
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState('');
  const [apiError, setApiError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Active Role Helper
  const currentRoleConfig =
    STAKEHOLDER_ROLES.find((r) => r.id === formData.organizationType) ||
    STAKEHOLDER_ROLES[0];

  // Role Selection Handler
  const handleRoleSelect = (roleId) => {
    if (submitting) return;
    const roleConfig = STAKEHOLDER_ROLES.find((r) => r.id === roleId);
    if (!roleConfig) return;

    setFormData((prev) => ({
      ...prev,
      organizationType: roleId,
      licenseType: roleConfig.defaultLicenseType,
    }));
    setApiError(null);
  };

  // Field Validation Helper
  const validateField = (name, value, allData = formData) => {
    switch (name) {
      case 'name':
        if (!value || !value.trim()) return 'Authorized representative full name is required.';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.';
        return null;

      case 'email':
        if (!value || !value.trim()) return 'Official corporate email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address (e.g. name@company.com).';
        }
        return null;

      case 'organizationName':
        if (!value || !value.trim()) return 'Legal organization name is required.';
        if (value.trim().length < 2) return 'Organization name must be at least 2 characters.';
        return null;

      case 'licenseNumber':
        if (!value || !value.trim()) return 'Official regulatory license number is required.';
        if (value.trim().length < 3) return 'License number must be at least 3 characters.';
        return null;

      case 'password':
        if (!value) return 'Password is required.';
        if (value.length < 6) return 'Password must be at least 6 characters long.';
        return null;

      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (value !== allData.password) return 'Passwords do not match.';
        return null;

      case 'contactPhone':
        if (value && value.trim() && value.trim().length < 7) {
          return 'Please enter a valid contact phone number.';
        }
        return null;

      default:
        return null;
    }
  };

  // Input Change Handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      if (touched[name]) {
        const err = validateField(name, val, updated);
        setFieldErrors((prevErr) => ({ ...prevErr, [name]: err }));
      }
      if (name === 'password' && touched.confirmPassword) {
        const confirmErr = validateField('confirmPassword', prev.confirmPassword, updated);
        setFieldErrors((prevErr) => ({ ...prevErr, confirmPassword: confirmErr }));
      }
      return updated;
    });

    if (apiError) setApiError(null);
  };

  // Input Blur Handler
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value, formData);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  // File Validation Helper
  const validateAndProcessFile = (file) => {
    if (!file) return;

    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    const isValidExtension = ALLOWED_EXTENSIONS.has(extension);
    const isValidMime = ALLOWED_MIME_TYPES.has(file.type);

    if (!isValidExtension && !isValidMime) {
      setFileError('Invalid file format. Only PDF, JPG, JPEG, and PNG documents are accepted.');
      setLicenseFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileError(`File size exceeds 5MB limit (${sizeMb} MB detected). Please select a smaller document.`);
      setLicenseFile(null);
      return;
    }

    setFileError(null);
    setLicenseFile(file);
    if (apiError) setApiError(null);
  };

  // File Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!submitting) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (submitting) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (submitting) return;
    setLicenseFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Password Strength Calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score;
  };

  const passwordStrengthScore = getPasswordStrength(formData.password);

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    // Run complete validation
    const errors = {};
    Object.keys(formData).forEach((field) => {
      const err = validateField(field, formData[field], formData);
      if (err) errors[field] = err;
    });

    if (!licenseFile) {
      setFileError('Official regulatory license document (.pdf, .jpg, or .png) is required.');
      errors.licenseDocument = true;
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = 'Please certify that the submitted organization information and license are authentic.';
    }

    setFieldErrors(errors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      organizationName: true,
      licenseNumber: true,
      agreeTerms: true,
    });

    if (Object.keys(errors).length > 0) {
      // Focus on first invalid field
      const firstInvalid = Object.keys(errors)[0];
      const el = document.getElementById(firstInvalid);
      if (el) el.focus();
      return;
    }

    // Build Payload
    const payload = new FormData();
    payload.append('name', formData.name.trim());
    payload.append('email', formData.email.trim());
    payload.append('password', formData.password);
    payload.append('confirmPassword', formData.confirmPassword);
    payload.append('organizationName', formData.organizationName.trim());
    payload.append('organizationType', formData.organizationType);
    payload.append('licenseNumber', formData.licenseNumber.trim().toUpperCase());
    payload.append('licenseType', formData.licenseType);
    payload.append('address', formData.address ? formData.address.trim() : '');
    payload.append('contactPhone', formData.contactPhone ? formData.contactPhone.trim() : '');
    payload.append('licenseDocument', licenseFile);

    setSubmitting(true);
    setSubmissionStage('Validating regulatory credentials...');

    try {
      setTimeout(() => {
        setSubmissionStage('Uploading and cryptographically hashing regulatory document...');
      }, 700);

      const res = await register(payload);

      if (res && res.success) {
        setSuccessData({
          user: res.user,
          organizationName: formData.organizationName,
          organizationType: formData.organizationType,
          licenseNumber: formData.licenseNumber.toUpperCase(),
          licenseType: formData.licenseType,
          email: formData.email,
          name: formData.name,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const errorMsg = res?.message || 'Registration application failed.';
        if (errorMsg.includes('Email is already registered')) {
          setApiError({
            type: 'EMAIL_EXISTS',
            message: 'This email address is already registered. If you already have an account, try signing in.',
          });
        } else if (errorMsg.includes('License number is already registered')) {
          setApiError({
            type: 'LICENSE_EXISTS',
            message: 'This regulatory license number has already been registered in the system. Please verify your license ID.',
          });
        } else {
          setApiError({
            type: 'GENERAL',
            message: errorMsg,
          });
        }
      }
    } catch (err) {
      const rawMsg = err.message || '';
      if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
        setApiError({
          type: 'NETWORK',
          message: 'Unable to connect to the Secure Pharma server. Please ensure the backend is running and try again.',
        });
      } else {
        setApiError({
          type: 'GENERAL',
          message: rawMsg || 'An unexpected error occurred while processing your registration.',
        });
      }
    } finally {
      setSubmitting(false);
      setSubmissionStage('');
    }
  };

  // =========================================================================
  // SUCCESS STATE VIEW
  // =========================================================================
  if (successData) {
    return (
      <div className="reg-page-wrapper">
        <div className="reg-container" style={{ maxWidth: '680px' }}>
          <div className="success-panel-card">
            {/* Green Shield Success Icon */}
            <div className="success-icon-badge">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L4 5.5V11.5C4 16.5 7.5 21.1 12 22.5C16.5 21.1 20 16.5 20 11.5V5.5L12 2Z"
                  fill="white"
                  fillOpacity="0.25"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M8.5 12L11 14.5L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ display: 'inline-flex', marginBottom: '12px' }}>
              <StatusBadge status="PENDING" />
            </div>

            <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
              Registration Application Submitted
            </h1>

            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto 20px' }}>
              Your pharmaceutical organization credentials and regulatory license have been securely recorded and placed in the official regulatory audit queue.
            </p>

            {/* Application Summary Box */}
            <div className="success-summary-box">
              <div className="summary-row">
                <span className="summary-label">Organization Legal Name</span>
                <span className="summary-value">{successData.organizationName}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Stakeholder Role</span>
                <span className="summary-value">
                  <StatusBadge status={successData.organizationType} />
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Official License Number</span>
                <span className="summary-value font-mono">{successData.licenseNumber}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Authorized Representative</span>
                <span className="summary-value">{successData.name} ({successData.email})</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Initial Account Status</span>
                <span className="summary-value" style={{ color: '#d97706' }}>
                  ⏳ Pending Verification
                </span>
              </div>
            </div>

            {/* Next Steps Roadmap */}
            <div style={{ textAlign: 'left', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                Next Verification Steps
              </h4>
            </div>

            <div className="roadmap-steps-container">
              <div className="roadmap-step-box">
                <span className="step-num">Step 1</span>
                <span className="step-title">Regulatory Audit</span>
                <span className="step-desc">Authorities review your submitted credentials against official drug registries.</span>
              </div>
              <div className="roadmap-step-box">
                <span className="step-num">Step 2</span>
                <span className="step-title">SHA-256 Attestation</span>
                <span className="step-desc">Document cryptographic hash is authenticated for immutable tamper detection.</span>
              </div>
              <div className="roadmap-step-box">
                <span className="step-num">Step 3</span>
                <span className="step-title">Portal Activation</span>
                <span className="step-desc">Upon approval, you receive access to your authenticated stakeholder portal.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '28px' }}>
              <button
                type="button"
                onClick={() => navigate(`/pending-verification?email=${encodeURIComponent(successData.email)}&registered=true`)}
                className="btn btn-outline"
                style={{ padding: '12px 20px', fontWeight: '600' }}
              >
                🔍 Check Verification Status
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontWeight: '700' }}
              >
                Proceed to Sign In →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN REGISTRATION FORM VIEW
  // =========================================================================
  return (
    <div className="reg-page-wrapper">
      {/* Background Decorative SVG Graphics (Aligned with LoginPage) */}
      <svg
        style={{
          position: 'absolute',
          left: '2%',
          top: '15%',
          width: '320px',
          height: '420px',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
        viewBox="0 0 240 320"
        fill="none"
        aria-hidden="true"
      >
        <polygon points="120,20 190,60 190,140 120,180 50,140 50,60" stroke="#93c5fd" strokeWidth="2" />
        <polygon points="120,50 165,75 165,125 120,150 75,125 75,75" stroke="#60a5fa" strokeWidth="1.5" />
        <path d="M120,50 L120,150 M120,150 L75,125 M120,150 L165,125" stroke="#93c5fd" strokeWidth="1.5" />
        <polygon points="120,180 180,215 180,285 120,320 60,285 60,215" stroke="#bfdbfe" strokeWidth="1.5" />
      </svg>

      <svg
        style={{
          position: 'absolute',
          right: '2%',
          top: '25%',
          width: '340px',
          height: '460px',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
        viewBox="0 0 260 360"
        fill="none"
        aria-hidden="true"
      >
        <polygon points="130,25 210,70 210,160 130,205 50,160 50,70" stroke="#93c5fd" strokeWidth="2" />
        <polygon points="130,60 185,90 185,150 130,180 75,150 75,90" stroke="#3b82f6" strokeWidth="1.8" />
        <polygon points="130,85 160,102 160,138 130,155 100,138 100,102" fill="#dbeafe" fillOpacity="0.45" stroke="#2563eb" strokeWidth="1.5" />
      </svg>

      <div className="reg-container">
        <div className="reg-card">
          {/* Header Brand Section */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(29, 78, 216, 0.3)',
                margin: '0 auto 12px',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L4 5.5V11.5C4 16.5 7.5 21.1 12 22.5C16.5 21.1 20 16.5 20 11.5V5.5L12 2Z"
                  fill="white"
                  fillOpacity="0.25"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-info" style={{ fontSize: '0.725rem', padding: '3px 8px' }}>
                🛡️ Verified Supply Chain Network
              </span>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Stakeholder Entity Registration
            </h1>

            <p style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '580px', margin: '0 auto' }}>
              Onboard your pharmaceutical organization to participate in secure, end-to-end verified pharmaceutical batch tracking and regulatory compliance.
            </p>
          </div>

          {/* Top-Level API / System Error Banner */}
          {apiError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderLeft: '4px solid #dc2626',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
              }}
              role="alert"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#991b1b', marginBottom: '2px' }}>
                    Registration Notice
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#b91c1c', lineHeight: 1.4 }}>
                    {apiError.message}
                  </div>
                </div>
              </div>

              {apiError.type === 'EMAIL_EXISTS' && (
                <Link
                  to="/login"
                  className="btn btn-sm btn-primary"
                  style={{ whiteSpace: 'nowrap', textDecoration: 'none' }}
                >
                  Sign In Now →
                </Link>
              )}
            </div>
          )}

          {/* Submission In-Progress Indicator */}
          {submitting && (
            <div className="submission-progress-banner">
              <div className="spinner-pulse" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e40af' }}>
                  Processing Application
                </div>
                <div style={{ fontSize: '0.775rem', color: '#3b82f6' }}>
                  {submissionStage || 'Submitting registration details...'}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* ============================================================== */}
            {/* STEP 1: STAKEHOLDER ROLE SELECTION */}
            {/* ============================================================== */}
            <div className="form-section-block">
              <div className="form-section-header">
                <span className="section-number-badge">1</span>
                <div>
                  <h3 className="section-title">Stakeholder Entity Classification</h3>
                </div>
                <span className="section-subtitle">Select your authorized industry role</span>
              </div>

              <div
                className="role-selector-grid"
                role="radiogroup"
                aria-label="Stakeholder Entity Classification"
              >
                {STAKEHOLDER_ROLES.map((role) => {
                  const isSelected = formData.organizationType === role.id;
                  return (
                    <div
                      key={role.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`role-card ${isSelected ? 'active' : ''}`}
                      onClick={() => handleRoleSelect(role.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRoleSelect(role.id);
                        }
                      }}
                    >
                      <div className="role-card-indicator" />
                      <div className="role-card-icon" style={{ background: isSelected ? '#2563eb' : '#eff6ff' }}>
                        {role.icon}
                      </div>
                      <div className="role-card-title">{role.title}</div>
                      <div className="role-card-desc">{role.subtitle}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================== */}
            {/* STEP 2: ORGANIZATION DETAILS */}
            {/* ============================================================== */}
            <div className="form-section-block">
              <div className="form-section-header">
                <span className="section-number-badge">2</span>
                <div>
                  <h3 className="section-title">Organization Details</h3>
                </div>
                <span className="section-subtitle">Official registered enterprise profile</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Organization Legal Name */}
                <div className="form-field">
                  <label htmlFor="organizationName" className="field-label">
                    <span>
                      Legal Entity Name <span className="field-required">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      disabled={submitting}
                      required
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder={currentRoleConfig.placeholderOrg}
                      className={`field-input ${
                        touched.organizationName && fieldErrors.organizationName
                          ? 'has-error'
                          : touched.organizationName && !fieldErrors.organizationName
                          ? 'is-valid'
                          : ''
                      }`}
                      aria-invalid={Boolean(touched.organizationName && fieldErrors.organizationName)}
                      aria-describedby={fieldErrors.organizationName ? 'orgName-error' : undefined}
                    />
                  </div>
                  {touched.organizationName && fieldErrors.organizationName && (
                    <div id="orgName-error" className="field-error-msg" role="alert">
                      <span>⚠️</span> {fieldErrors.organizationName}
                    </div>
                  )}
                </div>

                {/* Organization Type (Synced with selection) */}
                <div className="form-field">
                  <label htmlFor="organizationType" className="field-label">
                    <span>
                      Entity Role Type <span className="field-required">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <select
                      id="organizationType"
                      name="organizationType"
                      disabled={submitting}
                      value={formData.organizationType}
                      onChange={(e) => handleRoleSelect(e.target.value)}
                      className="field-input"
                    >
                      <option value="MANUFACTURER">Pharmaceutical Manufacturer</option>
                      <option value="DISTRIBUTOR">Wholesale Distributor</option>
                      <option value="PHARMACY">Retail / Hospital Pharmacy</option>
                    </select>
                  </div>
                  <div className="field-hint">
                    Selected role defines your compliance dashboard and permissions.
                  </div>
                </div>

                {/* Headquarters / Facility Physical Address */}
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="address" className="field-label">
                    <span>
                      Headquarters / Facility Address
                    </span>
                    <span className="field-optional">Recommended for inspection</span>
                  </label>
                  <div className="field-input-wrapper">
                    <input
                      id="address"
                      name="address"
                      type="text"
                      disabled={submitting}
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="e.g. 500 BioPharma Blvd, Suite 400, Cambridge MA 02142"
                      className="field-input"
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div className="form-field">
                  <label htmlFor="contactPhone" className="field-label">
                    <span>Official Contact Phone</span>
                    <span className="field-optional">Optional</span>
                  </label>
                  <div className="field-input-wrapper">
                    <input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      disabled={submitting}
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g. +1 (555) 234-5678"
                      className={`field-input ${
                        touched.contactPhone && fieldErrors.contactPhone ? 'has-error' : ''
                      }`}
                      aria-describedby={fieldErrors.contactPhone ? 'phone-error' : undefined}
                    />
                  </div>
                  {touched.contactPhone && fieldErrors.contactPhone && (
                    <div id="phone-error" className="field-error-msg" role="alert">
                      <span>⚠️</span> {fieldErrors.contactPhone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* STEP 3: REGULATORY LICENSE & DOCUMENTATION */}
            {/* ============================================================== */}
            <div className="form-section-block">
              <div className="form-section-header">
                <span className="section-number-badge">3</span>
                <div>
                  <h3 className="section-title">Regulatory License & Verification Document</h3>
                </div>
                <span className="section-subtitle">Authentic regulatory credential</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '18px' }}>
                {/* Regulatory License Number */}
                <div className="form-field">
                  <label htmlFor="licenseNumber" className="field-label">
                    <span>
                      Official Regulatory License Number <span className="field-required">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      disabled={submitting}
                      required
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder={currentRoleConfig.placeholderLicense}
                      className={`field-input font-mono ${
                        touched.licenseNumber && fieldErrors.licenseNumber
                          ? 'has-error'
                          : touched.licenseNumber && !fieldErrors.licenseNumber
                          ? 'is-valid'
                          : ''
                      }`}
                      aria-invalid={Boolean(touched.licenseNumber && fieldErrors.licenseNumber)}
                      aria-describedby={fieldErrors.licenseNumber ? 'licNum-error' : undefined}
                    />
                  </div>
                  {touched.licenseNumber && fieldErrors.licenseNumber && (
                    <div id="licNum-error" className="field-error-msg" role="alert">
                      <span>⚠️</span> {fieldErrors.licenseNumber}
                    </div>
                  )}
                </div>

                {/* License Classification */}
                <div className="form-field">
                  <label htmlFor="licenseType" className="field-label">
                    <span>
                      License Classification <span className="field-required">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <select
                      id="licenseType"
                      name="licenseType"
                      disabled={submitting}
                      value={formData.licenseType}
                      onChange={handleInputChange}
                      className="field-input"
                    >
                      {currentRoleConfig.licenseOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* License Document Upload Dropzone */}
              <div className="form-field">
                <label className="field-label" style={{ marginBottom: '4px' }}>
                  <span>
                    Upload Official Regulatory License Document <span className="field-required">*</span>
                  </span>
                  <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                    PDF, JPG, PNG (Max 5 MB)
                  </span>
                </label>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  id="licenseDocument"
                  name="licenseDocument"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={submitting}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  aria-label="Upload Official Regulatory License Document"
                />

                {!licenseFile ? (
                  <div
                    className={`license-dropzone ${isDragActive ? 'drag-active' : ''} ${
                      fileError ? 'has-error' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (fileInputRef.current) fileInputRef.current.click();
                      }
                    }}
                    aria-describedby={fileError ? 'file-error' : undefined}
                  >
                    <div className="license-dropzone-icon">
                      📄
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                      Drag &amp; drop your official license document here
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                      or click to browse from your device
                    </div>
                    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>PDF</span>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>JPG</span>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>PNG</span>
                    </div>
                  </div>
                ) : (
                  /* Attached Document Card */
                  <div className="attached-file-card">
                    <div className="file-info-group">
                      <div className="file-icon-badge">
                        {licenseFile.name.endsWith('.pdf') ? '📕' : '🖼️'}
                      </div>
                      <div className="file-details">
                        <span className="file-name">{licenseFile.name}</span>
                        <span className="file-meta">
                          <span>✓ {formatFileSize(licenseFile.size)}</span>
                          <span>•</span>
                          <span>Ready for SHA-256 tamper hashing</span>
                        </span>
                      </div>
                    </div>

                    <div className="file-actions">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          if (fileInputRef.current) fileInputRef.current.click();
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '6px 12px' }}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleRemoveFile}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 12px' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {fileError && (
                  <div id="file-error" className="field-error-msg" style={{ marginTop: '6px' }} role="alert">
                    <span>⚠️</span> {fileError}
                  </div>
                )}

                <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🔒</span> Document is securely transmitted and cryptographically hashed upon submission for regulatory audit.
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* STEP 4: AUTHORIZED REPRESENTATIVE CREDENTIALS */}
            {/* ============================================================== */}
            <div className="form-section-block">
              <div className="form-section-header">
                <span className="section-number-badge">4</span>
                <div>
                  <h3 className="section-title">Authorized Representative Credentials</h3>
                </div>
                <span className="section-subtitle">Account security &amp; access credentials</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Full Name */}
                <div className="form-field">
                  <label htmlFor="name" className="field-label">
                    <span>
                      Authorized Representative Full Name <span className="field-required">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      disabled={submitting}
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g. Dr. Eleanor Vance, PharmD"
                      className={`field-input ${
                        touched.name && fieldErrors.name
                          ? 'has-error'
                          : touched.name && !fieldErrors.name
                          ? 'is-valid'
                          : ''
                      }`}
                      aria-invalid={Boolean(touched.name && fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                    />
                  </div>
                  {touched.name && fieldErrors.name && (
                    <div id="name-error" className="field-error-msg" role="alert">
                      <span>⚠️</span> {fieldErrors.name}
                    </div>
                  )}
                </div>

                {/* Official Email */}
                <div className="form-field">
                  <label htmlFor="email" className="field-label">
                    <span>
                      Official Corporate / Institutional Email <span className="field-required">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      disabled={submitting}
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="compliance@organization.com"
                      className={`field-input ${
                        touched.email && fieldErrors.email
                          ? 'has-error'
                          : touched.email && !fieldErrors.email
                          ? 'is-valid'
                          : ''
                      }`}
                      aria-invalid={Boolean(touched.email && fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {touched.email && fieldErrors.email && (
                    <div id="email-error" className="field-error-msg" role="alert">
                      <span>⚠️</span> {fieldErrors.email}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="form-field">
                  <label htmlFor="password" className="field-label">
                    <span>
                      Account Password <span className="field-required">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      disabled={submitting}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="••••••••••••"
                      style={{ paddingRight: '40px' }}
                      className={`field-input ${
                        touched.password && fieldErrors.password
                          ? 'has-error'
                          : touched.password && !fieldErrors.password
                          ? 'is-valid'
                          : ''
                      }`}
                      aria-invalid={Boolean(touched.password && fieldErrors.password)}
                      aria-describedby={fieldErrors.password ? 'pwd-error' : undefined}
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                  {touched.password && fieldErrors.password && (
                    <div id="pwd-error" className="field-error-msg" role="alert">
                      <span>⚠️</span> {fieldErrors.password}
                    </div>
                  )}

                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="password-strength-bar" aria-hidden="true">
                      <div
                        className={`strength-segment ${
                          passwordStrengthScore >= 1
                            ? passwordStrengthScore <= 1
                              ? 'strength-weak'
                              : passwordStrengthScore <= 2
                              ? 'strength-good'
                              : 'strength-strong'
                            : ''
                        }`}
                      />
                      <div
                        className={`strength-segment ${
                          passwordStrengthScore >= 2
                            ? passwordStrengthScore <= 2
                              ? 'strength-good'
                              : 'strength-strong'
                            : ''
                        }`}
                      />
                      <div
                        className={`strength-segment ${
                          passwordStrengthScore >= 3 ? 'strength-strong' : ''
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-field">
                  <label htmlFor="confirmPassword" className="field-label">
                    <span>
                      Confirm Password <span className="field-required">*</span>
                    </span>
                  </label>
                  <div className="field-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      disabled={submitting}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="••••••••••••"
                      style={{ paddingRight: '40px' }}
                      className={`field-input ${
                        touched.confirmPassword && fieldErrors.confirmPassword
                          ? 'has-error'
                          : touched.confirmPassword && !fieldErrors.confirmPassword
                          ? 'is-valid'
                          : ''
                      }`}
                      aria-invalid={Boolean(touched.confirmPassword && fieldErrors.confirmPassword)}
                      aria-describedby={fieldErrors.confirmPassword ? 'confPwd-error' : undefined}
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                      }}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? '👁️' : '🔒'}
                    </button>
                  </div>
                  {touched.confirmPassword && fieldErrors.confirmPassword && (
                    <div id="confPwd-error" className="field-error-msg" role="alert">
                      <span>⚠️</span> {fieldErrors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Requirement Checklist */}
              <div className="password-criteria-list" aria-live="polite">
                <div
                  className={`password-criteria-item ${
                    formData.password.length >= 6 ? 'met' : 'unmet'
                  }`}
                >
                  <span>{formData.password.length >= 6 ? '✓' : '•'}</span>
                  <span>Minimum 6 characters</span>
                </div>
                <div
                  className={`password-criteria-item ${
                    formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'met'
                      : 'unmet'
                  }`}
                >
                  <span>
                    {formData.confirmPassword && formData.password === formData.confirmPassword
                      ? '✓'
                      : '•'}
                  </span>
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* STEP 5: REGULATORY COMPLIANCE DECLARATION & SUBMISSION */}
            {/* ============================================================== */}
            <div style={{ background: '#ffffff', padding: '6px 4px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  disabled={submitting}
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginTop: '2px',
                    cursor: 'pointer',
                    accentColor: '#1d4ed8',
                  }}
                  aria-describedby={fieldErrors.agreeTerms ? 'terms-error' : undefined}
                />
                <label
                  htmlFor="agreeTerms"
                  style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, cursor: 'pointer' }}
                >
                  I certify that I am an authorized representative of <strong>{formData.organizationName || 'this organization'}</strong>, and that all provided organization credentials, license identifiers, and attached documents are authentic and valid under applicable pharmaceutical regulatory statutes.
                </label>
              </div>

              {touched.agreeTerms && fieldErrors.agreeTerms && (
                <div id="terms-error" className="field-error-msg" style={{ marginBottom: '16px' }} role="alert">
                  <span>⚠️</span> {fieldErrors.agreeTerms}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.75 : 1,
                }}
              >
                {submitting
                  ? (submissionStage || 'Submitting Registration to Regulatory Board...')
                  : 'Submit Registration Application'}
              </button>
            </div>
          </form>

          {/* Already have an account footer */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid #eef2f6',
              fontSize: '0.875rem',
              color: '#64748b',
            }}
          >
            Already have a registered account?{' '}
            <Link
              to="/login"
              style={{
                color: '#2563eb',
                fontWeight: '700',
                textDecoration: 'none',
              }}
            >
              Sign In to Stakeholder Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
