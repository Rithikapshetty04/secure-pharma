import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import QRCodeGenerator from '../components/QRCodeGenerator';
import QRCodeScanner from '../components/QRCodeScanner';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  AlertCircle,
  FileX,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Building2,
  Factory,
  Pill,
  Layers,
  Lock,
  Share2,
  Search,
} from 'lucide-react';

export default function VerificationPage() {
  const { identifier } = useParams();
  const navigate = useNavigate();

  const [inputVal, setInputVal] = useState(identifier || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(identifier));
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const performVerification = async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyProduct(targetId);
      if (res && res.success) {
        setData(res);
      } else {
        setError(res?.message || 'Verification service query failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to SecurePharma verification network.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (identifier) {
      setInputVal(identifier);
      performVerification(identifier);
    } else {
      setData(null);
      setLoading(false);
      setError(null);
    }
  }, [identifier]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    navigate(`/verify/${encodeURIComponent(inputVal.trim())}`);
  };

  const handleCopyLink = () => {
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyHash = (hashText) => {
    if (!hashText) return;
    navigator.clipboard.writeText(hashText);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getResultHeaderConfig = (status) => {
    switch (status) {
      case 'AUTHENTIC':
        return {
          title: 'Supply-Chain Record Verified',
          subtitle: 'Recorded supply-chain information matches the verification record on the regulatory ledger.',
          color: '#047857',
          bg: '#ecfdf5',
          border: '#a7f3d0',
          badgeBg: '#10b981',
          icon: CheckCircle2,
        };
      case 'RECALLED':
        return {
          title: 'Official Recall Order Active',
          subtitle: 'This batch has been marked as RECALLED by regulatory authorities. Do not dispense, sell, or consume.',
          color: '#b91c1c',
          bg: '#fef2f2',
          border: '#fecaca',
          badgeBg: '#ef4444',
          icon: AlertTriangle,
        };
      case 'EXPIRED':
        return {
          title: 'Expired Pharmaceutical Batch',
          subtitle: 'This batch has passed its recorded expiration date. Discard per pharmaceutical safety protocols.',
          color: '#b45309',
          bg: '#fffbeb',
          border: '#fde68a',
          badgeBg: '#f59e0b',
          icon: Clock,
        };
      case 'SUSPICIOUS':
        return {
          title: 'Suspicious / Unverified Product',
          subtitle: 'Regulatory checks failed. Unverified manufacturer license or broken chain of custody.',
          color: '#be123c',
          bg: '#fff1f2',
          border: '#fecdd3',
          badgeBg: '#f43f5e',
          icon: AlertCircle,
        };
      default:
        return {
          title: 'No Registered Ledger Record',
          subtitle: 'We could not find a SecurePharma record for this batch ID. Please check the serial code and try again.',
          color: '#475569',
          bg: '#f8fafc',
          border: '#e2e8f0',
          badgeBg: '#64748b',
          icon: FileX,
        };
    }
  };

  // =========================================================================
  // VIEW 1: PUBLIC VERIFICATION LANDING PAGE (NO IDENTIFIER SPECIFIED)
  // =========================================================================
  if (!identifier) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '40px 20px 80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Top Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #0369a1 100%)',
              borderRadius: '20px',
              padding: '44px 36px',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: '36px',
              boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.3)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
              }}
            >
              <ShieldCheck style={{ width: '28px', height: '28px', color: '#ffffff' }} />
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.02em' }}>
              Medicine Authenticity & Supply-Chain Verification
            </h1>

            <p style={{ fontSize: '1rem', color: '#cbd5e1', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
              Scan the QR code printed on your medicine package or enter the batch ID manually to inspect its recorded supply-chain journey and regulatory credentials.
            </p>
          </div>

          {/* Interactive QR Scanner & Search Component */}
          <QRCodeScanner />

          {/* Educational Trust Note */}
          <div
            style={{
              marginTop: '40px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
              About SecurePharma Verification
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto' }}>
              SecurePharma tracks digital chain-of-custody records for licensed pharmaceutical manufacturers, distributors, and pharmacies. Verification checks recorded batch data against stored cryptographic hashes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: BATCH VERIFICATION RESULT PAGE (/verify/:identifier)
  // =========================================================================
  const statusConfig = data ? getResultHeaderConfig(data.status) : null;
  const StatusIcon = statusConfig?.icon || ShieldCheck;

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '36px 20px 80px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Navigation & Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '28px',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/verify"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#2563eb',
              fontWeight: '700',
              fontSize: '0.88rem',
              textDecoration: 'none',
              background: '#ffffff',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Verify Another Batch
          </Link>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: '1 1 340px', maxWidth: '480px' }}>
            <input
              type="text"
              required
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search by QR or Batch ID..."
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none',
                background: '#ffffff',
              }}
            />
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>
              <Search style={{ width: '16px', height: '16px' }} />
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '60px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            <RefreshCw style={{ width: '32px', height: '32px', color: '#2563eb', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              Verifying Batch Record...
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
              Retrieving supply-chain history and verifying cryptographic proofs...
            </p>
          </div>
        )}

        {/* Network / Server Error State */}
        {error && !loading && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #fecaca',
              padding: '40px 28px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            }}
          >
            <AlertCircle style={{ width: '40px', height: '40px', color: '#dc2626', margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#991b1b', marginBottom: '8px' }}>
              Verification Temporarily Unavailable
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.5 }}>
              {error}
            </p>
            <button
              type="button"
              onClick={() => performVerification(identifier)}
              className="btn btn-primary"
              style={{ padding: '10px 22px' }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Verification Result View */}
        {data && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Prominent Verification Result Banner */}
            <div
              style={{
                background: statusConfig.bg,
                border: `2px solid ${statusConfig.border}`,
                borderRadius: '16px',
                padding: '32px 28px',
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: statusConfig.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                }}
              >
                <StatusIcon style={{ width: '32px', height: '32px', color: '#ffffff' }} />
              </div>

              <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: statusConfig.color, marginBottom: '8px' }}>
                {statusConfig.title}
              </h2>

              <p style={{ fontSize: '0.95rem', color: '#334155', maxWidth: '640px', margin: '0 auto 20px', lineHeight: 1.6, fontWeight: '500' }}>
                {data.message}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <StatusBadge status={data.status} />
                {data.batch?.batchNumber && (
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569', fontWeight: '700', background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    Batch #{data.batch.batchNumber}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    color: '#2563eb',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedLink ? <Check style={{ width: '14px', height: '14px', color: '#059669' }} /> : <Share2 style={{ width: '14px', height: '14px' }} />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* 9-Point Regulatory Integrity Checklist */}
            {data.checks && Object.keys(data.checks).length > 0 && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#0f172a', fontWeight: '800', fontSize: '1rem' }}>
                  <ShieldCheck style={{ width: '20px', height: '20px', color: '#2563eb' }} />
                  Automated Supply-Chain Integrity Checklist
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {[
                    { key: 'productExists', label: 'Formulary Drug Registered' },
                    { key: 'batchExists', label: 'Batch Hashed on Ledger' },
                    { key: 'manufacturerVerified', label: 'Manufacturer Verified' },
                    { key: 'licenseValid', label: 'Regulatory License Active' },
                    { key: 'batchNotExpired', label: 'Product Unexpired' },
                    { key: 'batchNotRecalled', label: 'No Active Recall Orders' },
                    { key: 'supplyChainConsistent', label: 'Custodial History Verified' },
                    { key: 'identifierValid', label: 'QR Serialization Valid' },
                    { key: 'notFlagged', label: 'No Safety Flags' },
                  ].map((item) => {
                    const passed = Boolean(data.checks[item.key]);
                    return (
                      <div
                        key={item.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px',
                          background: passed ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${passed ? '#bbf7d0' : '#fecaca'}`,
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                        }}
                      >
                        <span style={{ color: passed ? '#166534' : '#991b1b', fontWeight: '600' }}>{item.label}</span>
                        <span style={{ fontWeight: '700', color: passed ? '#15803d' : '#dc2626' }}>
                          {passed ? '✓ PASSED' : '✕ FAILED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product & Manufacturer Specifications Grid */}
            {data.product && data.batch && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '20px',
                }}
              >
                {/* Medicine Information */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#1d4ed8', fontWeight: '800', fontSize: '1rem' }}>
                    <Pill style={{ width: '20px', height: '20px' }} />
                    Medicine Specifications
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>DRUG NAME</span>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{data.product.name}</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>GENERIC NAME</span>
                        <strong style={{ color: '#334155' }}>{data.product.genericName || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>DOSAGE & STRENGTH</span>
                        <strong style={{ color: '#334155' }}>{data.product.dosageForm} ({data.product.strength})</strong>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>PRODUCT CODE / NDC</span>
                        <strong style={{ fontFamily: 'monospace', color: '#334155' }}>{data.product.productCode}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>STORAGE CRITERIA</span>
                        <span style={{ color: '#475569' }}>{data.product.storageRequirements || 'Standard'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batch & Manufacturer Credentials */}
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#059669', fontWeight: '800', fontSize: '1rem' }}>
                    <Factory style={{ width: '20px', height: '20px' }} />
                    Batch & Manufacturer Credentials
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>MANUFACTURER</span>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{data.manufacturer?.name || 'Authorized Plant'}</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>MANUFACTURING DATE</span>
                        <strong style={{ color: '#334155' }}>{new Date(data.batch.manufacturingDate).toLocaleDateString()}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>EXPIRATION DATE</span>
                        <strong style={{ color: new Date(data.batch.expiryDate) < new Date() ? '#dc2626' : '#059669' }}>
                          {new Date(data.batch.expiryDate).toLocaleDateString()}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>LICENSE NUMBER</span>
                        <strong style={{ fontFamily: 'monospace', color: '#334155' }}>{data.manufacturer?.licenseNumber || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>LICENSE STATUS</span>
                        <StatusBadge status={data.manufacturer?.licenseStatus || 'APPROVED'} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Supply-Chain Journey (Timeline) */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>
                    Supply-Chain Custody History
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0' }}>
                    Audited transfer checkpoints from formulation to current holder.
                  </p>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.78rem' }}>
                  {data.timeline?.length || 0} Checkpoints Logged
                </span>
              </div>

              <Timeline events={data.timeline} />
            </div>

            {/* Blockchain & Data Integrity Card */}
            {(data.cryptographicRootHash || data.batch?.batchHash) && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#0f172a', fontWeight: '800', fontSize: '1rem' }}>
                  <Layers style={{ width: '20px', height: '20px', color: '#7c3aed' }} />
                  Blockchain & Data Integrity Proof
                </div>

                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>
                  Blockchain verification confirms that the recorded batch information matches the cryptographic proof stored on the ledger.
                </p>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                      Cryptographic Root Hash (SHA-256)
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        color: '#1e293b',
                        wordBreak: 'break-all',
                      }}
                    >
                      {data.cryptographicRootHash || data.batch.batchHash}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyHash(data.cryptographicRootHash || data.batch.batchHash)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      color: '#2563eb',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {copiedHash ? <Check style={{ width: '14px', height: '14px', color: '#059669' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                    <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
