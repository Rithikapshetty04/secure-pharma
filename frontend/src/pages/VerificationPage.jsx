import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import QRCodeGenerator from '../components/QRCodeGenerator';

export default function VerificationPage() {
  const { identifier } = useParams();
  const navigate = useNavigate();

  const [inputVal, setInputVal] = useState(identifier || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const performVerification = async (targetId) => {
    if (!targetId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyProduct(targetId);
      if (res.success) {
        setData(res);
      } else {
        setError(res.message || 'Verification service failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to verification ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (identifier) {
      setInputVal(identifier);
      performVerification(identifier);
    }
  }, [identifier]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    navigate(`/verify/${encodeURIComponent(inputVal.trim())}`);
  };

  const getResultHeader = (status) => {
    switch (status) {
      case 'AUTHENTIC':
        return {
          title: 'GENUINE PHARMACEUTICAL PRODUCT',
          subtitle: 'Verified authentic against federal regulatory registry and immutable custody chain.',
          color: '#047857',
          icon: '✅',
          bg: '#ecfdf5',
          border: '#a7f3d0',
        };
      case 'RECALLED':
        return {
          title: 'OFFICIAL RECALL ORDER ACTIVE',
          subtitle: 'This batch has been marked as RECALLED. Do not dispense, sell, or consume.',
          color: '#b91c1c',
          icon: '🛑',
          bg: '#fef2f2',
          border: '#fecaca',
        };
      case 'EXPIRED':
        return {
          title: 'EXPIRED PHARMACEUTICAL BATCH',
          subtitle: 'This batch has passed its certified expiration date. Discard per safety protocols.',
          color: '#b45309',
          icon: '⚠️',
          bg: '#fffbeb',
          border: '#fde68a',
        };
      case 'SUSPICIOUS':
        return {
          title: 'SUSPICIOUS / UNVERIFIED PRODUCT',
          subtitle: 'Regulatory checks failed. Unregistered entity or broken custodial provenance.',
          color: '#be123c',
          icon: '🚨',
          bg: '#fff1f2',
          border: '#fecdd3',
        };
      default:
        return {
          title: 'NO REGISTERED LEDGER RECORD',
          subtitle: 'Identifier was not found. This product may be unregistered or counterfeit.',
          color: '#475569',
          icon: '❌',
          bg: '#f8fafc',
          border: '#e2e8f0',
        };
    }
  };

  const statusConfig = data ? getResultHeader(data.status) : null;

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto 80px', padding: '0 20px' }}>
      {/* Search Header */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px', background: '#ffffff' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            required
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search by QR identifier (e.g. SP-...) or Batch Number..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.95rem',
            }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Verifying...' : 'Verify Product'}
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="live-dot" style={{ width: '24px', height: '24px', margin: '0 auto 16px' }}></div>
          <div style={{ color: '#1d4ed8', fontWeight: '700', fontSize: '1.1rem' }}>
            Executing 9-Point Distributed Verification Algorithm...
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '6px' }}>
            Verifying manufacturer license, expiration, recall state, and custody trail
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
          <h3>Verification Query Failed</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{error}</p>
        </div>
      )}

      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Trust Result Banner */}
          <div style={{
            background: statusConfig.bg,
            border: `2px solid ${statusConfig.border}`,
            borderRadius: 'var(--radius-lg)',
            padding: '32px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{statusConfig.icon}</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: statusConfig.color, marginBottom: '6px' }}>
              {statusConfig.title}
            </h2>
            <p style={{ fontSize: '1rem', color: '#1e293b', maxWidth: '680px', margin: '0 auto 16px', lineHeight: 1.5, fontWeight: '500' }}>
              {data.message}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <StatusBadge status={data.status} />
              {data.batch?.batchNumber && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: '600' }}>
                  Batch #{data.batch.batchNumber}
                </span>
              )}
            </div>
          </div>

          {/* 9-Point Verification Checklist */}
          {data.checks && Object.keys(data.checks).length > 0 && (
            <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a' }}>
                <span>🛡️</span> 9-Point Regulatory Integrity Checklist
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
              }}>
                {[
                  { key: 'productExists', label: 'Formulary Drug Registered' },
                  { key: 'batchExists', label: 'Batch Hashed on Ledger' },
                  { key: 'manufacturerVerified', label: 'Manufacturer Verified & Approved' },
                  { key: 'licenseValid', label: 'Regulatory License Active & Unexpired' },
                  { key: 'batchNotExpired', label: 'Product Within Expiration Window' },
                  { key: 'batchNotRecalled', label: 'No Active Recall Orders' },
                  { key: 'supplyChainConsistent', label: 'Custodial Chain Consistent' },
                  { key: 'identifierValid', label: 'QR Serialization Signature Valid' },
                  { key: 'notFlagged', label: 'No Adverse Supply Chain Flags' },
                ].map((item) => {
                  const passed = Boolean(data.checks[item.key]);
                  return (
                    <div
                      key={item.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: passed ? '#ecfdf5' : '#fef2f2',
                        border: `1px solid ${passed ? '#a7f3d0' : '#fecaca'}`,
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: passed ? '#065f46' : '#991b1b', fontWeight: '500' }}>{item.label}</span>
                      <span style={{ fontWeight: '700', color: passed ? '#047857' : '#b91c1c' }}>
                        {passed ? '✓ PASSED' : '✕ FAILED'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details Grid */}
          {data.product && data.batch && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}>
              {/* Product Card */}
              <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1d4ed8' }}>
                  💊 Pharmaceutical Specifications
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>DRUG NAME</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-heading)' }}>{data.product.name}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>GENERIC NAME</span>
                      <strong style={{ color: 'var(--text-heading)' }}>{data.product.genericName || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>BRAND NAME</span>
                      <strong style={{ color: 'var(--text-heading)' }}>{data.product.brandName || 'N/A'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>DOSAGE & STRENGTH</span>
                      <strong style={{ color: 'var(--text-heading)' }}>{data.product.dosageForm} ({data.product.strength})</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>PRODUCT CODE / NDC</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-heading)' }}>{data.product.productCode}</strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>STORAGE CRITERIA</span>
                    <span style={{ color: 'var(--text-muted)' }}>{data.product.storageRequirements}</span>
                  </div>
                </div>
              </div>

              {/* Batch & Manufacturer Card */}
              <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#059669' }}>
                  🏭 Batch & Manufacturer Credentials
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>MANUFACTURER</span>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-heading)' }}>{data.manufacturer?.name}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>LICENSE NUMBER</span>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-heading)' }}>{data.manufacturer?.licenseNumber}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>LICENSE STATUS</span>
                      <StatusBadge status={data.manufacturer?.licenseStatus} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>MANUFACTURING DATE</span>
                      <strong style={{ color: 'var(--text-heading)' }}>{new Date(data.batch.manufacturingDate).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>EXPIRATION DATE</span>
                      <strong style={{ color: new Date(data.batch.expiryDate) < new Date() ? '#dc2626' : '#059669' }}>
                        {new Date(data.batch.expiryDate).toLocaleDateString()}
                      </strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>ISSUING REGULATOR</span>
                    <span style={{ color: 'var(--text-muted)' }}>{data.manufacturer?.issuingAuthority}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR Code & Direct Proof */}
          {data.batch && (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', background: '#ffffff' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#1e3a8a' }}>Digital QR Authenticity Stamp</h3>
              <QRCodeGenerator
                identifier={data.batch.qrIdentifier || data.batch.batchNumber}
                batchNumber={data.batch.batchNumber}
                productName={data.product?.name}
                size={220}
              />
            </div>
          )}

          {/* Chronological Custodial Provenance */}
          <div className="glass-card" style={{ padding: '24px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#1e3a8a' }}>⛓️ Complete Supply Chain Provenance</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Audited custodial handover checkpoints
                </p>
              </div>
              <span className="badge badge-info">
                {data.timeline?.length || 0} Checkpoints
              </span>
            </div>

            <Timeline events={data.timeline} />
          </div>
        </div>
      )}
    </div>
  );
}
