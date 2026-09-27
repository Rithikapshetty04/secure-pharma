import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import {
  ArrowLeft,
  ShieldCheck,
  QrCode,
  Package,
  Calendar,
  Building2,
  Clock,
  Layers,
  FileCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Hash,
  Share2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PharmacyBatchDetailsPage = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentCustodian, setCurrentCustodian] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBatchDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getBatchById(batchId);
      if (res && res.success && res.batch) {
        setBatch(res.order || res.batch);
        setEvents(res.events || []);
        setCurrentCustodian(res.currentCustodian || null);
        setVerification(res.verification || null);
      } else {
        setError(res?.message || 'Pharmaceutical batch not found or access denied.');
      }
    } catch (err) {
      console.error('Error fetching batch details:', err);
      setError(err.message || 'Server error loading pharmaceutical batch details.');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatchDetails();
  }, [fetchBatchDetails]);

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '60px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <Loader2 style={{ width: '40px', height: '40px', color: '#059669', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '1rem', fontWeight: '600' }}>Loading Batch Details & Cryptographic Traceability...</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '60px 20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px 32px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Batch Not Found or Access Denied</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '8px', marginBottom: '24px', lineHeight: '1.5' }}>
            {error || `Unable to locate pharmaceutical batch records for identifier: ${batchId}`}
          </p>
          <Link
            to="/pharmacy/received"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.88rem', background: '#059669', borderColor: '#059669' }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Back to Received Inventory
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const expDate = new Date(batch.expiryDate);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = expDate <= now;
  const isExpiringSoon = expDate > now && expDate <= thirtyDaysFromNow;

  const product = batch.product || {};
  const manufacturer = batch.manufacturer || {};

  const getVerificationBadge = () => {
    const vState = verification?.state || 'UNAVAILABLE';
    if (vState === 'VERIFIED') {
      return (
        <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.78rem', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck style={{ width: '15px', height: '15px' }} />
          SHA-256 Ledger Verified
        </span>
      );
    } else if (vState === 'MISMATCH') {
      return (
        <span style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.78rem', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <AlertCircle style={{ width: '15px', height: '15px' }} />
          Hash Mismatch Detected
        </span>
      );
    } else {
      return (
        <span style={{ background: '#fffbebfb', color: '#b45309', border: '1px solid #fde68a', fontSize: '0.78rem', fontWeight: '700', padding: '4px 12px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <AlertTriangle style={{ width: '15px', height: '15px' }} />
          Proof Verification Unavailable
        </span>
      );
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#f8fafc', padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Navigation Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              to="/pharmacy/received"
              className="btn btn-secondary"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}
              title="Back to Received Batches"
            >
              <ArrowLeft style={{ width: '18px', height: '18px' }} />
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0f172a', margin: 0, fontFamily: 'monospace' }}>
                  Batch #{batch.batchNumber}
                </h1>
                {getVerificationBadge()}
              </div>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px', margin: 0 }}>
                {product.name || 'Pharmaceutical Formulary'} {product.genericName ? `(${product.genericName})` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchBatchDetails()}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <RefreshCw style={{ width: '15px', height: '15px' }} />
              Sync Batch
            </button>
            <Link
              to={`/verify/${encodeURIComponent(batch.batchNumber)}`}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.88rem', background: '#059669', borderColor: '#059669' }}
            >
              <ShieldCheck style={{ width: '16px', height: '16px' }} />
              Verify Publicly
            </Link>
          </div>
        </div>

        {/* Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px' }}>
          {/* Left Column: Traceability & Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Cryptographic Proof Verification Card */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck style={{ width: '18px', height: '18px', color: '#059669' }} />
                Cryptographic Blockchain Proof & Hash Integrity
              </h3>

              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Ledger Status:</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: verification?.state === 'VERIFIED' ? '#047857' : '#d97706' }}>
                    {verification?.state || 'UNAVAILABLE'}
                  </span>
                </div>

                {batch.batchHash && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Canonical Batch Hash (SHA-256):
                    </span>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f172a', wordBreak: 'break-all' }}>
                      {batch.batchHash}
                    </div>
                  </div>
                )}

                {batch.blockchainTxHash && (
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                      Blockchain Transaction Reference:
                    </span>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#059669', wordBreak: 'break-all' }}>
                      {batch.blockchainTxHash}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                  <span>Network: <strong>{batch.blockchainNetwork || 'Sepolia Ethereum Testnet'}</strong></span>
                  {batch.blockNumber && <span>Block #: <strong>{batch.blockNumber}</strong></span>}
                </div>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '12px', marginBottom: 0, lineHeight: '1.4' }}>
                * Cryptographic verification confirms that digital batch specifications and minting credentials match the immutable ledger proof without requiring external wallet authorization.
              </p>
            </div>

            {/* Supply Chain Timeline */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock style={{ width: '18px', height: '18px', color: '#059669' }} />
                Chronological Supply Chain Custody Journey
              </h3>

              {events.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                  No recorded supply chain transfer events found for this batch.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {events.map((evt, idx) => {
                    const evtDate = new Date(evt.eventDate || evt.createdAt).toLocaleString();
                    const fromOrg = evt.fromOrganization?.name || 'Origin Facility';
                    const toOrg = evt.toOrganization?.name || 'Destination Facility';

                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            {evt.eventType}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600' }}>
                            {evtDate}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: '700' }}>
                          {evt.eventType === 'MANUFACTURED' ? (
                            `Minted & Certified by ${fromOrg}`
                          ) : (
                            `Transferred from ${fromOrg} → ${toOrg}`
                          )}
                        </div>

                        {evt.location && (
                          <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 style={{ width: '13px', height: '13px' }} />
                            Facility: {evt.location}
                          </div>
                        )}

                        {evt.notes && (
                          <div style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>
                            "{evt.notes}"
                          </div>
                        )}

                        {evt.transactionHash && (
                          <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#94a3b8', wordBreak: 'break-all', marginTop: '4px' }}>
                            Event Hash: {evt.transactionHash}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Product Specs & QR Code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Batch QR Code Card */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <QrCode style={{ width: '18px', height: '18px', color: '#059669' }} />
                Public QR Verification Code
              </h3>

              <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block', marginBottom: '14px' }}>
                <QRCodeSVG
                  value={`${window.location.origin}/verify/${batch.batchNumber}`}
                  size={160}
                  level="H"
                />
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                Scan to open the public 9-point verification flow. No login required.
              </p>

              <Link
                to={`/verify/${encodeURIComponent(batch.batchNumber)}`}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#047857' }}
              >
                <ShieldCheck style={{ width: '14px', height: '14px' }} />
                Open Public QR Page
              </Link>
            </div>

            {/* Product Specifications Card */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                Product Specifications
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Formulary Code:</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{product.productCode || 'PC-1001'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Dosage Form:</span>
                  <strong style={{ color: '#0f172a' }}>{product.dosageForm || 'Tablet'}</strong>
                </div>

                {product.strength && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Strength:</span>
                    <strong style={{ color: '#0f172a' }}>{product.strength}</strong>
                  </div>
                )}

                {product.category && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Category:</span>
                    <strong style={{ color: '#0f172a' }}>{product.category}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Dispensary Quantity:</span>
                  <strong style={{ color: batch.quantity < 20 ? '#d97706' : '#059669', fontSize: '0.9rem' }}>
                    {batch.quantity} {batch.unit || 'units'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Manufacturing Date:</span>
                  <span style={{ color: '#334155' }}>
                    {batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Expiry Date:</span>
                  <span style={{ fontWeight: '700', color: isExpired ? '#b91c1c' : isExpiringSoon ? '#b45309' : '#0f172a' }}>
                    {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Custody Information Card */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', margin: '0 0 14px 0', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                Custody & Origin
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Current Custodian:</span>
                  <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>
                    {currentCustodian?.name || batch.currentHolder?.name || 'Pharmacy Dispensary'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem' }}>Authorized Manufacturer:</span>
                  <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>
                    {manufacturer.name || 'Certified Pharmaceutical Labs'}
                  </strong>
                  {manufacturer.contactEmail && (
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{manufacturer.contactEmail}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyBatchDetailsPage;
