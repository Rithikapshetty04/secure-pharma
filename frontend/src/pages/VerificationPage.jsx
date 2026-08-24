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
          color: '#10b981',
          icon: '✅',
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.3)',
        };
      case 'RECALLED':
        return {
          title: 'OFFICIAL RECALL ORDER ACTIVE',
          subtitle: 'This batch has been marked as RECALLED. Do not dispense, sell, or consume.',
          color: '#ef4444',
          icon: '🛑',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.5)',
        };
      case 'EXPIRED':
        return {
          title: 'EXPIRED PHARMACEUTICAL BATCH',
          subtitle: 'This batch has passed its certified expiration date. Discard per safety protocols.',
          color: '#f59e0b',
          icon: '⚠️',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: 'rgba(245, 158, 11, 0.4)',
        };
      case 'SUSPICIOUS':
        return {
          title: 'SUSPICIOUS / UNVERIFIED PRODUCT',
          subtitle: 'Regulatory checks failed. Unregistered entity or broken custodial provenance.',
          color: '#f43f5e',
          icon: '🚨',
          bg: 'rgba(244, 63, 94, 0.15)',
          border: 'rgba(244, 63, 94, 0.5)',
        };
      default:
        return {
          title: 'NO REGISTERED LEDGER RECORD',
          subtitle: 'Identifier was not found. This product may be unregistered or counterfeit.',
          color: '#64748b',
          icon: '❌',
          bg: 'rgba(100, 116, 139, 0.15)',
          border: 'rgba(100, 116, 139, 0.4)',
        };
    }
  };

  const statusConfig = data ? getResultHeader(data.status) : null;

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto 80px', padding: '0 20px' }}>
      {/* Search Header */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
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
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
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
          <div style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '1.1rem' }}>
            Executing 9-Point Distributed Verification Algorithm...
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '6px' }}>
            Verifying manufacturer license, expiration, recall state, and custody trail
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: '#f87171' }}>
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
            padding: '30px 24px',
            textAlign: 'center',
            boxShadow: `0 0 30px ${statusConfig.bg}`,
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{statusConfig.icon}</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: statusConfig.color, marginBottom: '6px' }}>
              {statusConfig.title}
            </h2>
            <p style={{ fontSize: '1rem', color: '#fff', maxWidth: '680px', margin: '0 auto 16px', lineHeight: 1.5 }}>
              {data.message}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
              <StatusBadge status={data.status} />
              {data.batch?.batchNumber && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  Batch #{data.batch.batchNumber}
                </span>
              )}
            </div>
          </div>

          {/* 9-Point Verification Checklist */}
          {data.checks && Object.keys(data.checks).length > 0 && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                        background: passed ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.08)',
                        border: `1px solid ${passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: passed ? '#fff' : '#fca5a5' }}>{item.label}</span>
                      <span style={{ fontWeight: '700', color: passed ? '#10b981' : '#ef4444' }}>
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
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--accent-cyan)' }}>
                  💊 Pharmaceutical Specifications
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>DRUG NAME</span>
                    <strong style={{ fontSize: '1rem', color: '#fff' }}>{data.product.name}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>GENERIC NAME</span>
                      <strong>{data.product.genericName || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>BRAND NAME</span>
                      <strong>{data.product.brandName || 'N/A'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>DOSAGE & STRENGTH</span>
                      <strong>{data.product.dosageForm} ({data.product.strength})</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>PRODUCT CODE / NDC</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.product.productCode}</strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>STORAGE CRITERIA</span>
                    <span style={{ color: 'var(--text-muted)' }}>{data.product.storageRequirements}</span>
                  </div>
                </div>
              </div>

              {/* Batch & Manufacturer Card */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#10b981' }}>
                  🏭 Batch & Manufacturer Credentials
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>MANUFACTURER</span>
                    <strong style={{ fontSize: '1rem', color: '#fff' }}>{data.manufacturer?.name}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>LICENSE NUMBER</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.manufacturer?.licenseNumber}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>LICENSE STATUS</span>
                      <StatusBadge status={data.manufacturer?.licenseStatus} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>MANUFACTURING DATE</span>
                      <strong>{new Date(data.batch.manufacturingDate).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>EXPIRATION DATE</span>
                      <strong style={{ color: new Date(data.batch.expiryDate) < new Date() ? '#ef4444' : '#10b981' }}>
                        {new Date(data.batch.expiryDate).toLocaleDateString()}
                      </strong>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>ISSUING REGULATOR</span>
                    <span style={{ color: 'var(--text-muted)' }}>{data.manufacturer?.issuingAuthority}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR Code & Direct Proof */}
          {data.batch && (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Digital QR Authenticity Stamp</h3>
              <QRCodeGenerator
                identifier={data.batch.qrIdentifier || data.batch.batchNumber}
                batchNumber={data.batch.batchNumber}
                productName={data.product?.name}
                size={220}
              />
            </div>
          )}

          {/* Chronological Custodial Provenance */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>⛓️ Complete Supply Chain Provenance</h3>
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
