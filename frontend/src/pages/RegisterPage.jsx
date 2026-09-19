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
  Sparkles,
  Clock,
  ExternalLink,
  RefreshCw,
  FileUp,
} from 'lucide-react';

const STAKEHOLDER_ROLES = [
  {
    id: 'MANUFACTURER',
    label: 'Manufacturer',
    title: 'Pharmaceutical Manufacturer',
    actionText: 'Register as a pharmaceutical manufacturer',
    description: 'Licensed formulation plants & primary drug manufacturing facilities producing serialized batches.',
    icon: Factory,
    defaultLicenseType: 'MANUFACTURING',
    badge: 'cGMP Compliant',
    color: '#2563eb',
  },
  {
    id: 'DISTRIBUTOR',
    label: 'Distributor',
    title: 'Wholesale Distributor',
    actionText: 'Register as a verified distributor',
    description: 'Authorized wholesale entities managing cold-chain logistics, certified storage, and bulk distribution.',
    icon: Truck,
    defaultLicenseType: 'WHOLESALE',
    badge: 'GDP Certified',
    color: '#7c3aed',
  },
  {
    id: 'PHARMACY',
    label: 'Pharmacy',
    title: 'Dispensing Pharmacy',
    actionText: 'Register as a pharmacy',
    description: 'Licensed retail, clinical, or hospital pharmacies dispensing authentic medicines to patients.',
    icon: Pill,
    defaultLicenseType: 'PHARMACY',
    badge: 'State Dispenser',
    color: '#059669',
  },
];

const LICENSE_CLASSIFICATIONS = [
  {
    value: 'MANUFACTURING',
    label: 'Pharmaceutical Manufacturing License (cGMP)',
    helper: 'Required for active drug formulation, compounding, and batch packaging.',
  },
  {
    value: 'WHOLESALE',
    label: 'Wholesale Drug Distribution License (GDP)',
    helper: 'Required for intermediate wholesale storage, transport, and chain-of-custody transfer.',
  },
  {
    value: 'PHARMACY',
    label: 'State Pharmacy Dispensing License',
    helper: 'Required for hospital, retail, or clinic prescription dispensation.',
  },
  {
    value: 'IMPORT_EXPORT',
    label: 'International Pharmaceutical Trade Permit',
    helper: 'Required for authorized cross-border active ingredient and medicine shipments.',
  },
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
  const [loadingStepText, setLoadingStepText] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  const fileInputRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Role switch handler: automatically align appropriate license classification
  const handleRoleSelect = (roleId) => {
    const roleConfig = STAKEHOLDER_ROLES.find((r) => r.id === roleId);
    setFormData((prev) => ({
      ...prev,
      organizationType: roleId,
      licenseType: roleConfig ? roleConfig.defaultLicenseType : prev.licenseType,
    }));
    // Clear role error if any
    if (fieldErrors.organizationType) {
      setFieldErrors((prev) => ({ ...prev, organizationType: null }));
    }
  };

  // Drag and drop handlers
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
        licenseFile: 'Unsupported document format. Please upload a valid PDF, JPG, or PNG regulatory certificate.',
      }));
      return;
    }

    // 5MB Limit matching backend uploadMiddleware.js
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        licenseFile: `File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a compressed document.`,
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

  // Field-level validation
  const validateForm = () => {
    const errors = {};

    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization legal entity name is required.';
    } else if (formData.organizationName.trim().length < 2) {
      errors.organizationName = 'Organization name must be at least 2 characters.';
    }

    if (!formData.name.trim()) {
      errors.name = 'Full name of authorized representative is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Representative name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Official corporate/institutional email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid official email address.';
    }

    if (formData.contactPhone && formData.contactPhone.trim().length < 7) {
      errors.contactPhone = 'Please provide a valid telephone number with area code.';
    }

    if (!formData.licenseNumber.trim()) {
      errors.licenseNumber = 'Official regulatory license number is required.';
    } else if (formData.licenseNumber.trim().length < 3) {
      errors.licenseNumber = 'Please provide a valid license registration number.';
    }

    if (!licenseFile) {
      errors.licenseFile = 'Regulatory license verification document is required.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must contain at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreedToTerms) {
      errors.agreedToTerms = 'You must declare authorized representative status to proceed.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      const firstErrorKey = Object.keys(fieldErrors)[0];
      const element = document.getElementById(firstErrorKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setLoadingStepText('Validating compliance credentials...');

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
      setLoadingStepText('Uploading regulatory license document...');
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
        // Map known backend error responses
        const backendMsg = res?.message || 'Registration failed.';
        if (backendMsg.includes('Email is already registered')) {
          setGeneralError('This official email address is already registered in Secure Pharma. Please sign in or use a different email.');
          setFieldErrors((prev) => ({ ...prev, email: 'Email already in use.' }));
        } else if (backendMsg.includes('License number is already registered')) {
          setGeneralError('This regulatory license number is already associated with an existing organization. Please contact compliance support if this is an error.');
          setFieldErrors((prev) => ({ ...prev, licenseNumber: 'License number already registered.' }));
        } else {
          setGeneralError(backendMsg);
        }
      }
    } catch (err) {
      setGeneralError(err.message || 'Unable to connect to the Secure Pharma registry. Please verify backend connection.');
    } finally {
      setLoading(false);
      setLoadingStepText('');
    }
  };

  const selectedRoleConfig = STAKEHOLDER_ROLES.find((r) => r.id === formData.organizationType) || STAKEHOLDER_ROLES[0];
  const isPasswordValidLength = formData.password.length >= 6;
  const isPasswordMatch = Boolean(formData.password && formData.confirmPassword && formData.password === formData.confirmPassword);

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'stretch', background: '#f8fafc' }}>
      {/* Left Column: Enterprise Compliance & Trust Banner (Desktop Only) */}
      <div
        className="desktop-only-banner"
        style={{
          flex: '1 1 44%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #172554 100%)',
          padding: '56px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Matrix Pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        {/* Top Branding */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
              }}
            >
              <ShieldCheck style={{ width: '26px', height: '26px', color: '#ffffff' }} />
            </div>
            <div>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff', display: 'block' }}>
                Secure Pharma
              </span>
              <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: '700', letterSpacing: '0.06em' }}>
                FEDERAL SUPPLY CHAIN REGISTRY
              </span>
            </div>
          </div>
        </div>

        {/* Hero & Onboarding Assurance */}
        <div style={{ position: 'relative', zIndex: 2, margin: '28px 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(147, 197, 253, 0.3)',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#60a5fa',
              marginBottom: '20px',
            }}
          >
            <Sparkles style={{ width: '14px', height: '14px' }} />
            21 CFR Part 11 & DSCSA Regulatory Compliant
          </div>

          <h1
            style={{
              fontSize: '2.3rem',
              fontWeight: '900',
              lineHeight: 1.25,
              marginBottom: '16px',
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}
          >
            Institutional Onboarding for Pharmaceutical Stakeholders
          </h1>

          <p
            style={{
              fontSize: '0.98rem',
              color: '#94a3b8',
              lineHeight: 1.65,
              maxWidth: '480px',
              marginBottom: '32px',
            }}
          >
            Join a credentialed network of licensed pharmaceutical manufacturers, wholesale distributors, and dispensing pharmacies. Every organization undergoes regulatory document audit and cryptographic verification prior to platform activation.
          </p>

          {/* Verification Workflow Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(37, 99, 235, 0.25)',
                  border: '1px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#93c5fd',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Entity Application & Document Submission
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Register institutional profile with active state/federal drug licenses.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(5, 150, 105, 0.25)',
                  border: '1px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6ee7b7',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Cryptographic License Proofing
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Uploaded certificate is SHA-256 hashed and timestamped for immutable provenance.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(217, 119, 6, 0.25)',
                  border: '1px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fcd34d',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Regulatory Authority Review
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Compliance officers verify operating permits and good distribution standards.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(124, 58, 237, 0.25)',
                  border: '1px solid #8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c4b5fd',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
              >
                4
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Custodial Ledger Access
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  Upon approval, stakeholders mint, transfer, or verify authentic batches.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Compliance Guarantee */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileCheck style={{ width: '22px', height: '22px', color: '#38bdf8' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff' }}>Zero Counterfeit Tolerance</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Only verified entities participate in the custodial chain</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Registration Form Container */}
      <div
        style={{
          flex: '1 1 56%',
          padding: '40px 32px',
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ maxWidth: '720px', width: '100%' }}>
          {/* Mobile Header (Hidden on desktop) */}
          <div className="mobile-only-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck style={{ width: '22px', height: '22px', color: '#ffffff' }} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                Secure Pharma
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Federal Pharmaceutical Supply Chain Regulatory Registration
            </p>
          </div>

          {/* Conditional Rendering: Success Screen vs Registration Form */}
          {registrationSuccess ? (
            /* ========================================================================= */
            /* SUCCESS CONFIRMATION STATE                                               */
            /* ========================================================================= */
            <div
              className="glass-card"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '40px 36px',
                boxShadow: 'var(--shadow-lg)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                }}
              >
                <CheckCircle2 style={{ width: '40px', height: '40px', color: '#ffffff' }} />
              </div>

              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: '#ecfdf5',
                  color: '#047857',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  letterSpacing: '0.04em',
                  marginBottom: '10px',
                  border: '1px solid #a7f3d0',
                }}
              >
                SUBMISSION RECORDED ON REGULATORY LEDGER
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                Registration Application Submitted
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto 28px' }}>
                Your pharmaceutical organization profile and regulatory license certificate have been safely received and queued for regulatory inspection.
              </p>

              {/* Entity Details Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'left',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Organization Legal Name
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e3a8a' }}>
                      {registrationSuccess.organizationName}
                    </div>
                  </div>
                  <StatusBadge status={registrationSuccess.organizationType} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>
                      REGULATORY LICENSE NUMBER
                    </span>
                    <span style={{ fontWeight: '700', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                      {registrationSuccess.licenseNumber}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>
                      INITIAL ACCOUNT STATUS
                    </span>
                    <StatusBadge status="PENDING" />
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>
                      OFFICIAL EMAIL
                    </span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>
                      {registrationSuccess.email}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>
                      DOCUMENT PROOFING
                    </span>
                    <span style={{ color: '#059669', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px' }} /> Cryptographically Hashed
                    </span>
                  </div>
                </div>
              </div>

              {/* What Happens Next Guidance */}
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  textAlign: 'left',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: '700', fontSize: '0.88rem', marginBottom: '6px' }}>
                  <Clock style={{ width: '16px', height: '16px' }} />
                  What happens next?
                </div>
                <p style={{ fontSize: '0.82rem', color: '#1e3a8a', lineHeight: 1.5, margin: 0 }}>
                  1. Drug authority regulators will inspect your uploaded license credentials.<br />
                  2. Once verified, your status will be updated to <strong>APPROVED</strong>.<br />
                  3. You can then sign in with your authorized email and password to access your role-specific dashboard.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{
                    padding: '12px 28px',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  Go to Sign In
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </Link>

                <Link
                  to={`/pending-verification?email=${encodeURIComponent(registrationSuccess.email)}&registered=true`}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ExternalLink style={{ width: '16px', height: '16px' }} />
                  Track Verification Status
                </Link>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* REGISTRATION FORM                                                         */
            /* ========================================================================= */
            <div
              className="glass-card"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '36px 32px',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {/* Form Title & Context */}
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                  Create your Secure Pharma account
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  Register as a verified supply-chain user for FDA / cGMP pharmaceutical authorization.
                </p>
              </div>

              {/* General Backend Error Banner */}
              {generalError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    marginBottom: '24px',
                  }}
                  role="alert"
                >
                  <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '2px', color: '#dc2626' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', marginBottom: '2px' }}>Registration Error</div>
                    <div>{generalError}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* ------------------------------------------------------------- */}
                {/* STEP 1: ROLE SELECTION                                       */}
                {/* ------------------------------------------------------------- */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      1. Select Stakeholder Role *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Determines required license compliance
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {STAKEHOLDER_ROLES.map((role) => {
                      const IconComponent = role.icon;
                      const isSelected = formData.organizationType === role.id;

                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleRoleSelect(role.id)}
                          style={{
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                            borderRadius: '12px',
                            padding: '16px 14px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            boxShadow: isSelected ? '0 4px 14px rgba(37, 99, 235, 0.15)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: isSelected ? '#2563eb' : '#f1f5f9',
                                color: isSelected ? '#ffffff' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <IconComponent style={{ width: '20px', height: '20px' }} />
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: '700',
                                padding: '3px 8px',
                                borderRadius: '9999px',
                                background: isSelected ? '#dbeafe' : '#f1f5f9',
                                color: isSelected ? '#1d4ed8' : '#64748b',
                              }}
                            >
                              {role.badge}
                            </span>
                          </div>

                          <div>
                            <div style={{ fontWeight: '800', fontSize: '0.95rem', color: isSelected ? '#1e40af' : '#1e293b' }}>
                              {role.label}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: isSelected ? '#1d4ed8' : '#334155', fontWeight: '600', marginTop: '2px' }}>
                              {role.actionText}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.35, marginTop: '2px' }}>
                              {role.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: ORGANIZATION PROFILE                                  */}
                {/* ------------------------------------------------------------- */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '22px',
                    marginBottom: '26px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#1d4ed8', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.04em' }}>
                    <Building2 style={{ width: '18px', height: '18px' }} />
                    2. PHARMACEUTICAL ENTITY PROFILE
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {/* Organization Name */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label
                        htmlFor="organizationName"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}
                      >
                        ORGANIZATION LEGAL ENTITY NAME *
                      </label>
                      <input
                        id="organizationName"
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => {
                          setFormData({ ...formData, organizationName: e.target.value });
                          if (fieldErrors.organizationName) setFieldErrors({ ...fieldErrors, organizationName: null });
                        }}
                        placeholder="e.g. Apex BioPharma Laboratories Inc."
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.organizationName ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.88rem',
                          background: '#ffffff',
                          outline: 'none',
                        }}
                      />
                      {fieldErrors.organizationName && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle style={{ width: '13px', height: '13px' }} /> {fieldErrors.organizationName}
                        </div>
                      )}
                    </div>

                    {/* Facility Address */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label
                        htmlFor="address"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}
                      >
                        FACILITY / HEADQUARTERS ADDRESS
                      </label>
                      <div style={{ position: 'relative' }}>
                        <MapPin style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#94a3b8' }} />
                        <input
                          id="address"
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="e.g. 100 Innovation Boulevard, Suite 400, Cambridge, MA 02142"
                          style={{
                            width: '100%',
                            padding: '11px 14px 11px 36px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem',
                            background: '#ffffff',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label
                        htmlFor="contactPhone"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}
                      >
                        OFFICE TELEPHONE NUMBER
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#94a3b8' }} />
                        <input
                          id="contactPhone"
                          type="tel"
                          value={formData.contactPhone}
                          onChange={(e) => {
                            setFormData({ ...formData, contactPhone: e.target.value });
                            if (fieldErrors.contactPhone) setFieldErrors({ ...fieldErrors, contactPhone: null });
                          }}
                          placeholder="+1 (555) 019-2834"
                          style={{
                            width: '100%',
                            padding: '11px 14px 11px 36px',
                            borderRadius: '8px',
                            border: `1px solid ${fieldErrors.contactPhone ? '#ef4444' : '#cbd5e1'}`,
                            fontSize: '0.88rem',
                            background: '#ffffff',
                            outline: 'none',
                          }}
                        />
                      </div>
                      {fieldErrors.contactPhone && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle style={{ width: '13px', height: '13px' }} /> {fieldErrors.contactPhone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: REGULATORY LICENSE & PROOF DOCUMENT                  */}
                {/* ------------------------------------------------------------- */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '22px',
                    marginBottom: '26px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#059669', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.04em' }}>
                    <FileCheck style={{ width: '18px', height: '18px' }} />
                    3. REGULATORY LICENSE & PROOF OF AUTHENTICITY
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    {/* License Number */}
                    <div>
                      <label
                        htmlFor="licenseNumber"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}
                      >
                        OFFICIAL LICENSE REGISTRATION NUMBER *
                      </label>
                      <input
                        id="licenseNumber"
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() });
                          if (fieldErrors.licenseNumber) setFieldErrors({ ...fieldErrors, licenseNumber: null });
                        }}
                        placeholder="e.g. FDA-MFG-2026-9042"
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${fieldErrors.licenseNumber ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: '0.88rem',
                          fontFamily: 'var(--font-mono)',
                          background: '#ffffff',
                          outline: 'none',
                        }}
                      />
                      {fieldErrors.licenseNumber && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle style={{ width: '13px', height: '13px' }} /> {fieldErrors.licenseNumber}
                        </div>
                      )}
                    </div>

                    {/* License Type */}
                    <div>
                      <label
                        htmlFor="licenseType"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}
                      >
                        LICENSE CLASSIFICATION *
                      </label>
                      <select
                        id="licenseType"
                        value={formData.licenseType}
                        onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          background: '#ffffff',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {LICENSE_CLASSIFICATIONS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Drag-and-Drop License Upload Dropzone */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      UPLOAD REGULATORY LICENSE CERTIFICATE *
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
                          border: `2px dashed ${dragActive ? '#2563eb' : fieldErrors.licenseFile ? '#ef4444' : '#94a3b8'}`,
                          borderRadius: '12px',
                          background: dragActive ? '#eff6ff' : '#ffffff',
                          padding: '28px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: dragActive ? '#dbeafe' : '#f1f5f9',
                            color: dragActive ? '#2563eb' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 12px',
                          }}
                        >
                          <UploadCloud style={{ width: '26px', height: '26px' }} />
                        </div>

                        <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                          Drag & drop your license document here, or{' '}
                          <span style={{ color: '#2563eb', textDecoration: 'underline' }}>browse</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                          Supported formats: PDF, JPG, JPEG, PNG • Maximum size: 5 MB
                        </p>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            color: '#059669',
                            background: '#ecfdf5',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: '600',
                          }}
                        >
                          <ShieldCheck style={{ width: '13px', height: '13px' }} /> Document will be cryptographically hashed (SHA-256)
                        </span>
                      </div>
                    ) : (
                      /* Attached Document Card */
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          background: '#ffffff',
                          border: '1px solid #10b981',
                          borderRadius: '10px',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: '#ecfdf5',
                              color: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <FileText style={{ width: '22px', height: '22px' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: '700',
                                fontSize: '0.88rem',
                                color: '#0f172a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={licenseFile.name}
                            >
                              {licenseFile.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                              {(licenseFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for cryptographic audit
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: '#334155',
                              cursor: 'pointer',
                            }}
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Remove attached document"
                          >
                            <X style={{ width: '15px', height: '15px' }} />
                          </button>
                        </div>
                      </div>
                    )}

                    {fieldErrors.licenseFile && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle style={{ width: '13px', height: '13px' }} /> {fieldErrors.licenseFile}
                      </div>
                    )}
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* STEP 4: AUTHORIZED REPRESENTATIVE & CREDENTIALS               */}
                {/* ------------------------------------------------------------- */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '22px',
                    marginBottom: '26px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#7c3aed', fontWeight: '700', fontSize: '0.85rem', letterSpacing: '0.04em' }}>
                    <User style={{ width: '18px', height: '18px' }} />
                    4. AUTHORIZED REPRESENTATIVE CREDENTIALS
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {/* Full Legal Name */}
                    <div>
                      <label
                        htmlFor="representativeName"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}
                      >
                        REPRESENTATIVE FULL NAME *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#94a3b8' }} />
                        <input
                          id="representativeName"
                          type="text"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                          }}
                          placeholder="e.g. Dr. Eleanor Vance"
                          style={{
                            width: '100%',
                            padding: '11px 14px 11px 36px',
                            borderRadius: '8px',
                            border: `1px solid ${fieldErrors.name ? '#ef4444' : '#cbd5e1'}`,
                            fontSize: '0.88rem',
                            background: '#ffffff',
                            outline: 'none',
                          }}
                        />
                      </div>
                      {fieldErrors.name && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle style={{ width: '13px', height: '13px' }} /> {fieldErrors.name}
                        </div>
                      )}
                    </div>

                    {/* Official Work Email */}
                    <div>
                      <label
                        htmlFor="officialEmail"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}
                      >
                        OFFICIAL CORPORATE / INSTITUTIONAL EMAIL *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#94a3b8' }} />
                        <input
                          id="officialEmail"
                          type="email"
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                          }}
                          placeholder="e.g. compliance@apexbiopharma.com"
                          style={{
                            width: '100%',
                            padding: '11px 14px 11px 36px',
                            borderRadius: '8px',
                            border: `1px solid ${fieldErrors.email ? '#ef4444' : '#cbd5e1'}`,
                            fontSize: '0.88rem',
                            background: '#ffffff',
                            outline: 'none',
                          }}
                        />
                      </div>
                      {fieldErrors.email && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle style={{ width: '13px', height: '13px' }} /> {fieldErrors.email}
                        </div>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        htmlFor="password"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}
                      >
                        ACCOUNT PASSWORD *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#94a3b8' }} />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => {
                            setFormData({ ...formData, password: e.target.value });
                            if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                          }}
                          placeholder="••••••••••••"
                          style={{
                            width: '100%',
                            padding: '11px 40px 11px 36px',
                            borderRadius: '8px',
                            border: `1px solid ${fieldErrors.password ? '#ef4444' : '#cbd5e1'}`,
                            fontSize: '0.88rem',
                            background: '#ffffff',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '2px',
                          }}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle style={{ width: '13px', height: '13px' }} /> {fieldErrors.password}
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}
                      >
                        CONFIRM PASSWORD *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '12px', top: '12px', width: '16px', height: '16px', color: '#94a3b8' }} />
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => {
                            setFormData({ ...formData, confirmPassword: e.target.value });
                            if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null });
                          }}
                          placeholder="••••••••••••"
                          style={{
                            width: '100%',
                            padding: '11px 40px 11px 36px',
                            borderRadius: '8px',
                            border: `1px solid ${fieldErrors.confirmPassword ? '#ef4444' : '#cbd5e1'}`,
                            fontSize: '0.88rem',
                            background: '#ffffff',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: '2px',
                          }}
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle style={{ width: '13px', height: '13px' }} /> {fieldErrors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Real-time Password Requirements Checklist */}
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      flexWrap: 'wrap',
                      fontSize: '0.76rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isPasswordValidLength ? '#059669' : '#64748b' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: isPasswordValidLength ? '#059669' : '#cbd5e1' }} />
                      <span>Minimum 6 characters</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isPasswordMatch ? '#059669' : '#64748b' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: isPasswordMatch ? '#059669' : '#cbd5e1' }} />
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* STEP 5: REGULATORY DECLARATION & SUBMISSION                   */}
                {/* ------------------------------------------------------------- */}
                <div style={{ marginBottom: '28px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      color: '#334155',
                      lineHeight: 1.5,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (fieldErrors.agreedToTerms) setFieldErrors({ ...fieldErrors, agreedToTerms: null });
                      }}
                      style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>
                      I certify that I am an authorized corporate officer or designated compliance representative of this pharmaceutical entity. The provided licensing credentials are valid, authentic, and subject to federal regulatory inspection under 21 CFR Part 11 and DSCSA requirements.
                    </span>
                  </label>
                  {fieldErrors.agreedToTerms && (
                    <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle style={{ width: '13px', height: '13px' }} /> {fieldErrors.agreedToTerms}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.8 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                      <span>{loadingStepText || 'Submitting Registration to Regulatory Board...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Submit for Regulatory Audit</span>
                      <ArrowRight style={{ width: '18px', height: '18px' }} />
                    </>
                  )}
                </button>
              </form>

              {/* Login Navigation Link */}
              <div
                style={{
                  textAlign: 'center',
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '0.85rem',
                  color: 'var(--text-dim)',
                }}
              >
                Already have a registered & approved account?{' '}
                <Link
                  to="/login"
                  style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}
                >
                  Sign in here →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
